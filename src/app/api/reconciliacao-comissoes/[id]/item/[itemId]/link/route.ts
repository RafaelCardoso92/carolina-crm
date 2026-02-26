import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getEffectiveUserId } from "@/lib/permissions"

// GET - Get ALL cobrancas paid in the selected month for linking (ALWAYS user-scoped)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Não autorizado" }, { status: 401 })
  }

  try {
    const { id, itemId } = await params
    const userId = getEffectiveUserId(session)

    // Get the reconciliation to know the month/year - verify ownership
    const reconciliacao = await prisma.reconciliacaoComissoes.findFirst({
      where: { id, userId }
    })

    if (!reconciliacao) {
      return NextResponse.json({ success: false, error: "Reconciliação não encontrada" }, { status: 404 })
    }

    // Get the item for display info
    const item = await prisma.itemReconciliacaoComissao.findUnique({
      where: { id: itemId }
    })

    if (!item) {
      return NextResponse.json({ success: false, error: "Item não encontrado" }, { status: 404 })
    }

    // Calculate date range for the selected month
    const startOfMonth = new Date(reconciliacao.ano, reconciliacao.mes - 1, 1)
    const endOfMonth = new Date(reconciliacao.ano, reconciliacao.mes, 0, 23, 59, 59, 999)

    // Get ALL cobrancas that were paid in this month
    // Check both direct payment (pago + dataPago) AND via parcelas
    const cobrancas = await prisma.cobranca.findMany({
      where: {
        OR: [
          // Direct payment on the cobranca
          {
            pago: true,
            dataPago: {
              gte: startOfMonth,
              lte: endOfMonth
            }
          },
          // Payment via parcelas
          {
            parcelas: {
              some: {
                pago: true,
                dataPago: {
                  gte: startOfMonth,
                  lte: endOfMonth
                }
              }
            }
          }
        ]
      },
      include: {
        cliente: {
          select: { id: true, nome: true, codigo: true }
        },
        parcelas: {
          where: {
            pago: true,
            dataPago: {
              gte: startOfMonth,
              lte: endOfMonth
            }
          },
          select: { id: true, numero: true, valor: true, dataPago: true }
        },
        itensReconciliacaoComissao: {
          select: { id: true, reconciliacaoId: true }
        }
      },
      orderBy: [
        { dataPago: "desc" }
      ],
      take: 200 // Increased limit
    })

    // Enhance each cobranca with link status and match score
    const valorPdf = Number(item.valorLiquidoPdf) || 0
    const comissaoPdf = Number(item.valorComissaoPdf) || 0
    const codigoClientePdf = item.codigoClientePdf?.trim().toLowerCase() || ""

    console.log(`[Link] Item PDF: cliente=${codigoClientePdf}, valor=${valorPdf}, comissao=${comissaoPdf}`)
    console.log(`[Link] Found ${cobrancas.length} cobrancas in month range`)

    const enhancedCobrancas = cobrancas.map(c => {
      const valorCobranca = Number(c.valorSemIva || c.valor) || 0
      const comissaoCobranca = Number(c.comissao) || 0
      const codigoClienteCobranca = c.cliente?.codigo?.trim().toLowerCase() || ""

      // Check if already linked to this reconciliation
      const linkedToThisRec = c.itensReconciliacaoComissao.some(
        (ir: { reconciliacaoId: string }) => ir.reconciliacaoId === id
      )
      // Check if linked to any reconciliation
      const linkedToAny = c.itensReconciliacaoComissao.length > 0

      // Calculate proximity score (lower is better)
      // Client code match is MOST important - gives huge bonus
      const clientMatch = codigoClientePdf && codigoClienteCobranca && codigoClientePdf === codigoClienteCobranca
      const valorDiff = Math.abs(valorPdf - valorCobranca)
      const comissaoDiff = Math.abs(comissaoPdf - comissaoCobranca)

      // Score: client match gets priority (subtract 10000), then commission, then value
      let score = valorDiff + (comissaoDiff * 100)
      if (clientMatch) {
        score -= 10000 // Client match gets huge priority
      }

      return {
        id: c.id,
        fatura: c.fatura,
        valor: c.valor,
        valorSemIva: c.valorSemIva,
        comissao: c.comissao,
        dataPago: c.dataPago,
        dataEmissao: c.dataEmissao,
        cliente: c.cliente,
        parcelas: c.parcelas,
        linkedToThisRec,
        linkedToAny,
        clientMatch,
        score
      }
    })

    // Sort by score (best matches first) but put already linked at the end
    enhancedCobrancas.sort((a, b) => {
      if (a.linkedToThisRec && !b.linkedToThisRec) return 1
      if (!a.linkedToThisRec && b.linkedToThisRec) return -1
      return a.score - b.score
    })

    console.log(`[Link] Returning ${enhancedCobrancas.length} cobrancas, top match: ${enhancedCobrancas[0]?.cliente?.codigo || 'none'}`)

    return NextResponse.json({
      success: true,
      cobrancas: enhancedCobrancas,
      item: {
        codigoClientePdf: item.codigoClientePdf,
        numeroPdf: item.numeroPdf,
        valorLiquidoPdf: item.valorLiquidoPdf,
        valorComissaoPdf: item.valorComissaoPdf
      }
    })
  } catch (error) {
    console.error("Error fetching available cobrancas:", error)
    return NextResponse.json(
      { success: false, error: "Erro ao carregar cobranças disponíveis" },
      { status: 500 }
    )
  }
}

// POST - Link item to a cobranca and update invoice number (ALWAYS user-scoped)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Não autorizado" }, { status: 401 })
  }

  try {
    const { id, itemId } = await params
    const userId = getEffectiveUserId(session)
    const { cobrancaId } = await request.json()

    if (!cobrancaId) {
      return NextResponse.json({ success: false, error: "ID da cobrança é obrigatório" }, { status: 400 })
    }

    // Verify reconciliation belongs to user
    const existingRec = await prisma.reconciliacaoComissoes.findFirst({
      where: { id, userId }
    })
    if (!existingRec) {
      return NextResponse.json({ success: false, error: "Reconciliação não encontrada" }, { status: 404 })
    }

    // Get the item
    const item = await prisma.itemReconciliacaoComissao.findUnique({
      where: { id: itemId }
    })

    if (!item) {
      return NextResponse.json({ success: false, error: "Item não encontrado" }, { status: 404 })
    }

    // Get the cobranca
    const cobranca = await prisma.cobranca.findUnique({
      where: { id: cobrancaId },
      include: { cliente: true }
    })

    if (!cobranca) {
      return NextResponse.json({ success: false, error: "Cobrança não encontrada" }, { status: 404 })
    }

    // Update the cobranca with the invoice number from PDF
    await prisma.cobranca.update({
      where: { id: cobrancaId },
      data: {
        fatura: item.numeroPdf
      }
    })

    // Calculate system values for comparison
    const cobrancaValorSemIva = Number(cobranca.valorSemIva || cobranca.valor)
    const cobrancaComissao = Number(cobranca.comissao || 0)
    const valorLiquidoPdf = Number(item.valorLiquidoPdf)
    const valorComissaoPdf = Number(item.valorComissaoPdf)

    const diferencaValor = Math.round((valorLiquidoPdf - cobrancaValorSemIva) * 100) / 100
    const diferencaComissao = Math.round((valorComissaoPdf - cobrancaComissao) * 100) / 100

    // Check if commissions match (within tolerance)
    const corresponde = Math.abs(diferencaComissao) <= 0.15

    // Update the item with the link
    const updatedItem = await prisma.itemReconciliacaoComissao.update({
      where: { id: itemId },
      data: {
        clienteId: cobranca.clienteId,
        cobrancaId: cobrancaId,
        nomeClientePdf: cobranca.cliente?.nome || item.nomeClientePdf,
        valorSistema: Math.round(cobrancaValorSemIva * 100) / 100,
        comissaoSistema: Math.round(cobrancaComissao * 100) / 100,
        diferencaValor: corresponde ? 0 : diferencaValor,
        diferencaComissao: corresponde ? 0 : diferencaComissao,
        corresponde,
        tipoDiscrepancia: corresponde ? null : "COMISSAO_DIFERENTE",
        notas: `Ligado manualmente à cobrança. Fatura ${item.numeroPdf} adicionada ao sistema.`
      },
      include: {
        cliente: { select: { id: true, nome: true, codigo: true } },
        cobranca: { select: { id: true, fatura: true, valor: true, valorSemIva: true, comissao: true, pago: true, dataPago: true } }
      }
    })

    // Update reconciliation counters
    const reconciliacao = await prisma.reconciliacaoComissoes.findUnique({
      where: { id },
      include: { itens: true }
    })

    if (reconciliacao) {
      const itensCorretos = reconciliacao.itens.filter(i => i.corresponde || i.resolvido).length
      const itensComProblema = reconciliacao.itens.filter(i => !i.corresponde && !i.resolvido).length

      // Recalculate totals
      const totalSistema = reconciliacao.itens.reduce((sum, i) => sum + (Number(i.valorSistema) || 0), 0)
      const totalComissaoSistema = reconciliacao.itens.reduce((sum, i) => sum + (Number(i.comissaoSistema) || 0), 0)

      let estado = reconciliacao.estado
      if (itensComProblema === 0) {
        estado = "APROVADA"
      } else if (itensCorretos > 0 && itensComProblema > 0) {
        estado = "EM_REVISAO"
      }

      await prisma.reconciliacaoComissoes.update({
        where: { id },
        data: {
          itensCorretos,
          itensComProblema,
          totalSistema: Math.round(totalSistema * 100) / 100,
          totalComissaoSistema: Math.round(totalComissaoSistema * 100) / 100,
          diferenca: Math.round((Number(reconciliacao.totalLiquidoPdf) - totalSistema) * 100) / 100,
          diferencaComissao: Math.round((Number(reconciliacao.totalComissaoPdf) - totalComissaoSistema) * 100) / 100,
          estado
        }
      })
    }

    return NextResponse.json({
      success: true,
      item: updatedItem,
      message: `Cobrança ligada com sucesso. Fatura ${item.numeroPdf} adicionada ao sistema.`
    })
  } catch (error) {
    console.error("Error linking item to cobranca:", error)
    return NextResponse.json(
      { success: false, error: "Erro ao ligar item à cobrança" },
      { status: 500 }
    )
  }
}
