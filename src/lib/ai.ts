import { GoogleGenerativeAI } from "@google/generative-ai"
import OpenAI from "openai"
import { prisma } from "./prisma"

// Initialize clients
const gemini = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null

export type AIProvider = "gemini" | "openai"

// ===========================================
// Rate Limiting for Gemini (Free tier: 15 RPM)
// ===========================================
const GEMINI_MAX_REQUESTS_PER_MINUTE = 12 // Stay under the 15 RPM limit
const GEMINI_MIN_DELAY_MS = 5000 // Minimum 4 seconds between requests

interface RateLimitState {
  requestTimestamps: number[]
  lastRequestTime: number
  queue: Array<{
    resolve: (value: string) => void
    reject: (error: Error) => void
    prompt: string
  }>
  processing: boolean
}

const geminiRateLimit: RateLimitState = {
  requestTimestamps: [],
  lastRequestTime: 0,
  queue: [],
  processing: false
}

// Clean old timestamps (older than 1 minute)
function cleanOldTimestamps() {
  const oneMinuteAgo = Date.now() - 60000
  geminiRateLimit.requestTimestamps = geminiRateLimit.requestTimestamps.filter(
    ts => ts > oneMinuteAgo
  )
}

// Check if we can make a request
function canMakeGeminiRequest(): boolean {
  cleanOldTimestamps()

  // Check requests per minute limit
  if (geminiRateLimit.requestTimestamps.length >= GEMINI_MAX_REQUESTS_PER_MINUTE) {
    return false
  }

  // Check minimum delay between requests
  const timeSinceLastRequest = Date.now() - geminiRateLimit.lastRequestTime
  if (timeSinceLastRequest < GEMINI_MIN_DELAY_MS) {
    return false
  }

  return true
}

// Get wait time until next request is allowed
function getWaitTime(): number {
  cleanOldTimestamps()

  // If at rate limit, wait until oldest request expires
  if (geminiRateLimit.requestTimestamps.length >= GEMINI_MAX_REQUESTS_PER_MINUTE) {
    const oldestTimestamp = geminiRateLimit.requestTimestamps[0]
    return Math.max(0, (oldestTimestamp + 60000) - Date.now() + 100)
  }

  // Otherwise, wait for minimum delay
  const timeSinceLastRequest = Date.now() - geminiRateLimit.lastRequestTime
  if (timeSinceLastRequest < GEMINI_MIN_DELAY_MS) {
    return GEMINI_MIN_DELAY_MS - timeSinceLastRequest + 100
  }

  return 0
}

// Process the Gemini request queue
async function processGeminiQueue() {
  if (geminiRateLimit.processing || geminiRateLimit.queue.length === 0) {
    return
  }

  geminiRateLimit.processing = true

  while (geminiRateLimit.queue.length > 0) {
    // Wait if needed
    if (!canMakeGeminiRequest()) {
      const waitTime = getWaitTime()
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }

    const request = geminiRateLimit.queue.shift()
    if (!request) break

    try {
      // Record this request
      geminiRateLimit.requestTimestamps.push(Date.now())
      geminiRateLimit.lastRequestTime = Date.now()

      // Make the actual request
      const result = await executeGeminiRequest(request.prompt)
      request.resolve(result)
    } catch (error) {
      request.reject(error instanceof Error ? error : new Error(String(error)))
    }
  }

  geminiRateLimit.processing = false
}

// Execute single Gemini request (internal)
async function executeGeminiRequest(prompt: string): Promise<string> {
  if (!gemini) {
    throw new Error("Gemini API key not configured")
  }

  const model = gemini.getGenerativeModel({ model: "gemini-1.5-flash" })
  const result = await model.generateContent(prompt)
  const response = await result.response
  return response.text()
}

// ===========================================
// Response Cache (1 hour TTL)
// ===========================================
interface CacheEntry {
  response: string
  timestamp: number
  provider: AIProvider
}

const responseCache = new Map<string, CacheEntry>()
const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour

function getCacheKey(prompt: string, provider: AIProvider): string {
  // Create a simple hash of the prompt
  let hash = 0
  for (let i = 0; i < prompt.length; i++) {
    const char = prompt.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return `${provider}:${hash}`
}

function getCachedResponse(prompt: string, provider: AIProvider): string | null {
  const key = getCacheKey(prompt, provider)
  const entry = responseCache.get(key)

  if (!entry) return null

  // Check if expired
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    responseCache.delete(key)
    return null
  }

  return entry.response
}

function setCachedResponse(prompt: string, provider: AIProvider, response: string) {
  const key = getCacheKey(prompt, provider)
  responseCache.set(key, {
    response,
    timestamp: Date.now(),
    provider
  })

  // Clean old entries periodically (keep cache size reasonable)
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
// Public API
// ===========================================

// Get current provider from database settings or env
export async function getAIProvider(): Promise<AIProvider> {
  try {
    const config = await prisma.configuracao.findUnique({
      where: { chave: "ai_provider" }
    })

    if (config?.valor === "openai" && openai) {
      return "openai"
    }
    if (config?.valor === "gemini" && gemini) {
      return "gemini"
    }
  } catch {
    // Database not available or config not found
  }

  const envProvider = process.env.AI_PROVIDER as AIProvider
  if (envProvider === "openai" && openai) {
    return "openai"
  }
  if (envProvider === "gemini" && gemini) {
    return "gemini"
  }

  if (openai) return "openai"
  if (gemini) return "gemini"

  throw new Error("No AI provider configured")
}

// Generate AI response with caching and rate limiting
export async function generateAIResponse(prompt: string, provider?: AIProvider): Promise<string> {
  const selectedProvider = provider || await getAIProvider()

  // Check cache first
  const cached = getCachedResponse(prompt, selectedProvider)
  if (cached) {
    console.log(`[AI] Cache hit for ${selectedProvider}`)
    return cached
  }

  let response: string

  if (selectedProvider === "openai") {
    if (!openai) {
      throw new Error("OpenAI API key not configured")
    }
    response = await generateOpenAIResponse(prompt)
  } else {
    if (!gemini) {
      throw new Error("Gemini API key not configured")
    }
    response = await generateGeminiResponseWithRateLimit(prompt)
  }

  // Cache the response
  setCachedResponse(prompt, selectedProvider, response)

  return response
}

// Gemini with rate limiting (queued)
async function generateGeminiResponseWithRateLimit(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    geminiRateLimit.queue.push({ resolve, reject, prompt })
    processGeminiQueue()
  })
}

// OpenAI (no rate limiting needed for typical usage)
async function generateOpenAIResponse(prompt: string): Promise<string> {
  if (!openai) {
    throw new Error("OpenAI API key not configured")
  }

  const response = await openai.chat.completions.create({
    model: "gpt-5.1",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
  })

  return response.choices[0]?.message?.content || ""
}

// Check which providers are available
export function getAvailableProviders(): { gemini: boolean; openai: boolean } {
  return {
    gemini: !!gemini,
    openai: !!openai,
  }
}

// Set the AI provider in the database
export async function setAIProvider(provider: AIProvider): Promise<void> {
  await prisma.configuracao.upsert({
    where: { chave: "ai_provider" },
    update: { valor: provider },
    create: {
      chave: "ai_provider",
      valor: provider,
      descricao: "Fornecedor de IA preferido (gemini ou openai)"
    }
  })
}

// Get rate limit status (useful for UI feedback)
export function getGeminiRateLimitStatus(): {
  requestsInLastMinute: number
  maxRequestsPerMinute: number
  queueLength: number
  canMakeRequest: boolean
  waitTimeMs: number
} {
  cleanOldTimestamps()
  return {
    requestsInLastMinute: geminiRateLimit.requestTimestamps.length,
    maxRequestsPerMinute: GEMINI_MAX_REQUESTS_PER_MINUTE,
    queueLength: geminiRateLimit.queue.length,
    canMakeRequest: canMakeGeminiRequest(),
    waitTimeMs: getWaitTime()
  }
}
