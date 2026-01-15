import { NextRequest, NextResponse } from "next/server"
import { getAIProvider, setAIProvider, getAvailableProviders, AIProvider } from "@/lib/ai"
import type { AISettingsResponse } from "@/types/ai"

// GET - Get current AI settings
export async function GET() {
  try {
    const currentProvider = await getAIProvider()
    const availableProviders = getAvailableProviders()

    return NextResponse.json<AISettingsResponse>({
      currentProvider,
      availableProviders,
    })
  } catch (error) {
    console.error("Error getting AI settings:", error)
    return NextResponse.json(
      { error: "Erro ao obter definicoes de IA" },
      { status: 500 }
    )
  }
}

// POST - Update AI provider
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { provider } = body

    if (!provider || (provider !== "gemini" && provider !== "openai")) {
      return NextResponse.json(
        { error: "Fornecedor invalido. Use 'gemini' ou 'openai'" },
        { status: 400 }
      )
    }

    const availableProviders = getAvailableProviders()

    if (provider === "gemini" && !availableProviders.gemini) {
      return NextResponse.json(
        { error: "Gemini nao esta configurado. Adicione GEMINI_API_KEY." },
        { status: 400 }
      )
    }

    if (provider === "openai" && !availableProviders.openai) {
      return NextResponse.json(
        { error: "OpenAI nao esta configurado. Adicione OPENAI_API_KEY." },
        { status: 400 }
      )
    }

    await setAIProvider(provider as AIProvider)

    return NextResponse.json({
      success: true,
      provider,
      message: `Fornecedor de IA alterado para ${provider === "openai" ? "GPT-4" : "Gemini"}`
    })
  } catch (error) {
    console.error("Error setting AI provider:", error)
    return NextResponse.json(
      { error: "Erro ao alterar fornecedor de IA" },
      { status: 500 }
    )
  }
}
