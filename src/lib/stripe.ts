import Stripe from "stripe"

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn("STRIPE_SECRET_KEY not configured")
}

export const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-01-28.clover",
    })
  : null

// Pricing: €5 per 1M tokens
export const TOKENS_PER_EUR = 200000 // 200K tokens per €1
export const MIN_PURCHASE_EUR = 5

export function calculateTokens(amountEur: number): number {
  return Math.floor(amountEur * TOKENS_PER_EUR)
}

export function formatTokens(tokens: number): string {
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(2)}M`
  } else if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}K`
  }
  return tokens.toString()
}
