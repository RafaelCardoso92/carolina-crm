import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getTokenBalance } from "@/lib/ai"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const balance = await getTokenBalance(session.user.id)
    
    return NextResponse.json({
      total: balance.total,
      used: balance.used,
      remaining: balance.remaining,
      isNegative: balance.isNegative,
      formatted: formatTokens(balance.remaining)
    })
  } catch (error) {
    console.error("Error fetching token balance:", error)
    return NextResponse.json({ error: "Erro ao carregar saldo" }, { status: 500 })
  }
}

function formatTokens(tokens: number): string {
  const abs = Math.abs(tokens)
  const sign = tokens < 0 ? "-" : ""
  if (abs >= 1000000) {
    return sign + (abs / 1000000).toFixed(2) + "M"
  } else if (abs >= 1000) {
    return sign + (abs / 1000).toFixed(1) + "K"
  }
  return sign + abs.toString()
}
