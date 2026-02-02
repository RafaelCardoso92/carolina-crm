import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateAIResponse, getAIProvider } from "@/lib/ai"
import type { ProspectoTacticsResponse, ProspectoTactics } from "@/types/ai"
// Strip HTML tags from text
function stripHtml(text: string): string {
  if (!text) return text
  return text
    .replace(/<[^>]*>/g, "")  // Remove HTML tags
    .replace(/&nbsp;/g, " ")   // Replace &nbsp;
    .replace(/&amp;/g, "&")    // Replace &amp;
    .replace(/&lt;/g, "<")     // Replace &lt;
    .replace(/&gt;/g, ">")     // Replace &gt;
    .replace(/&quot;/g, "\"")   // Replace &quot;
    .replace(/&#39;/g, "'")   // Replace &#39;
    .trim()
}

// Clean tactics object by stripping HTML from all text fields
function cleanTactics(tactics: ProspectoTactics): ProspectoTactics {
  return {
    abordagem: {
      texto: stripHtml(tactics.abordagem?.texto || ""),
      explicacao: stripHtml(tactics.abordagem?.explicacao || "")
    },
    iniciadoresConversa: (tactics.iniciadoresConversa || []).map(item => ({
      texto: stripHtml(item.texto || ""),
      explicacao: stripHtml(item.explicacao || "")
    })),
    pontosDor: (tactics.pontosDor || []).map(item => ({
      texto: stripHtml(item.texto || ""),
      explicacao: stripHtml(item.explicacao || "")
    })),
    dicasSucesso: (tactics.dicasSucesso || []).map(item => ({
      texto: stripHtml(item.texto || ""),
      explicacao: stripHtml(item.explicacao || "")
    })),
    probabilidadeConversao: {
      nivel: tactics.probabilidadeConversao?.nivel || "Media",
      justificacao: stripHtml(tactics.probabilidadeConversao?.justificacao || "")
    }
  }
}


const PROMPT_TEMPLATE = `Voce e um especialista em vendas B2B no sector de cosmeticos e beleza profissional em Portugal.
Analise este prospecto e forneca tacticas personalizadas de abordagem COM EXPLICACOES de porque cada sugestao e boa.

DADOS DO PROSPECTO:
- Empresa: {nomeEmpresa}
- Tipo de Negocio: {tipoNegocio}
- Estado no Pipeline: {estado}
- Contacto: {nomeContacto} ({cargoContacto})
- Telefone: {telefone}
- Email: {email}
- Cidade: {cidade}
- Fonte do Lead: {fonte}
- Proxima Accao Planeada: {proximaAccao}
- Notas: {notas}
- Website: {website}
- Facebook: {facebook}
- Instagram: {instagram}

Com base nestes dados, forneca em portugues de Portugal:

1. ABORDAGEM: Estrategia de abordagem com explicacao de porque funciona para este tipo de cliente.

2. INICIADORES_CONVERSA: 3-4 frases especificas para iniciar conversa, cada uma com explicacao de porque e eficaz.

3. PONTOS_DOR: 3-4 problemas ou necessidades tipicas deste tipo de negocio, cada um com explicacao de porque e relevante.

4. DICAS_SUCESSO: 3-4 conselhos especificos, cada um com explicacao de porque aumenta a probabilidade de sucesso.

5. PROBABILIDADE: Avaliacao (Alta/Media/Baixa) com justificacao detalhada.

IMPORTANTE: Responda APENAS com JSON valido. NAO inclua HTML, apenas texto simples:
{
  "abordagem": {
    "texto": "estrategia de abordagem aqui",
    "explicacao": "porque esta abordagem e eficaz para este cliente"
  },
  "iniciadoresConversa": [
    {"texto": "frase 1", "explicacao": "porque esta frase funciona"},
    {"texto": "frase 2", "explicacao": "porque esta frase funciona"},
    {"texto": "frase 3", "explicacao": "porque esta frase funciona"}
  ],
  "pontosDor": [
    {"texto": "ponto 1", "explicacao": "porque este ponto e relevante"},
    {"texto": "ponto 2", "explicacao": "porque este ponto e relevante"},
    {"texto": "ponto 3", "explicacao": "porque este ponto e relevante"}
  ],
  "dicasSucesso": [
    {"texto": "dica 1", "explicacao": "porque esta dica funciona"},
    {"texto": "dica 2", "explicacao": "porque esta dica funciona"},
    {"texto": "dica 3", "explicacao": "porque esta dica funciona"}
  ],
  "probabilidadeConversao": {
    "nivel": "Alta ou Media ou Baixa",
    "justificacao": "explicacao detalhada da avaliacao"
  }
}`

// Helper to detect specific API errors
function getAIErrorMessage(error: unknown): { message: string; status: number } {
  const errorMessage = error instanceof Error ? error.message : String(error)
  const errorLower = errorMessage.toLowerCase()

  if (errorLower.includes("api_key_invalid") ||
      errorLower.includes("api key not valid") ||
      errorLower.includes("invalid api key") ||
      errorLower.includes("unauthorized") ||
      errorLower.includes("401")) {
    return {
      message: "Chave API inválida. Verifique a configuração nas definições.",
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
      message: "Modelo de IA não disponível. Tente outro fornecedor.",
      status: 503
    }
  }

  if (errorLower.includes("network") ||
      errorLower.includes("econnrefused") ||
      errorLower.includes("timeout") ||
      errorLower.includes("fetch")) {
    return {
      message: "Erro de ligação ao serviço de IA. Tente novamente.",
      status: 503
    }
  }

  return {
    message: "Erro ao gerar tácticas de IA",
    status: 500
  }
}

// GET - Retrieve saved tactics for a prospecto
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const prospectoId = searchParams.get("prospectoId")

    if (!prospectoId) {
      return NextResponse.json<ProspectoTacticsResponse>(
        { success: false, error: "ID do prospecto em falta" },
        { status: 400 }
      )
    }

    // Get the most recent saved tactic
    const savedTactic = await prisma.prospectoTactic.findFirst({
      where: { prospectoId },
      orderBy: { createdAt: "desc" }
    })

    if (!savedTactic) {
      return NextResponse.json<ProspectoTacticsResponse>({
        success: true,
        tactics: null,
        provider: null,
        generatedAt: null,
      })
    }

    return NextResponse.json<ProspectoTacticsResponse>({
      success: true,
      tactics: savedTactic.tactics as unknown as ProspectoTactics,
      provider: savedTactic.provider,
      generatedAt: savedTactic.createdAt.toISOString(),
      tacticId: savedTactic.id,
    })
  } catch (error) {
    console.error("Error fetching saved tactics:", error)
    return NextResponse.json<ProspectoTacticsResponse>(
      { success: false, error: "Erro ao carregar tácticas guardadas" },
      { status: 500 }
    )
  }
}

// POST - Generate new tactics and save them
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prospectoId, provider: requestedProvider } = body

    if (!prospectoId) {
      return NextResponse.json<ProspectoTacticsResponse>(
        { success: false, error: "ID do prospecto em falta" },
        { status: 400 }
      )
    }

    // Fetch prospecto data
    const prospecto = await prisma.prospecto.findUnique({
      where: { id: prospectoId },
    })

    if (!prospecto) {
      return NextResponse.json<ProspectoTacticsResponse>(
        { success: false, error: "Prospecto nao encontrado" },
        { status: 404 }
      )
    }

    // Determine provider
    let provider = await getAIProvider()
    if (requestedProvider === "openai") {
      provider = requestedProvider
    }

    // Build prompt with prospecto data
    const prompt = PROMPT_TEMPLATE
      .replace("{nomeEmpresa}", prospecto.nomeEmpresa || "Nao especificado")
      .replace("{tipoNegocio}", prospecto.tipoNegocio || "Nao especificado")
      .replace("{estado}", prospecto.estado || "NOVO")
      .replace("{nomeContacto}", prospecto.nomeContacto || "Nao especificado")
      .replace("{cargoContacto}", prospecto.cargoContacto || "Nao especificado")
      .replace("{telefone}", prospecto.telefone || "Nao disponivel")
      .replace("{email}", prospecto.email || "Nao disponivel")
      .replace("{cidade}", prospecto.cidade || "Nao especificada")
      .replace("{fonte}", prospecto.fonte || "Nao especificada")
      .replace("{proximaAccao}", prospecto.proximaAccao || "Nenhuma definida")
      .replace("{notas}", prospecto.notas || "Sem notas")
      .replace("{website}", prospecto.website || "Nao disponivel")
      .replace("{facebook}", prospecto.facebook || "Nao disponivel")
      .replace("{instagram}", prospecto.instagram || "Nao disponivel")

    // Get AI response
    const aiResponse = await generateAIResponse(prompt)

    // Parse JSON response
    let tactics: ProspectoTactics
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error("No JSON found in response")
      }
      const rawTactics = JSON.parse(jsonMatch[0])
      tactics = cleanTactics(rawTactics)
    } catch (parseError) {
      console.error("Failed to parse AI response:", aiResponse)
      return NextResponse.json<ProspectoTacticsResponse>(
        { success: false, error: "Erro ao processar resposta da IA" },
        { status: 500 }
      )
    }

    // Delete any existing tactics for this prospecto (keep only latest)
    await prisma.prospectoTactic.deleteMany({
      where: { prospectoId }
    })

    // Save the new tactics
    const savedTactic = await prisma.prospectoTactic.create({
      data: {
        prospectoId,
        tactics: tactics as object,
        provider,
      }
    })

    return NextResponse.json<ProspectoTacticsResponse>({
      success: true,
      tactics,
      provider,
      generatedAt: savedTactic.createdAt.toISOString(),
      tacticId: savedTactic.id,
    })
  } catch (error) {
    console.error("AI API error:", error)

    const { message, status } = getAIErrorMessage(error)

    return NextResponse.json<ProspectoTacticsResponse>(
      { success: false, error: message },
      { status }
    )
  }
}

// DELETE - Remove saved tactics
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const prospectoId = searchParams.get("prospectoId")
    const tacticId = searchParams.get("tacticId")

    if (!prospectoId && !tacticId) {
      return NextResponse.json(
        { success: false, error: "ID do prospecto ou tactic em falta" },
        { status: 400 }
      )
    }

    if (tacticId) {
      await prisma.prospectoTactic.delete({
        where: { id: tacticId }
      })
    } else if (prospectoId) {
      await prisma.prospectoTactic.deleteMany({
        where: { prospectoId }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting tactics:", error)
    return NextResponse.json(
      { success: false, error: "Erro ao eliminar tácticas" },
      { status: 500 }
    )
  }
}
