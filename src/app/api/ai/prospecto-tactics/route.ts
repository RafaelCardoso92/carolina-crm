import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateAIResponse, getAIProvider, setAIProvider } from "@/lib/ai"
import type { ProspectoTacticsResponse, ProspectoTactics } from "@/types/ai"

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

IMPORTANTE: Responda APENAS com JSON valido no seguinte formato, sem texto adicional:
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

    // If a specific provider was requested, use it for this request
    let provider = await getAIProvider()
    if (requestedProvider && (requestedProvider === "gemini" || requestedProvider === "openai")) {
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

    // Get AI response using the selected provider
    const aiResponse = await generateAIResponse(prompt, provider)

    // Parse JSON response
    let tactics: ProspectoTactics
    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error("No JSON found in response")
      }
      tactics = JSON.parse(jsonMatch[0])
    } catch (parseError) {
      console.error("Failed to parse AI response:", aiResponse)
      return NextResponse.json<ProspectoTacticsResponse>(
        { success: false, error: "Erro ao processar resposta da IA" },
        { status: 500 }
      )
    }

    return NextResponse.json<ProspectoTacticsResponse>({
      success: true,
      tactics,
      provider,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("AI API error:", error)

    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"

    if (errorMessage.includes("429") || errorMessage.includes("rate") || errorMessage.includes("quota")) {
      return NextResponse.json<ProspectoTacticsResponse>(
        { success: false, error: "Limite de pedidos excedido. Tente novamente em alguns minutos." },
        { status: 429 }
      )
    }

    return NextResponse.json<ProspectoTacticsResponse>(
      { success: false, error: "Erro ao gerar tacticas de IA" },
      { status: 500 }
    )
  }
}
