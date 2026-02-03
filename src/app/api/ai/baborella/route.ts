import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import OpenAI from "openai"
import { getTokenBalance, checkTokens } from "@/lib/ai"

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null

const EUR_PER_TOKEN = 0.000005

type Message = {
  role: "user" | "assistant" | "system"
  content: string
  timestamp?: string
  tokensUsed?: number
}

// GET - Fetch chat history
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const entityType = searchParams.get("entityType")
    const entityId = searchParams.get("entityId")

    if (!entityType || !entityId) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 })
    }

    const chat = await prisma.baborellaChat.findUnique({
      where: {
        userId_entityType_entityId: {
          userId: session.user.id,
          entityType,
          entityId
        }
      }
    })

    const balance = await getTokenBalance(session.user.id)

    return NextResponse.json({
      messages: chat?.messages || [],
      tokens: {
        remaining: balance.remaining,
        isNegative: balance.isNegative
      }
    })
  } catch (error) {
    console.error("Error fetching Baborella chat:", error)
    return NextResponse.json({ error: "Erro ao carregar conversa" }, { status: 500 })
  }
}

// POST - Send message
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!openai) {
      return NextResponse.json({ error: "OpenAI not configured" }, { status: 500 })
    }

    const body = await request.json()
    const { entityType, entityId, message, context } = body

    if (!entityType || !entityId || !message) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 })
    }

    const userId = session.user.id

    // Check tokens
    const tokenCheck = await checkTokens(userId, 2000)
    if (!tokenCheck.allowed) {
      return NextResponse.json({
        error: "INSUFFICIENT_TOKENS",
        tokensNeeded: 2000,
        tokensAvailable: tokenCheck.remaining
      }, { status: 402 })
    }

    // Get existing chat
    const existingChat = await prisma.baborellaChat.findUnique({
      where: {
        userId_entityType_entityId: { userId, entityType, entityId }
      }
    })

    const existingMessages: Message[] = (existingChat?.messages as Message[]) || []

    // Build system prompt with context
    const entityName = entityType === "cliente" ? "cliente" : "prospecto"
    const systemPrompt = `Tu es a Baborella, uma assistente de vendas super fofa, doce e prestavel. Falas portugues de Portugal com um toque chique e elegante. Es especialista em ajudar vendedores a ter sucesso com os seus clientes.

CONTEXTO DO ${entityName.toUpperCase()}:
${context}

INSTRUCOES:
- Responde sempre em portugues de Portugal (nao brasileiro)
- Se fofa e encorajadora, mas profissional
- Da conselhos praticos e estrategicos sobre vendas
- Usa expressoes portuguesas como "olha", "pronto", "fixe", "giro"
- Podes usar emojis com moderacao para ser mais expressiva
- Foca-te em ajudar o utilizador a ter sucesso com este ${entityName} especifico
- Se nao souberes algo, admite com graciosidade
- Assina sempre como "Baborella" no final das respostas mais longas`

    // Build messages for OpenAI
    const openaiMessages: { role: "system" | "user" | "assistant"; content: string }[] = [
      { role: "system", content: systemPrompt }
    ]

    // Add last 10 messages for context
    const recentMessages = existingMessages.slice(-10)
    for (const msg of recentMessages) {
      openaiMessages.push({
        role: msg.role as "user" | "assistant",
        content: msg.content
      })
    }

    // Add current message
    openaiMessages.push({ role: "user", content: message })

    // Call OpenAI
    let response
    try {
      response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: openaiMessages,
        temperature: 0.8,
        max_tokens: 1000
      })
    } catch (openaiError) {
      console.error("OpenAI API error:", openaiError)
      // Return error WITHOUT charging tokens
      return NextResponse.json({ 
        error: "Erro ao contactar a IA. Tenta novamente!",
        tokensUsed: 0
      }, { status: 500 })
    }

    const assistantMessage = response.choices[0]?.message?.content
    
    // If no valid response, don't charge tokens
    if (!assistantMessage || assistantMessage.trim() === "") {
      console.error("OpenAI returned empty response")
      return NextResponse.json({ 
        error: "A Baborella nao conseguiu responder. Tenta novamente!",
        tokensUsed: 0
      }, { status: 500 })
    }

    const inputTokens = response.usage?.prompt_tokens || 0
    const outputTokens = response.usage?.completion_tokens || 0
    const totalTokens = inputTokens + outputTokens

    // Only deduct tokens if we have a valid response
    await prisma.tokenBalance.upsert({
      where: { userId },
      create: { userId, tokensTotal: 0, tokensUsed: totalTokens },
      update: { tokensUsed: { increment: totalTokens } }
    })

    await prisma.tokenUsage.create({
      data: {
        userId,
        inputTokens,
        outputTokens,
        totalTokens,
        costEur: totalTokens * EUR_PER_TOKEN,
        feature: "baborella_chat"
      }
    })

    // Save messages
    const newUserMessage: Message = {
      role: "user",
      content: message,
      timestamp: new Date().toISOString()
    }

    const newAssistantMessage: Message = {
      role: "assistant",
      content: assistantMessage,
      timestamp: new Date().toISOString(),
      tokensUsed: totalTokens
    }

    const updatedMessages = [...existingMessages, newUserMessage, newAssistantMessage]

    await prisma.baborellaChat.upsert({
      where: {
        userId_entityType_entityId: { userId, entityType, entityId }
      },
      create: {
        userId,
        entityType,
        entityId,
        messages: updatedMessages
      },
      update: {
        messages: updatedMessages
      }
    })

    // Get updated balance
    const newBalance = await getTokenBalance(userId)

    return NextResponse.json({
      message: assistantMessage,
      tokensUsed: totalTokens,
      tokens: {
        remaining: newBalance.remaining,
        isNegative: newBalance.isNegative
      }
    })
  } catch (error) {
    console.error("Error in Baborella chat:", error)
    // Generic error - no tokens charged
    return NextResponse.json({ 
      error: "Erro ao processar mensagem",
      tokensUsed: 0 
    }, { status: 500 })
  }
}

// DELETE - Clear chat history
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const entityType = searchParams.get("entityType")
    const entityId = searchParams.get("entityId")

    if (!entityType || !entityId) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 })
    }

    await prisma.baborellaChat.delete({
      where: {
        userId_entityType_entityId: {
          userId: session.user.id,
          entityType,
          entityId
        }
      }
    }).catch(() => {})

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting Baborella chat:", error)
    return NextResponse.json({ error: "Erro ao limpar conversa" }, { status: 500 })
  }
}
