import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { requirePermission, getEffectiveUserId } from "@/lib/api-auth"
import { PERMISSIONS, canViewAllData } from "@/lib/permissions"
import { getComissaoVendedorForDate } from "@/lib/comissao"
import { getIVAForDate } from "@/lib/iva"
import { recalcularEstadoCobranca } from "@/lib/cobranca-estado"
import { estadoPorValores, distribuirPagamento } from "@/lib/cobranca-valores"

// Helper to check cobranca ownership through cliente
async function checkCobrancaOwnership(
  cobrancaId: string,
  effectiveUserId: string,
  canViewAll: boolean
): Promise<{ owned: boolean; cobranca: { clienteId: string; cliente: { userId: string | null } } | null }> {
  const cobranca = await prisma.cobranca.findUnique({
    where: { id: cobrancaId },
    select: {
      clienteId: true,
      cliente: { select: { userId: true } }
    }
  })

  if (!cobranca) return { owned: false, cobranca: null }
  if (canViewAll) return { owned: true, cobranca }
  if (cobranca.cliente.userId !== effectiveUserId) return { owned: false, cobranca }

  return { owned: true, cobranca }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission(PERMISSIONS.COBRANCAS_READ)
    const effectiveUserId = getEffectiveUserId(session)
    const canViewAll = canViewAllData(session.user.role) && !session.user.impersonating
    const { id } = await params

    const { owned, cobranca: cobrancaCheck } = await checkCobrancaOwnership(id, effectiveUserId, canViewAll)

    if (!cobrancaCheck) {
      return NextResponse.json({ error: "Cobrança não encontrada" }, { status: 404 })
    }

    if (!owned) {
      return NextResponse.json({ error: "Sem permissao" }, { status: 403 })
    }

    const cobranca = await prisma.cobranca.findUnique({
      where: { id },
      include: {
        cliente: true,
        parcelas: {
          orderBy: { numero: "asc" }
        }
      }
    })

    return NextResponse.json(cobranca)
  } catch (error) {
    if (error instanceof Response) return error
    console.error("Error fetching cobranca:", error)
    return NextResponse.json({ error: "Erro ao buscar cobranca" }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission(PERMISSIONS.COBRANCAS_WRITE)
    const effectiveUserId = getEffectiveUserId(session)
    const canViewAll = canViewAllData(session.user.role) && !session.user.impersonating
    const { id } = await params
    const data = await request.json()

    // Check ownership
    const { owned, cobranca: cobrancaCheck } = await checkCobrancaOwnership(id, effectiveUserId, canViewAll)

    if (!cobrancaCheck) {
      return NextResponse.json({ error: "Cobrança não encontrada" }, { status: 404 })
    }

    if (!owned) {
      return NextResponse.json({ error: "Sem permissao" }, { status: 403 })
    }

    if (!data.clienteId || !data.valor) {
      return NextResponse.json({ error: "Cliente e valor sao obrigatorios" }, { status: 400 })
    }

    // If changing cliente, verify ownership of new cliente
    let sellerUserId = cobrancaCheck.cliente.userId
    if (data.clienteId !== cobrancaCheck.clienteId) {
      const newCliente = await prisma.cliente.findUnique({
        where: { id: data.clienteId },
        select: { userId: true }
      })

      if (!newCliente) {
        return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 })
      }

      if (!canViewAll && newCliente.userId !== effectiveUserId) {
        return NextResponse.json({ error: "Sem permissao para este cliente" }, { status: 403 })
      }

      sellerUserId = newCliente.userId
    }

    // Calculate commission and IVA using the rates effective on the emission date
    const emissionDate = data.dataEmissao ? new Date(data.dataEmissao) : new Date()
    const comissaoRate = await getComissaoVendedorForDate(sellerUserId!, emissionDate)
    const ivaRate = await getIVAForDate(emissionDate)
    const valorSemIva = data.valorSemIva || (Number(data.valor) / (1 + ivaRate / 100))
    const calculatedComissao = data.comissao ?? Math.round(valorSemIva * (comissaoRate / 100) * 100) / 100

    // Regenerating parcelas wipes their payments: only when the plan really changed (count, first due date or total),
    // and never over parcelas that already have a payment (the form always sends updateParcelas, even to add an invoice number).
    const atual = await prisma.cobranca.findUnique({
      where: { id },
      select: { valor: true, numeroParcelas: true, dataInicioVencimento: true, parcelas: { select: { pago: true, valorPago: true } } }
    })
    const temPagamentos = !!atual?.parcelas.some((p) => p.pago || Number(p.valorPago ?? 0) > 0)
    const dia = (d: Date | string | null | undefined) => (d ? new Date(d).toISOString().slice(0, 10) : null)
    const planoMudou = !atual || atual.parcelas.length !== Number(data.numeroParcelas) ||
      dia(atual.dataInicioVencimento) !== dia(data.dataInicioVencimento) || Number(atual.valor) !== Number(data.valor)
    const regenerar = data.updateParcelas && data.numeroParcelas && data.dataInicioVencimento && planoMudou
    const paraPagamentoUnico = !data.updateParcelas && data.numeroParcelas === undefined && (atual?.parcelas.length ?? 0) > 0
    if ((regenerar || paraPagamentoUnico) && temPagamentos) {
      return NextResponse.json({ error: "Esta cobrança já tem parcelas pagas: não é possível mudar o número de parcelas, a data da primeira ou o valor total sem perder esses pagamentos. Os outros campos (fatura, notas, data de emissão) podem ser alterados." }, { status: 409 })
    }

    if (regenerar) {
      // Atomic: delete + recreate parcelas + update cobranca must not partially apply
      const cobranca = await prisma.$transaction(async (tx) => {
        // Delete existing parcelas
        await tx.parcela.deleteMany({
          where: { cobrancaId: id }
        })

        // Create new parcelas — round to cents, last parcela absorbs the remainder
        // so the sum always equals the cobranca total
        const valorParcela = Math.round((data.valor / data.numeroParcelas) * 100) / 100
        const parcelas = []
        for (let i = 0; i < data.numeroParcelas; i++) {
          const dataVencimento = new Date(data.dataInicioVencimento)
          dataVencimento.setMonth(dataVencimento.getMonth() + i)
          const isLast = i === data.numeroParcelas - 1
          parcelas.push({
            cobrancaId: id,
            numero: i + 1,
            valor: isLast
              ? Math.round((data.valor - valorParcela * (data.numeroParcelas - 1)) * 100) / 100
              : valorParcela,
            dataVencimento,
            pago: false
          })
        }

        await tx.parcela.createMany({
          data: parcelas
        })

        // Update cobranca with parcelas info
        return tx.cobranca.update({
          where: { id },
          data: {
            clienteId: data.clienteId,
            fatura: data.fatura || null,
            valor: data.valor,
            valorSemIva: valorSemIva,
            comissao: calculatedComissao,
            dataEmissao: data.dataEmissao ? new Date(data.dataEmissao) : null,
            notas: data.notas || null,
            numeroParcelas: data.numeroParcelas,
            dataInicioVencimento: new Date(data.dataInicioVencimento),
            pago: false, // Reset pago status when parcelas are regenerated
            dataPago: null,
            valorPago: null,
            estado: "PENDENTE"
          },
          include: {
            cliente: true,
            parcelas: {
              orderBy: { numero: "asc" }
            }
          }
        })
      })

      return NextResponse.json(cobranca)
    }

    // Installment plan unchanged: keep the parcelas and their payments, update the rest
    if (data.updateParcelas) {
      const cobranca = await prisma.cobranca.update({
        where: { id },
        data: {
          clienteId: data.clienteId,
          fatura: data.fatura || null,
          valor: data.valor,
          valorSemIva: valorSemIva,
          comissao: calculatedComissao,
          dataEmissao: data.dataEmissao ? new Date(data.dataEmissao) : null,
          notas: data.notas || null
        },
        include: { cliente: true, parcelas: { orderBy: { numero: "asc" } } }
      })
      return NextResponse.json(cobranca)
    }

    // Calculate dataVencimento for single payment cobrancas
    let calculatedDataVencimento: Date | null = null
    const numeroParcelas = data.numeroParcelas || 1
    if (numeroParcelas === 1 && data.prazoVencimentoDias && data.dataEmissao) {
      calculatedDataVencimento = new Date(data.dataEmissao)
      calculatedDataVencimento.setDate(calculatedDataVencimento.getDate() + data.prazoVencimentoDias)
    } else if (data.dataVencimento) {
      calculatedDataVencimento = new Date(data.dataVencimento)
    }

    // Atomic: parcela cleanup (when switching to single payment) + cobranca update
    const cobranca = await prisma.$transaction(async (tx) => {
      // If not updating parcelas but switching to single payment, delete existing parcelas
      if (paraPagamentoUnico) {
        await tx.parcela.deleteMany({
          where: { cobrancaId: id }
        })
      }

      return tx.cobranca.update({
        where: { id },
        data: {
          clienteId: data.clienteId,
          fatura: data.fatura || null,
          valor: data.valor,
          valorSemIva: valorSemIva,
          comissao: calculatedComissao,
          dataEmissao: data.dataEmissao ? new Date(data.dataEmissao) : null,
          notas: data.notas || null,
          numeroParcelas: numeroParcelas,
          dataInicioVencimento: data.dataInicioVencimento ? new Date(data.dataInicioVencimento) : null,
          prazoVencimentoDias: data.prazoVencimentoDias || null,
          dataVencimento: calculatedDataVencimento
        },
        include: {
          cliente: true,
          parcelas: {
            orderBy: { numero: "asc" }
          }
        }
      })
    })

    return NextResponse.json(cobranca)
  } catch (error) {
    if (error instanceof Response) return error
    console.error("Error updating cobranca:", error)
    return NextResponse.json({ error: "Erro ao atualizar cobrança" }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission(PERMISSIONS.COBRANCAS_WRITE)
    const effectiveUserId = getEffectiveUserId(session)
    const canViewAll = canViewAllData(session.user.role) && !session.user.impersonating
    const { id } = await params
    const data = await request.json()

    // Check ownership
    const { owned, cobranca: cobrancaCheck } = await checkCobrancaOwnership(id, effectiveUserId, canViewAll)

    if (!cobrancaCheck) {
      return NextResponse.json({ error: "Cobrança não encontrada" }, { status: 404 })
    }

    if (!owned) {
      return NextResponse.json({ error: "Sem permissao" }, { status: 403 })
    }

    // A payment against an invoice with parcelas: any amount, spread over the open parcelas oldest first
    if (data.adicionarPagamento !== undefined) {
      const valor = Number(data.adicionarPagamento)
      const dataPago = data.dataPago ? new Date(data.dataPago) : new Date()
      try {
        await prisma.$transaction(async (tx) => {
          const parcelas = await tx.parcela.findMany({
            where: { cobrancaId: id },
            select: { id: true, numero: true, valor: true, pago: true, valorPago: true }
          })
          const updates = distribuirPagamento(parcelas, valor)
          if (!updates) throw new Error("VALOR_INVALIDO")
          for (const u of updates) {
            await tx.parcela.update({ where: { id: u.id }, data: { valorPago: u.valorPago, pago: u.pago, dataPago } })
          }
          await recalcularEstadoCobranca(tx, id)
        })
      } catch (e) {
        if (e instanceof Error && e.message === "VALOR_INVALIDO") {
          return NextResponse.json({ error: "O valor tem de ser maior que 0 e não pode passar o que falta pagar nesta fatura." }, { status: 400 })
        }
        throw e
      }
      return NextResponse.json(await prisma.cobranca.findUnique({
        where: { id },
        include: { cliente: true, parcelas: { orderBy: { numero: "asc" } } }
      }))
    }

    const cobranca = await prisma.$transaction(async (tx) => {
      const atualizada = await tx.cobranca.update({
        where: { id },
        data: {
          pago: data.pago !== undefined ? data.pago : undefined,
          dataPago: data.dataPago !== undefined ? (data.dataPago ? new Date(data.dataPago) : null) : undefined,
          valorPago: data.valorPago !== undefined ? data.valorPago : undefined
        }
      })
      // Parcelas are the source of truth; without them the estado follows pago/valorPago (client estado ignored)
      if (!(await recalcularEstadoCobranca(tx, id))) {
        await tx.cobranca.update({
          where: { id },
          data: { estado: estadoPorValores(Number(atualizada.valor), Number(atualizada.valorPago ?? 0), atualizada.pago) }
        })
      }
      return tx.cobranca.findUnique({
        where: { id },
        include: {
          cliente: true,
          parcelas: {
            orderBy: { numero: "asc" }
          }
        }
      })
    })

    return NextResponse.json(cobranca)
  } catch (error) {
    if (error instanceof Response) return error
    console.error("Error patching cobranca:", error)
    return NextResponse.json({ error: "Erro ao atualizar cobrança" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission(PERMISSIONS.COBRANCAS_WRITE)
    const effectiveUserId = getEffectiveUserId(session)
    const canViewAll = canViewAllData(session.user.role) && !session.user.impersonating
    const { id } = await params

    const { owned, cobranca: cobrancaCheck } = await checkCobrancaOwnership(id, effectiveUserId, canViewAll)

    if (!cobrancaCheck) {
      return NextResponse.json({ error: "Cobrança não encontrada" }, { status: 404 })
    }

    if (!owned) {
      return NextResponse.json({ error: "Sem permissao" }, { status: 403 })
    }

    await prisma.cobranca.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Response) return error
    console.error("Error deleting cobranca:", error)
    return NextResponse.json({ error: "Erro ao eliminar cobrança" }, { status: 500 })
  }
}
