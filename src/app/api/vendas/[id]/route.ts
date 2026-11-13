import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { requirePermission, getEffectiveUserId } from "@/lib/api-auth"
import { PERMISSIONS, canViewAllData } from "@/lib/permissions"
import { calcularValorComIVA } from "@/lib/iva"
import { getComissaoVendedorForDate } from "@/lib/comissao"
import { vencimentoPagamentoUnico } from "@/lib/cobranca-valores"
import { ajustarValorCobranca, MSG_PARCELAS_PAGAS } from "@/lib/cobranca-estado"

type ItemInput = {
  produtoId: string
  quantidade: number
  precoUnit: number
}

// Helper to check venda ownership through cliente
async function checkVendaOwnership(
  vendaId: string,
  effectiveUserId: string,
  canViewAll: boolean
): Promise<{ owned: boolean; venda: { clienteId: string; cliente: { userId: string | null } } | null }> {
  const venda = await prisma.venda.findUnique({
    where: { id: vendaId },
    select: {
      clienteId: true,
      cliente: { select: { userId: true } }
    }
  })

  if (!venda) return { owned: false, venda: null }
  if (canViewAll) return { owned: true, venda }
  if (venda.cliente.userId !== effectiveUserId) return { owned: false, venda }

  return { owned: true, venda }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission(PERMISSIONS.VENDAS_READ)
    const effectiveUserId = getEffectiveUserId(session)
    const canViewAll = canViewAllData(session.user.role) && !session.user.impersonating
    const { id } = await params

    const { owned, venda: vendaCheck } = await checkVendaOwnership(id, effectiveUserId, canViewAll)

    if (!vendaCheck) {
      return NextResponse.json({ error: "Venda não encontrada" }, { status: 404 })
    }

    if (!owned) {
      return NextResponse.json({ error: "Sem permissao" }, { status: 403 })
    }

    const venda = await prisma.venda.findUnique({
      where: { id },
      include: {
        cliente: {
          select: {
            id: true,
            nome: true,
            codigo: true,
            saldoCredito: true
          }
        },
        objetivoVario: true,
        cobranca: {
          select: {
            id: true,
            fatura: true,
            valor: true,
            valorPago: true,
            pago: true,
            estado: true,
            numeroParcelas: true,
            creditoAplicado: true
          }
        },
        campanhas: {
          include: { campanha: true }
        },
        itens: {
          include: { produto: true, devolucoes: true },
          orderBy: { createdAt: "asc" }
        },
        incidencias: {
          select: {
            id: true,
            valor: true,
            motivo: true,
            notas: true,
            dataRegisto: true,
            aplicadoACredito: true
          },
          orderBy: { dataRegisto: "desc" }
        }
      }
    })

    return NextResponse.json(venda)
  } catch (error) {
    if (error instanceof Response) return error
    console.error("Error fetching venda:", error)
    return NextResponse.json({ error: "Erro ao buscar venda" }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission(PERMISSIONS.VENDAS_WRITE)
    const effectiveUserId = getEffectiveUserId(session)
    const canViewAll = canViewAllData(session.user.role) && !session.user.impersonating
    const { id } = await params
    const data = await request.json()

    // Check ownership of the venda being updated
    const { owned, venda: vendaCheck } = await checkVendaOwnership(id, effectiveUserId, canViewAll)

    if (!vendaCheck) {
      return NextResponse.json({ error: "Venda não encontrada" }, { status: 404 })
    }

    if (!owned) {
      return NextResponse.json({ error: "Sem permissao" }, { status: 403 })
    }

    if (!data.clienteId) {
      return NextResponse.json({ error: "Cliente e obrigatorio" }, { status: 400 })
    }

    // If changing cliente, verify ownership of new cliente
    if (data.clienteId !== vendaCheck.clienteId) {
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
    }

    // Calculate total from items if provided, otherwise from valor1/valor2
    let total = 0
    const itens: ItemInput[] = data.itens || []

    if (itens.length > 0) {
      total = itens.reduce((sum: number, item: ItemInput) => {
        return sum + (item.quantidade * item.precoUnit)
      }, 0)
    } else {
      const valor1 = data.valor1 ? parseFloat(data.valor1) : 0
      const valor2 = data.valor2 ? parseFloat(data.valor2) : 0
      total = valor1 + valor2
    }

    if (total <= 0 && !data.objetivoVarioId) {
      return NextResponse.json({ error: "O total deve ser maior que zero" }, { status: 400 })
    }

    // Check if venda already has a cobranca
    const [existingCobranca, vendaAtual, clienteVenda] = await Promise.all([
      prisma.cobranca.findUnique({ where: { vendaId: id } }),
      prisma.venda.findUnique({ where: { id }, select: { total: true, objetivoVarioValor: true, tipoDocumento: true } }),
      prisma.cliente.findUnique({ where: { id: data.clienteId }, select: { userId: true } })
    ])
    const mesValido = Number.isInteger(data.mes) && data.mes >= 1 && data.mes <= 12
    const anoValido = Number.isInteger(data.ano) && data.ano >= 2000 && data.ano <= 2100

    // Update venda with items in a transaction
    // Support both old format (campanhaIds: string[]) and new format (campanhas: {id, quantidade}[])
    const campanhas: { id: string; quantidade: number }[] = data.campanhas ||
      (data.campanhaIds ? data.campanhaIds.map((id: string) => ({ id, quantidade: 1 })) : [])

    const venda = await prisma.$transaction(async (tx) => {
      // Delete existing items
      await tx.itemVenda.deleteMany({
        where: { vendaId: id }
      })

      // Delete existing campanha associations
      await tx.campanhaVenda.deleteMany({
        where: { vendaId: id }
      })

      // Update the venda
      await tx.venda.update({
        where: { id },
        data: {
          clienteId: data.clienteId,
          objetivoVarioId: data.objetivoVarioId || null,
          objetivoVarioValor: data.objetivoVarioValor || null,
          valor1: data.valor1 || null,
          valor2: data.valor2 || null,
          total,
          ...(mesValido ? { mes: data.mes } : {}),
          ...(anoValido ? { ano: data.ano } : {}),
          notas: data.notas || null,
          tipoDocumento: data.tipoDocumento || undefined
        }
      })

      // Create new items if provided
      if (itens.length > 0) {
        await tx.itemVenda.createMany({
          data: itens.map((item: ItemInput) => ({
            vendaId: id,
            produtoId: item.produtoId,
            quantidade: item.quantidade,
            precoUnit: item.precoUnit,
            subtotal: item.quantidade * item.precoUnit
          }))
        })
      }

      // Create new campanha associations if provided
      if (campanhas.length > 0) {
        await tx.campanhaVenda.createMany({
          data: campanhas.map((c: { id: string; quantidade: number }) => ({
            vendaId: id,
            campanhaId: c.id,
            quantidade: c.quantidade
          }))
        })
      }

      // Create cobrança if requested and doesn't exist
      if (data.criarCobranca && data.cobranca && !existingCobranca) {
        const numeroParcelas = data.cobranca.numeroParcelas || 1
        const dataEmissao = data.cobranca.dataEmissao
          ? new Date(data.cobranca.dataEmissao)
          : new Date()

        // Cobranca value includes objetivo vario value (which is NOT part of sale total).
        // Sale items + valor1/valor2 are stored s/IVA — apply IVA at the rate active on
        // the emission date.
        const objetivoVarioValor = data.objetivoVarioValor ? parseFloat(data.objetivoVarioValor) : 0
        const cobrancaValorSemIva = Math.round((total + objetivoVarioValor) * 100) / 100
        const cobrancaValorComIva = await calcularValorComIVA(cobrancaValorSemIva, dataEmissao)
        const comissaoRate = clienteVenda?.userId ? await getComissaoVendedorForDate(clienteVenda.userId, dataEmissao) : 0
        const comissao = Math.round(cobrancaValorSemIva * (comissaoRate / 100) * 100) / 100

        // Create the cobrança
        const cobranca = await tx.cobranca.create({
          data: {
            clienteId: data.clienteId,
            vendaId: id,
            fatura: data.cobranca.fatura || null,
            valor: cobrancaValorComIva,
            valorSemIva: cobrancaValorSemIva,
            comissao,
            dataEmissao,
            dataInicioVencimento: dataEmissao,
            numeroParcelas,
            ...vencimentoPagamentoUnico(numeroParcelas, dataEmissao),
            pago: false,
            tipoDocumento: data.tipoDocumento || vendaAtual?.tipoDocumento || "FATURA"
          }
        })

        // Create parcelas if more than 1 — round to cents, last parcela absorbs the remainder
        if (numeroParcelas > 1) {
          const valorParcela = Math.round((cobrancaValorComIva / numeroParcelas) * 100) / 100
          const parcelas = []

          for (let i = 0; i < numeroParcelas; i++) {
            const dataVencimento = new Date(dataEmissao)
            dataVencimento.setMonth(dataVencimento.getMonth() + i)
            const isLast = i === numeroParcelas - 1

            parcelas.push({
              cobrancaId: cobranca.id,
              numero: i + 1,
              valor: isLast
                ? Math.round((cobrancaValorComIva - valorParcela * (numeroParcelas - 1)) * 100) / 100
                : valorParcela,
              dataVencimento,
              pago: false
            })
          }

          await tx.parcela.createMany({ data: parcelas })
        }
      }

      // Update existing cobrança if requested. Amounts only move when the sale value really changed, and by the
      // difference only (keeps credit-note adjustments); paid parcelas are never touched.
      if (data.atualizarCobranca && existingCobranca) {
        await tx.cobranca.update({
          where: { id: existingCobranca.id },
          data: {
            fatura: data.atualizarCobranca.fatura !== undefined ? data.atualizarCobranca.fatura : existingCobranca.fatura,
            clienteId: data.clienteId, // Update client if changed
            tipoDocumento: data.tipoDocumento || undefined
          }
        })

        const ivaDate = existingCobranca.dataEmissao || existingCobranca.createdAt
        const objetivoVarioValor = data.objetivoVarioValor ? parseFloat(data.objetivoVarioValor) : 0
        const novoSemIva = Math.round((total + objetivoVarioValor) * 100) / 100
        const antigoSemIva = Math.round((Number(vendaAtual?.total ?? 0) + Number(vendaAtual?.objetivoVarioValor ?? 0)) * 100) / 100
        const clienteMudou = data.clienteId !== existingCobranca.clienteId

        if (novoSemIva !== antigoSemIva || clienteMudou) {
          const diferencaComIva = (await calcularValorComIVA(novoSemIva, ivaDate)) - (await calcularValorComIVA(antigoSemIva, ivaDate))
          const valorSemIva = existingCobranca.valorSemIva !== null
            ? Number(existingCobranca.valorSemIva) + novoSemIva - antigoSemIva
            : novoSemIva
          await ajustarValorCobranca(tx, existingCobranca.id, Number(existingCobranca.valor) + diferencaComIva, valorSemIva)
        }
      }

      // Return venda with items, client, objetivoVario, campanhas, and cobranca
      return tx.venda.findUnique({
        where: { id },
        include: {
          cliente: {
            select: {
              id: true,
              nome: true,
              codigo: true,
              saldoCredito: true
            }
          },
          objetivoVario: true,
          cobranca: {
            select: {
              id: true,
              fatura: true,
              valor: true,
              valorPago: true,
              pago: true,
              estado: true,
              numeroParcelas: true
            }
          },
          campanhas: {
            include: { campanha: true }
          },
          itens: {
            include: { produto: true, devolucoes: true },
            orderBy: { createdAt: "asc" }
          },
          incidencias: {
            select: {
              id: true,
              valor: true,
              motivo: true,
              notas: true,
              dataRegisto: true,
              aplicadoACredito: true
            },
            orderBy: { dataRegisto: "desc" }
          }
        }
      })
    })

    return NextResponse.json(venda)
  } catch (error) {
    if (error instanceof Response) return error
    if (error instanceof Error && error.message === "PARCELAS_PAGAS") {
      return NextResponse.json({ error: MSG_PARCELAS_PAGAS }, { status: 409 })
    }
    console.error("Error updating venda:", error)
    return NextResponse.json({ error: "Erro ao atualizar venda" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission(PERMISSIONS.VENDAS_WRITE)
    const effectiveUserId = getEffectiveUserId(session)
    const canViewAll = canViewAllData(session.user.role) && !session.user.impersonating
    const { id } = await params

    const { owned, venda: vendaCheck } = await checkVendaOwnership(id, effectiveUserId, canViewAll)

    if (!vendaCheck) {
      return NextResponse.json({ error: "Venda não encontrada" }, { status: 404 })
    }

    if (!owned) {
      return NextResponse.json({ error: "Sem permissao" }, { status: 403 })
    }

    const cobranca = await prisma.cobranca.findUnique({
      where: { vendaId: id },
      select: { pago: true, valorPago: true, creditoAplicado: true, parcelas: { select: { pago: true, valorPago: true } } }
    })
    const temPagamentos = !!cobranca && (cobranca.pago || Number(cobranca.valorPago ?? 0) > 0 ||
      Number(cobranca.creditoAplicado ?? 0) > 0 || cobranca.parcelas.some(p => p.pago || Number(p.valorPago ?? 0) > 0))
    if (temPagamentos) {
      return NextResponse.json({ error: "Esta venda tem uma cobrança com pagamentos registados e não pode ser eliminada. Remova primeiro os pagamentos da cobrança." }, { status: 409 })
    }

    await prisma.venda.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Response) return error
    console.error("Error deleting venda:", error)
    return NextResponse.json({ error: "Erro ao eliminar venda" }, { status: 500 })
  }
}
