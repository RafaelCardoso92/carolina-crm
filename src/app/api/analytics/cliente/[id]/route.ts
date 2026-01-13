import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Get client with all sales and items
    const cliente = await prisma.cliente.findUnique({
      where: { id },
      include: {
        vendas: {
          include: {
            itens: {
              include: { produto: true }
            }
          },
          orderBy: [{ ano: "desc" }, { mes: "desc" }]
        }
      }
    })

    if (!cliente) {
      return NextResponse.json(
        { error: "Cliente não encontrado" },
        { status: 404 }
      )
    }

    // Build product purchase history
    const productStats: Record<string, {
      produtoId: string
      nome: string
      codigo: string | null
      categoria: string | null
      totalCompras: number
      totalQuantidade: number
      totalGasto: number
      ultimaCompra: { mes: number; ano: number } | null
    }> = {}

    cliente.vendas.forEach(venda => {
      if (venda.itens) {
        venda.itens.forEach(item => {
          const produtoId = item.produtoId
          if (!productStats[produtoId]) {
            productStats[produtoId] = {
              produtoId,
              nome: item.produto.nome,
              codigo: item.produto.codigo,
              categoria: item.produto.categoria,
              totalCompras: 0,
              totalQuantidade: 0,
              totalGasto: 0,
              ultimaCompra: null
            }
          }
          productStats[produtoId].totalCompras++
          productStats[produtoId].totalQuantidade += Number(item.quantidade)
          productStats[produtoId].totalGasto += Number(item.subtotal)

          // Track last purchase
          if (!productStats[produtoId].ultimaCompra ||
              venda.ano > productStats[produtoId].ultimaCompra!.ano ||
              (venda.ano === productStats[produtoId].ultimaCompra!.ano && venda.mes > productStats[produtoId].ultimaCompra!.mes)) {
            productStats[produtoId].ultimaCompra = { mes: venda.mes, ano: venda.ano }
          }
        })
      }
    })

    // Convert to array and sort by total spent
    const historicoCompras = Object.values(productStats)
      .sort((a, b) => b.totalGasto - a.totalGasto)

    // Get all active products to find what client never bought
    const allProducts = await prisma.produto.findMany({
      where: { ativo: true },
      include: {
        _count: {
          select: { itensVenda: true }
        }
      },
      orderBy: { nome: "asc" }
    })

    const purchasedProductIds = new Set(Object.keys(productStats))

    // Products client never bought, sorted by popularity (how many other clients buy them)
    const produtosNuncaComprados = allProducts
      .filter(p => !purchasedProductIds.has(p.id))
      .map(p => ({
        produtoId: p.id,
        nome: p.nome,
        codigo: p.codigo,
        categoria: p.categoria,
        popularidade: p._count.itensVenda
      }))
      .sort((a, b) => b.popularidade - a.popularidade)

    // Calculate totals
    const totalGasto = cliente.vendas.reduce((sum, v) => sum + Number(v.total), 0)
    const totalVendas = cliente.vendas.length

    // Get sales trend (last 12 months)
    const now = new Date()
    const tendencia: { mes: number; ano: number; total: number }[] = []

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const mes = date.getMonth() + 1
      const ano = date.getFullYear()

      const venda = cliente.vendas.find(v => v.mes === mes && v.ano === ano)
      tendencia.push({
        mes,
        ano,
        total: venda ? Number(venda.total) : 0
      })
    }

    return NextResponse.json({
      cliente: {
        id: cliente.id,
        nome: cliente.nome,
        codigo: cliente.codigo
      },
      resumo: {
        totalGasto,
        totalVendas,
        mediaVenda: totalVendas > 0 ? totalGasto / totalVendas : 0,
        produtosUnicos: historicoCompras.length
      },
      historicoCompras,
      produtosNuncaComprados,
      tendencia
    })
  } catch (error) {
    console.error("Error fetching client analytics:", error)
    return NextResponse.json(
      { error: "Erro ao carregar análise do cliente" },
      { status: 500 }
    )
  }
}
