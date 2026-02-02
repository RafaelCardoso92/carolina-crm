import OpenAI from "openai"
import { prisma } from "./prisma"

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null

export type AIProvider = "openai"

// ===========================================
// Response Cache (1 hour TTL)
// ===========================================
interface CacheEntry {
  response: string
  timestamp: number
}

const responseCache = new Map<string, CacheEntry>()
const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour

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
  responseCache.set(key, {
    response,
    timestamp: Date.now()
  })

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

export async function getAIProvider(): Promise<AIProvider> {
  return "openai"
}

export async function generateAIResponse(prompt: string): Promise<string> {
  if (!openai) {
    throw new Error("OpenAI API key not configured")
  }

  // Check cache first
  const cached = getCachedResponse(prompt)
  if (cached) {
    console.log("[AI] Cache hit")
    return cached
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4.1",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
  })

  const result = response.choices[0]?.message?.content || ""
  
  // Cache the response
  setCachedResponse(prompt, result)

  return result
}

export function getAvailableProviders(): { gemini: boolean; openai: boolean } {
  return {
    gemini: false,
    openai: !!openai,
  }
}

export async function setAIProvider(): Promise<void> {
  // Only OpenAI available now
}
