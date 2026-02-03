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
        userId_type: {
          userId: session.user.id,
          type: "DASHBOARD"
        }
      }
    })

    if (existing) {
      return NextResponse.json({ insight: existing, cached: true })
    }

    return NextResponse.json({ insight: null, cached: false })
  } catch (error) {
    console.error("Error fetching dashboard insights:", error)
    return NextResponse.json({ error: "Erro ao carregar insights" }, { status: 500 })
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
    const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1
    const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear

    const [currentMonthSales, lastMonthSales, yearSales] = await Promise.all([
      prisma.venda.aggregate({
        where: { mes: currentMonth, ano: currentYear },
        _sum: { total: true },
        _count: true
      }),
      prisma.venda.aggregate({
        where: { mes: lastMonth, ano: lastMonthYear },
        _sum: { total: true },
        _count: true
      }),
      prisma.venda.aggregate({
        where: { ano: currentYear },
        _sum: { total: true },
        _count: true
      })
    ])

    const pendingCollections = await prisma.cobranca.findMany({
      where: { pago: false },
      include: {
        cliente: { select: { nome: true } },
        parcelas: { where: { pago: false } }
      }
    })

    const overdueCollections = pendingCollections.filter(c => {
      const unpaidParcelas = c.parcelas.filter(p => !p.pago && new Date(p.dataVencimento) < now)
      return unpaidParcelas.length > 0
    })

    const activeClients = await prisma.cliente.count({ where: { ativo: true } })
    const inactiveClients = await prisma.cliente.findMany({
      where: {
        ativo: true,
        ultimoContacto: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      },
      select: { id: true, nome: true, ultimoContacto: true }
    })

    const prospects = await prisma.prospecto.groupBy({
      by: ["estado"],
      _count: true
    })

    const topProducts = await prisma.itemVenda.groupBy({
      by: ["produtoId"],
      where: {
        venda: { mes: currentMonth, ano: currentYear }
      },
      _sum: { quantidade: true, subtotal: true },
      orderBy: { _sum: { subtotal: "desc" } },
      take: 5
    })

    const productDetails = await prisma.produto.findMany({
      where: { id: { in: topProducts.map(p => p.produtoId).filter(Boolean) as string[] } }
    })

    const returns = await prisma.devolucao.aggregate({
      where: {
        createdAt: { gte: new Date(currentYear, currentMonth - 1, 1) }
      },
      _sum: { totalDevolvido: true },
      _count: true
    })

    const pendingTotal = pendingCollections.reduce((sum, c) => sum + Number(c.valor), 0)
    const pipelineLines = prospects.map(p => "- " + p.estado + ": " + p._count).join("\n")
    const productsLines = topProducts.map((p, i) => {
      const prod = productDetails.find(pd => pd.id === p.produtoId)
      return (i + 1) + ". " + (prod?.nome || "Desconhecido") + ": " + Number(p._sum.subtotal || 0).toFixed(2) + " euros"
    }).join("\n")

    const prompt = `Analisa os seguintes dados de negocio e fornece insights estrategicos em Portugues:

VENDAS:
- Este mes: ${Number(currentMonthSales._sum.total || 0).toFixed(2)} euros (${currentMonthSales._count} vendas)
- Mes passado: ${Number(lastMonthSales._sum.total || 0).toFixed(2)} euros (${lastMonthSales._count} vendas)
- Total ano: ${Number(yearSales._sum.total || 0).toFixed(2)} euros (${yearSales._count} vendas)

COBRANCAS:
- Pendentes: ${pendingCollections.length} (${pendingTotal.toFixed(2)} euros)
- Em atraso: ${overdueCollections.length} cobrancas

CLIENTES:
- Ativos: ${activeClients}
- Sem contacto ha 30+ dias: ${inactiveClients.length}

PIPELINE:
${pipelineLines}

PRODUTOS TOP:
${productsLines}

DEVOLUCOES:
- Este mes: ${returns._count} (${Number(returns._sum.totalDevolvido || 0).toFixed(2)} euros)

Responde APENAS em JSON valido com esta estrutura exata:
{
  "resumo": "Resumo executivo de 2-3 frases",
  "pontosForca": ["ponto 1", "ponto 2", "ponto 3"],
  "alertas": ["alerta 1", "alerta 2", "alerta 3"],
  "oportunidades": ["oportunidade 1", "oportunidade 2", "oportunidade 3"],
  "acoesSugeridas": [
    {"prioridade": "ALTA", "acao": "descricao", "impacto": "impacto esperado"},
    {"prioridade": "MEDIA", "acao": "descricao", "impacto": "impacto esperado"}
  ],
  "previsaoProximoMes": {
    "tendencia": "SUBIDA",
    "confianca": "MEDIA",
    "justificacao": "razao"
  }
}`

    const response = await generateAIResponse(prompt, userId, "dashboard_insights")

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
        resumo: response.substring(0, 500),
        pontosForca: [],
        alertas: [],
        oportunidades: [],
        acoesSugeridas: [],
        previsaoProximoMes: { tendencia: "ESTAVEL", confianca: "BAIXA", justificacao: "Dados insuficientes" }
      }
    }

    const insight = await prisma.aIInsight.upsert({
      where: {
        userId_type: { userId, type: "DASHBOARD" }
      },
      create: {
        userId,
        type: "DASHBOARD",
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
    console.error("Error generating dashboard insights:", error)
    if (error instanceof Error && error.message === "INSUFFICIENT_TOKENS") {
      return NextResponse.json({ error: "INSUFFICIENT_TOKENS" }, { status: 402 })
    }
    return NextResponse.json({ error: "Erro ao gerar insights" }, { status: 500 })
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
        userId_type: { userId: session.user.id, type: "DASHBOARD" }
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting insight:", error)
    return NextResponse.json({ error: "Erro ao eliminar insight" }, { status: 500 })
  }
}
