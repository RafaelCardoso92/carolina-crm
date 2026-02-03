import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateAIResponse, getAIProvider } from "@/lib/ai"
import { auth } from "@/lib/auth"
import type { ClienteInsightsResponse, ClienteInsights } from "@/types/ai"

const PROMPT_TEMPLATE = `Voce e um especialista em analise de clientes no sector de cosmeticos e beleza profissional em Portugal.
Analise este cliente e forneca insights personalizados COM EXPLICACOES de porque cada sugestao e boa.

DADOS DO CLIENTE:
- Nome: {nome}
- Codigo: {codigo}
- Email: {email}
- Telefone: {telefone}
- Morada: {morada}
- Notas: {notas}

HISTORICO DE COMPRAS:
{historicoCompras}

PRODUTOS NUNCA COMPRADOS (mais populares primeiro):
{produtosNaoComprados}

RESUMO FINANCEIRO:
- Total gasto: {totalGasto} EUR
- Numero de vendas: {numeroVendas}
- Media por venda: {mediaVenda} EUR
- Produtos diferentes comprados: {produtosUnicos}

Com base nestes dados, forneca em portugues de Portugal insights COM EXPLICACOES:

1. RESUMO_COMPORTAMENTO: Analise do perfil e comportamento de compra do cliente com explicacao.

2. PADRAO_COMPRAS: Analise do padrao de compras (frequencia, valores, preferencias) com explicacao.

3. RECOMENDACOES_UPSELL: 3-4 produtos especificos para recomendar, cada um com razao e explicacao de porque faz sentido.

4. SUGESTOES_ENGAGEMENT: 3-4 accoes especificas para melhorar o relacionamento, cada uma com explicacao.

5. TENDENCIA_SAZONAL: Analise de padroes sazonais ou temporais com explicacao.

IMPORTANTE: Responda APENAS com JSON valido no seguinte formato, sem texto adicional:
{
  "resumoComportamento": {
    "texto": "analise do comportamento",
    "explicacao": "porque esta analise e relevante"
  },
  "padraoCompras": {
    "texto": "analise do padrao",
    "explicacao": "porque este padrao e importante"
  },
  "recomendacoesUpsell": [
    {"produto": "nome do produto", "razao": "razao breve", "explicacao": "porque esta recomendacao faz sentido"},
    {"produto": "nome do produto", "razao": "razao breve", "explicacao": "porque esta recomendacao faz sentido"}
  ],
  "sugestoesEngagement": [
    {"texto": "sugestao 1", "explicacao": "porque esta accao funciona"},
    {"texto": "sugestao 2", "explicacao": "porque esta accao funciona"}
  ],
  "tendenciaSazonal": {
    "texto": "analise sazonal",
    "explicacao": "porque esta tendencia e importante"
  }
}`

// Helper to detect specific API errors
function getAIErrorMessage(error: unknown): { message: string; status: number } {
  const errorMessage = error instanceof Error ? error.message : String(error)
  const errorLower = errorMessage.toLowerCase()

  // Check for insufficient tokens first
  if (errorMessage === "INSUFFICIENT_TOKENS") {
    return {
      message: "Tokens insuficientes. Compre mais tokens em Definicoes > AI Tokens.",
      status: 402
    }
  }

  if (errorLower.includes("api_key_invalid") ||
      errorLower.includes("api key not valid") ||
      errorLower.includes("invalid api key") ||
      errorLower.includes("unauthorized") ||
      errorLower.includes("401")) {
    return {
      message: "Chave API invalida. Verifique a configuracao nas definicoes.",
      status: 401
    }
  }

  if (errorLower.includes("429") ||
      errorLower.includes("rate") ||
      errorLower.includes("quota") ||
      errorLower.includes("resource_exhausted") ||
      errorLower.includes("too many requests")) {
    return {
      message: "Limite de pedidos excedido. Tente novamente em alguns minutos.",
      status: 429
    }
  }

  if (errorLower.includes("model") &&
      (errorLower.includes("not found") || errorLower.includes("unavailable"))) {
    return {
      message: "Modelo de IA nao disponivel. Tente outro fornecedor.",
      status: 503
    }
  }

  if (errorLower.includes("network") ||
      errorLower.includes("econnrefused") ||
      errorLower.includes("timeout") ||
      errorLower.includes("fetch")) {
    return {
      message: "Erro de ligacao ao servico de IA. Tente novamente.",
      status: 503
    }
  }

  return {
    message: "Erro ao gerar insights de IA",
    status: 500
  }
}

// GET - Retrieve saved insights for a client
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clienteId = searchParams.get("clienteId")

    if (!clienteId) {
      return NextResponse.json<ClienteInsightsResponse>(
        { success: false, error: "ID do cliente em falta" },
        { status: 400 }
      )
    }

    // Get the most recent saved insight
    const savedInsight = await prisma.clienteInsight.findFirst({
      where: { clienteId },
      orderBy: { createdAt: "desc" }
    })

    if (!savedInsight) {
      return NextResponse.json<ClienteInsightsResponse>({
        success: true,
        insights: null,
        provider: null,
        generatedAt: null,
      })
    }

    return NextResponse.json<ClienteInsightsResponse>({
      success: true,
      insights: savedInsight.insights as unknown as ClienteInsights,
      provider: savedInsight.provider,
      generatedAt: savedInsight.createdAt.toISOString(),
      insightId: savedInsight.id,
    })
  } catch (error) {
    console.error("Error fetching saved insights:", error)
    return NextResponse.json<ClienteInsightsResponse>(
      { success: false, error: "Erro ao carregar insights guardados" },
      { status: 500 }
    )
  }
}

// POST - Generate new insights and save them
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json<ClienteInsightsResponse>(
        { success: false, error: "Nao autorizado" },
        { status: 401 }
      )
    }
    const userId = session.user.id

    const body = await request.json()
    const { clienteId, provider: requestedProvider } = body

    if (!clienteId) {
      return NextResponse.json<ClienteInsightsResponse>(
        { success: false, error: "ID do cliente em falta" },
        { status: 400 }
      )
    }

    // Fetch cliente with sales history
    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
      include: {
        vendas: {
          include: {
            itens: {
              include: {
                produto: true
              }
            }
          },
          orderBy: [{ ano: "desc" }, { mes: "desc" }]
        }
      }
    })

    if (!cliente) {
      return NextResponse.json<ClienteInsightsResponse>(
        { success: false, error: "Cliente nao encontrado" },
        { status: 404 }
      )
    }

    // Calculate summary stats
    const totalGasto = cliente.vendas.reduce((sum, v) => sum + Number(v.total), 0)
    const numeroVendas = cliente.vendas.length
    const mediaVenda = numeroVendas > 0 ? totalGasto / numeroVendas : 0

    // Get purchased products
    const produtosComprados = new Set<string>()
    const historicoCompras: string[] = []

    cliente.vendas.forEach(venda => {
      const dataVenda = `${venda.mes}/${venda.ano}`
      venda.itens.forEach(item => {
        produtosComprados.add(item.produtoId)
        historicoCompras.push(
          `- ${item.produto.nome}: ${item.quantidade}x a ${Number(item.precoUnit)}EUR (${dataVenda})`
        )
      })
    })

    // Get products never bought (most popular first)
    const produtosPopulares = await prisma.itemVenda.groupBy({
      by: ["produtoId"],
      _count: { produtoId: true },
      orderBy: { _count: { produtoId: "desc" } },
      take: 20
    })

    const produtosNaoComprados: string[] = []
    for (const p of produtosPopulares) {
      if (!produtosComprados.has(p.produtoId)) {
        const produto = await prisma.produto.findUnique({ where: { id: p.produtoId } })
        if (produto) {
          produtosNaoComprados.push(`- ${produto.nome} (${p._count.produtoId} vendas globais)`)
        }
      }
    }

    // Determine provider
    let provider = await getAIProvider()
    if (requestedProvider === "openai") {
      provider = requestedProvider
    }

    // Build prompt
    const prompt = PROMPT_TEMPLATE
      .replace("{nome}", cliente.nome || "Nao especificado")
      .replace("{codigo}", cliente.codigo || "Nao especificado")
      .replace("{email}", cliente.email || "Nao disponivel")
      .replace("{telefone}", cliente.telefone || "Nao disponivel")
      .replace("{morada}", cliente.morada || "Nao especificada")
      .replace("{notas}", cliente.notas || "Sem notas")
      .replace("{historicoCompras}", historicoCompras.slice(0, 30).join("\n") || "Sem historico")
      .replace("{produtosNaoComprados}", produtosNaoComprados.slice(0, 10).join("\n") || "Nenhum identificado")
      .replace("{totalGasto}", totalGasto.toFixed(2))
      .replace("{numeroVendas}", numeroVendas.toString())
      .replace("{mediaVenda}", mediaVenda.toFixed(2))
      .replace("{produtosUnicos}", produtosComprados.size.toString())

    // Get AI response with userId for token tracking
    const aiResponse = await generateAIResponse(prompt, userId, "cliente_insights")

    // Parse JSON response
    let insights: ClienteInsights
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error("No JSON found in response")
      }
      insights = JSON.parse(jsonMatch[0])
    } catch (parseError) {
      console.error("Failed to parse AI response:", aiResponse)
      return NextResponse.json<ClienteInsightsResponse>(
        { success: false, error: "Erro ao processar resposta da IA" },
        { status: 500 }
      )
    }

    // Delete any existing insights for this client (keep only latest)
    await prisma.clienteInsight.deleteMany({
      where: { clienteId }
    })

    // Save the new insights
    const savedInsight = await prisma.clienteInsight.create({
      data: {
        clienteId,
        insights: insights as object,
        provider,
      }
    })

    return NextResponse.json<ClienteInsightsResponse>({
      success: true,
      insights,
      provider,
      generatedAt: savedInsight.createdAt.toISOString(),
      insightId: savedInsight.id,
    })
  } catch (error) {
    console.error("AI API error:", error)

    const { message, status } = getAIErrorMessage(error)

    return NextResponse.json<ClienteInsightsResponse>(
      { success: false, error: message },
      { status }
    )
  }
}

// DELETE - Remove saved insights
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clienteId = searchParams.get("clienteId")
    const insightId = searchParams.get("insightId")

    if (!clienteId && !insightId) {
      return NextResponse.json(
        { success: false, error: "ID do cliente ou insight em falta" },
        { status: 400 }
      )
    }

    if (insightId) {
      await prisma.clienteInsight.delete({
        where: { id: insightId }
      })
    } else if (clienteId) {
      await prisma.clienteInsight.deleteMany({
        where: { clienteId }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting insights:", error)
    return NextResponse.json(
      { success: false, error: "Erro ao eliminar insights" },
      { status: 500 }
    )
  }
}
