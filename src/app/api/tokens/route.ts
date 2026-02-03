import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { formatTokens } from "@/lib/stripe"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const searchParams = request.nextUrl.searchParams
    const includeUsage = searchParams.get("usage") === "true"

    // Get balance
    const balance = await prisma.tokenBalance.findUnique({
      where: { userId }
    })

    const result: {
      balance: {
        total: number
        used: number
        remaining: number
        totalFormatted: string
        usedFormatted: string
        remainingFormatted: string
      }
      usage?: Array<{
        id: string
        inputTokens: number
        outputTokens: number
        totalTokens: number
        costEur: number
        feature: string
        createdAt: Date
      }>
      purchases?: Array<{
        id: string
        tokens: number
        amountEur: number
        status: string
        createdAt: Date
      }>
    } = {
      balance: {
        total: balance?.tokensTotal || 0,
        used: balance?.tokensUsed || 0,
        remaining: (balance?.tokensTotal || 0) - (balance?.tokensUsed || 0),
        totalFormatted: formatTokens(balance?.tokensTotal || 0),
        usedFormatted: formatTokens(balance?.tokensUsed || 0),
        remainingFormatted: formatTokens((balance?.tokensTotal || 0) - (balance?.tokensUsed || 0))
      }
    }

    if (includeUsage) {
      // Get recent usage (last 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const [usage, purchases] = await Promise.all([
        prisma.tokenUsage.findMany({
          where: {
            userId,
            createdAt: { gte: thirtyDaysAgo }
          },
          orderBy: { createdAt: "desc" },
          take: 100
        }),
        prisma.tokenPurchase.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: 20
        })
      ])

      result.usage = usage.map(u => ({
        ...u,
        costEur: Number(u.costEur)
      }))
      result.purchases = purchases.map(p => ({
        ...p,
        amountEur: Number(p.amountEur)
      }))
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error fetching tokens:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
