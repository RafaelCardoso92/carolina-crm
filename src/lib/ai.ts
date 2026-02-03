import OpenAI from "openai"
import { prisma } from "./prisma"

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null

export type AIProvider = "openai"

const TOKENS_PER_EUR = 200000
const EUR_PER_TOKEN = 0.000005

// ===========================================
// Response Cache (1 hour TTL)
// ===========================================
interface CacheEntry {
  response: string
  timestamp: number
}

const responseCache = new Map<string, CacheEntry>()
const CACHE_TTL_MS = 60 * 60 * 1000

function getCacheKey(prompt: string): string {
  let hash = 0
  for (let i = 0; i < prompt.length; i++) {
    const char = prompt.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return `openai:${hash}`
}

function getCachedResponse(prompt: string): string | null {
  const key = getCacheKey(prompt)
  const entry = responseCache.get(key)
  if (!entry) return null
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    responseCache.delete(key)
    return null
  }
  return entry.response
}

function setCachedResponse(prompt: string, response: string) {
  const key = getCacheKey(prompt)
  responseCache.set(key, { response, timestamp: Date.now() })
  if (responseCache.size > 100) {
    const now = Date.now()
    for (const [k, v] of responseCache) {
      if (now - v.timestamp > CACHE_TTL_MS) {
        responseCache.delete(k)
      }
    }
  }
}

// ===========================================
// Token Management
// ===========================================

export async function getTokenBalance(userId: string): Promise<{ total: number; used: number; remaining: number; isNegative: boolean }> {
  const balance = await prisma.tokenBalance.findUnique({
    where: { userId }
  })
  
  if (!balance) {
    return { total: 0, used: 0, remaining: 0, isNegative: false }
  }
  
  const remaining = balance.tokensTotal - balance.tokensUsed
  return {
    total: balance.tokensTotal,
    used: balance.tokensUsed,
    remaining,
    isNegative: remaining < 0
  }
}

// Allow going negative ONCE - if already negative, block
export async function checkTokens(userId: string, estimatedTokens: number): Promise<{ allowed: boolean; isNegative: boolean; remaining: number }> {
  const balance = await getTokenBalance(userId)
  
  // If already negative, they must add more tokens
  if (balance.remaining < 0) {
    return { allowed: false, isNegative: true, remaining: balance.remaining }
  }
  
  // If they have tokens OR this would be their first time going negative, allow
  // (allowing one negative use)
  return { allowed: true, isNegative: false, remaining: balance.remaining }
}

async function deductTokens(userId: string, inputTokens: number, outputTokens: number, feature: string): Promise<void> {
  const totalTokens = inputTokens + outputTokens
  const costEur = totalTokens * EUR_PER_TOKEN
  
  await prisma.tokenBalance.upsert({
    where: { userId },
    create: {
      userId,
      tokensTotal: 0,
      tokensUsed: totalTokens
    },
    update: {
      tokensUsed: { increment: totalTokens }
    }
  })
  
  await prisma.tokenUsage.create({
    data: {
      userId,
      inputTokens,
      outputTokens,
      totalTokens,
      costEur,
      feature
    }
  })
}

// ===========================================
// Public API
// ===========================================

export async function getAIProvider(): Promise<AIProvider> {
  return "openai"
}

export async function generateAIResponse(
  prompt: string, 
  userId: string,
  feature: string = "general"
): Promise<string> {
  if (!openai) {
    throw new Error("OpenAI API key not configured")
  }

  const estimatedInputTokens = Math.ceil(prompt.length / 4)
  const estimatedOutputTokens = 1000
  const estimatedTotal = estimatedInputTokens + estimatedOutputTokens

  // Check if user can use tokens (allows going negative once)
  const tokenCheck = await checkTokens(userId, estimatedTotal)
  if (!tokenCheck.allowed) {
    throw new Error("INSUFFICIENT_TOKENS")
  }

  const cached = getCachedResponse(prompt)
  if (cached) {
    console.log("[AI] Cache hit")
    return cached
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
  })

  const result = response.choices[0]?.message?.content || ""
  
  const inputTokens = response.usage?.prompt_tokens || estimatedInputTokens
  const outputTokens = response.usage?.completion_tokens || Math.ceil(result.length / 4)
  
  await deductTokens(userId, inputTokens, outputTokens, feature)
  setCachedResponse(prompt, result)
  
  // Attach token usage info to the result
  ;(result as any).__tokensUsed = inputTokens + outputTokens

  return result
}

export async function generateAIResponseLegacy(prompt: string): Promise<string> {
  throw new Error("generateAIResponse now requires userId for token tracking")
}

export function getAvailableProviders(): { gemini: boolean; openai: boolean } {
  return {
    gemini: false,
    openai: !!openai,
  }
}

export async function setAIProvider(): Promise<void> {}

// ===========================================
// Admin Functions
// ===========================================

export async function allocateTokens(
  userId: string, 
  tokens: number, 
  allocatedBy: string,
  reason?: string
): Promise<void> {
  await prisma.tokenBalance.upsert({
    where: { userId },
    create: {
      userId,
      tokensTotal: tokens,
      tokensUsed: 0
    },
    update: {
      tokensTotal: { increment: tokens }
    }
  })
  
  await prisma.tokenAllocation.create({
    data: {
      userId,
      tokens,
      allocatedBy,
      reason
    }
  })
}

export async function addPurchasedTokens(userId: string, amountEur: number, stripePaymentId: string): Promise<number> {
  const tokens = Math.floor(amountEur * TOKENS_PER_EUR)
  
  await prisma.tokenBalance.upsert({
    where: { userId },
    create: {
      userId,
      tokensTotal: tokens,
      tokensUsed: 0
    },
    update: {
      tokensTotal: { increment: tokens }
    }
  })
  
  return tokens
}
