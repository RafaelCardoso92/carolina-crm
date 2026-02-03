import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateAIResponse, getTokenBalance } from "@/lib/ai"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const existing = await prisma.aIInsight.findUnique({
      where: {
        userId_type: { userId: session.user.id, type: "VENDAS_TREND" }
      }
    })

    if (existing) {
      return NextResponse.json({ insight: existing, cached: true })
    }

    return NextResponse.json({ insight: null, cached: false })
  } catch (error) {
    console.error("Error fetching vendas trends:", error)
    return NextResponse.json({ error: "Erro ao carregar tendencias" }, { status: 500 })
  }
}

export async function POST() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id

    const balance = await getTokenBalance(userId)
    if (balance.remaining < 2000) {
      return NextResponse.json(
        { error: "INSUFFICIENT_TOKENS", tokensNeeded: 2000, tokensAvailable: balance.remaining },
        { status: 402 }
      )
    }

    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()

    const monthlySales = await prisma.$queryRaw<Array<{mes: number, ano: number, total: number, count: bigint}>>`
      SELECT mes, ano, SUM(total::numeric)::float as total, COUNT(*)::bigint as count
      FROM "Venda"
      WHERE (ano = ${currentYear} OR (ano = ${currentYear - 1} AND mes > ${currentMonth}))
      GROUP BY mes, ano
      ORDER BY ano DESC, mes DESC
      LIMIT 12
    `

    const topProducts = await prisma.itemVenda.groupBy({
      by: ["produtoId"],
      _sum: { quantidade: true, subtotal: true },
      _count: true,
      orderBy: { _sum: { subtotal: "desc" } },
      take: 10
    })

    const productDetails = await prisma.produto.findMany({
      where: { id: { in: topProducts.map(p => p.produtoId).filter(Boolean) as string[] } }
    })

    const lastMonthProducts = await prisma.itemVenda.groupBy({
      by: ["produtoId"],
      where: {
        venda: {
          mes: currentMonth === 1 ? 12 : currentMonth - 1,
          ano: currentMonth === 1 ? currentYear - 1 : currentYear
        }
      },
      _sum: { quantidade: true, subtotal: true }
    })

    const currentMonthProducts = await prisma.itemVenda.groupBy({
      by: ["produtoId"],
      where: {
        venda: { mes: currentMonth, ano: currentYear }
      },
      _sum: { quantidade: true, subtotal: true }
    })

    const topClients = await prisma.venda.groupBy({
      by: ["clienteId"],
      where: { ano: currentYear },
      _sum: { total: true },
      _count: true,
      orderBy: { _sum: { total: "desc" } },
      take: 10
    })

    const clientDetails = await prisma.cliente.findMany({
      where: { id: { in: topClients.map(c => c.clienteId) } }
    })

    const totalSales = await prisma.venda.aggregate({
      where: { ano: currentYear },
      _sum: { total: true }
    })

    const totalReturns = await prisma.devolucao.aggregate({
      where: { createdAt: { gte: new Date(currentYear, 0, 1) } },
      _sum: { totalDevolvido: true }
    })

    const returnRate = Number(totalSales._sum.total) > 0
      ? (Number(totalReturns._sum.totalDevolvido || 0) / Number(totalSales._sum.total) * 100).toFixed(1)
      : "0"

    const monthlySalesLines = monthlySales.map(m => 
      "- " + m.mes + "/" + m.ano + ": " + m.total.toFixed(2) + " euros (" + m.count + " vendas)"
    ).join("\n")

    const topProductsLines = topProducts.map((p, i) => {
      const prod = productDetails.find(pd => pd.id === p.produtoId)
      const lastMonth = lastMonthProducts.find(lm => lm.produtoId === p.produtoId)
      const thisMonth = currentMonthProducts.find(cm => cm.produtoId === p.produtoId)
      const trend = lastMonth && thisMonth
        ? Number(thisMonth._sum.subtotal || 0) > Number(lastMonth._sum.subtotal || 0) ? "SUBIDA" : "DESCIDA"
        : "ESTAVEL"
      return (i + 1) + ". " + (prod?.nome || "N/A") + ": " + Number(p._sum.subtotal || 0).toFixed(2) + " euros (" + p._count + " vendas) - Tendencia: " + trend
    }).join("\n")

    const topClientsLines = topClients.map((c, i) => {
      const client = clientDetails.find(cd => cd.id === c.clienteId)
      return (i + 1) + ". " + (client?.nome || "N/A") + ": " + Number(c._sum.total || 0).toFixed(2) + " euros (" + c._count + " compras)"
    }).join("\n")

    const prompt = `Analisa as tendencias de vendas e fornece insights estrategicos:

VENDAS MENSAIS (ultimos meses):
${monthlySalesLines}

TOP 10 PRODUTOS:
${topProductsLines}

TOP 10 CLIENTES:
${topClientsLines}

TAXA DE DEVOLUCAO: ${returnRate}%

Responde APENAS em JSON valido:
{
  "resumo": "Resumo das tendencias em 2-3 frases",
  "tendenciaGeral": "SUBIDA ou DESCIDA ou ESTAVEL",
  "produtosDestaque": [
    {"nome": "produto", "motivo": "porque se destaca", "tendencia": "SUBIDA"}
  ],
  "produtosAtencao": [
    {"nome": "produto", "motivo": "porque precisa atencao", "sugestao": "o que fazer"}
  ],
  "clientesChave": [
    {"nome": "cliente", "valor": 1234.56, "oportunidade": "oportunidade identificada"}
  ],
  "previsoes": [
    {"periodo": "proximo mes", "previsao": "o que se espera", "confianca": "ALTA"}
  ],
  "recomendacoes": ["recomendacao 1", "recomendacao 2", "recomendacao 3"]
}`

    const response = await generateAIResponse(prompt, userId, "vendas_trends")

    let parsedData
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0])
      } else {
        throw new Error("No JSON found")
      }
    } catch {
      parsedData = {
        resumo: "Analise de tendencias gerada",
        tendenciaGeral: "ESTAVEL",
        produtosDestaque: [],
        produtosAtencao: [],
        clientesChave: [],
        previsoes: [],
        recomendacoes: []
      }
    }

    const insight = await prisma.aIInsight.upsert({
      where: {
        userId_type: { userId, type: "VENDAS_TREND" }
      },
      create: {
        userId,
        type: "VENDAS_TREND",
        data: parsedData,
        summary: parsedData.resumo
      },
      update: {
        data: parsedData,
        summary: parsedData.resumo,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ insight, cached: false })
  } catch (error) {
    console.error("Error generating vendas trends:", error)
    if (error instanceof Error && error.message === "INSUFFICIENT_TOKENS") {
      return NextResponse.json({ error: "INSUFFICIENT_TOKENS" }, { status: 402 })
    }
    return NextResponse.json({ error: "Erro ao gerar tendencias" }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await prisma.aIInsight.delete({
      where: {
        userId_type: { userId: session.user.id, type: "VENDAS_TREND" }
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting insight:", error)
    return NextResponse.json({ error: "Erro ao eliminar insight" }, { status: 500 })
  }
}
