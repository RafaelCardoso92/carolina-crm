import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import { requirePermission, getEffectiveUserId } from "@/lib/api-auth"
import { PERMISSIONS, canViewAllData } from "@/lib/permissions"
import { getComissaoForDate } from "@/lib/comissao"

export async function GET(request: Request) {
  try {
    const session = await requirePermission(PERMISSIONS.COBRANCAS_READ)

    // Build user scoped where clause through cliente relationship
    const userFilter = canViewAllData(session.user.role) && !session.user.impersonating
      ? {}
      : { cliente: { userId: getEffectiveUserId(session) } }

    const cobrancas = await prisma.cobranca.findMany({
      where: userFilter,
      include: {
        cliente: true,
        parcelas: {
          orderBy: { numero: "asc" }
        }
      },
      orderBy: [{ pago: "asc" }, { createdAt: "desc" }]
    })
    return NextResponse.json(cobrancas)
  } catch (error) {
    if (error instanceof Response) return error
    console.error("Error fetching cobrancas:", error)
    return NextResponse.json({ error: "Erro ao buscar cobranças" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await requirePermission(PERMISSIONS.COBRANCAS_WRITE)
    const effectiveUserId = getEffectiveUserId(session)
    const data = await request.json()

    if (!data.clienteId || !data.valor) {
      return NextResponse.json({ error: "Cliente e valor são obrigatórios" }, { status: 400 })
    }

    // Verify the cliente belongs to this user
    const cliente = await prisma.cliente.findUnique({
      where: { id: data.clienteId },
      select: { userId: true }
    })

    if (!cliente) {
      return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 })
    }

    // Check ownership (unless MASTERADMIN not impersonating)
    if (!(canViewAllData(session.user.role) && !session.user.impersonating)) {
      if (cliente.userId !== effectiveUserId) {
        return NextResponse.json({ error: "Sem permissão para este cliente" }, { status: 403 })
      }
    }

    const numeroParcelas = data.numeroParcelas || 1
    const dataInicioVencimento = data.dataInicioVencimento
      ? new Date(data.dataInicioVencimento)
      : null

    // Validate installment data
    if (numeroParcelas > 1 && !dataInicioVencimento) {
      return NextResponse.json({
        error: "Data da 1ª parcela é obrigatória para pagamentos parcelados"
      }, { status: 400 })
    }

    // Calculate dataVencimento for single payment cobrancas
    let calculatedDataVencimento: Date | null = null
    if (numeroParcelas === 1 && data.prazoVencimentoDias && data.dataEmissao) {
      calculatedDataVencimento = new Date(data.dataEmissao)
      calculatedDataVencimento.setDate(calculatedDataVencimento.getDate() + data.prazoVencimentoDias)
    } else if (data.dataVencimento) {
      calculatedDataVencimento = new Date(data.dataVencimento)
    }

    // Calculate commission using the rate effective on the emission date
    const emissionDate = data.dataEmissao ? new Date(data.dataEmissao) : new Date()
    const comissaoRate = await getComissaoForDate(emissionDate)
    const valorSemIva = data.valorSemIva || (Number(data.valor) / 1.23)
    const calculatedComissao = data.comissao ?? Math.round(valorSemIva * (comissaoRate / 100) * 100) / 100

    // Create cobranca with parcelas in a transaction
    const cobranca = await prisma.$transaction(async (tx) => {
      // Create the main cobranca
      const newCobranca = await tx.cobranca.create({
        data: {
          clienteId: data.clienteId,
          fatura: data.fatura || null,
          valor: data.valor,
          valorSemIva: valorSemIva,
          comissao: calculatedComissao,
          dataEmissao: data.dataEmissao ? new Date(data.dataEmissao) : null,
          numeroParcelas,
          dataInicioVencimento,
          notas: data.notas || null,
          prazoVencimentoDias: data.prazoVencimentoDias || null,
          dataVencimento: calculatedDataVencimento,
          estado: "PENDENTE"
        }
      })

      // If installments, create parcelas
      if (numeroParcelas > 1 && dataInicioVencimento) {
        const valorParcela = Number(data.valor) / numeroParcelas
        const parcelas = []

        for (let i = 0; i < numeroParcelas; i++) {
          const dataVencimento = new Date(dataInicioVencimento)
          dataVencimento.setMonth(dataVencimento.getMonth() + i)

          parcelas.push({
            cobrancaId: newCobranca.id,
            numero: i + 1,
            valor: valorParcela,
            dataVencimento,
            pago: false
          })
        }

        await tx.parcela.createMany({ data: parcelas })
      }

      // Return cobranca with parcelas and cliente
      return tx.cobranca.findUnique({
        where: { id: newCobranca.id },
        include: {
          cliente: true,
          parcelas: {
            orderBy: { numero: "asc" }
          }
        }
      })
    })

    return NextResponse.json(cobranca, { status: 201 })
  } catch (error) {
    if (error instanceof Response) return error
    console.error("Error creating cobranca:", error)
    return NextResponse.json({ error: "Erro ao criar cobrança" }, { status: 500 })
  }
}
