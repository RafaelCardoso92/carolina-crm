import { NextRequest, NextResponse } from "next/server"
import { getAvailableProviders } from "@/lib/ai"

// GET - Return current settings and available providers
export async function GET() {
  try {
    const available = getAvailableProviders()

    return NextResponse.json({
      success: true,
      provider: "openai",
      available
    })
  } catch (error) {
    console.error("Error fetching AI settings:", error)
    return NextResponse.json(
      { success: false, error: "Erro ao carregar definições de IA" },
      { status: 500 }
    )
  }
}

// POST - Only OpenAI is available now
export async function POST() {
  try {
    return NextResponse.json({
      success: true,
      provider: "openai",
      message: "ChatGPT selecionado"
    })
  } catch (error) {
    console.error("Error updating AI settings:", error)
    return NextResponse.json(
      { success: false, error: "Erro ao atualizar definições de IA" },
      { status: 500 }
    )
  }
}
