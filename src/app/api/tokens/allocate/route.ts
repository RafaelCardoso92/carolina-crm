import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { allocateTokens } from "@/lib/ai"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is MASTERADMIN
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (currentUser?.role !== "MASTERADMIN") {
      return NextResponse.json({ error: "Forbidden - MASTERADMIN only" }, { status: 403 })
    }

    const body = await request.json()
    const { userId, tokens, reason } = body

    // Validate inputs
    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ error: "Invalid userId" }, { status: 400 })
    }

    const tokenAmount = parseInt(tokens)
    if (isNaN(tokenAmount) || tokenAmount <= 0 || tokenAmount > 100000000) {
      return NextResponse.json({ error: "Invalid token amount (1 - 100M)" }, { status: 400 })
    }

    // Verify target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true }
    })

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Allocate tokens
    await allocateTokens(userId, tokenAmount, session.user.id, reason || "Admin allocation")

    // Get updated balance
    const balance = await prisma.tokenBalance.findUnique({
      where: { userId }
    })

    return NextResponse.json({
      success: true,
      user: targetUser,
      allocated: tokenAmount,
      newBalance: {
        total: balance?.tokensTotal || tokenAmount,
        used: balance?.tokensUsed || 0
      }
    })
  } catch (error) {
    console.error("Error allocating tokens:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// GET all users with their token balances (for admin)
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is MASTERADMIN
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (currentUser?.role !== "MASTERADMIN") {
      return NextResponse.json({ error: "Forbidden - MASTERADMIN only" }, { status: 403 })
    }

    // Get all users with their balances
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        tokenBalance: {
          select: {
            tokensTotal: true,
            tokensUsed: true
          }
        }
      },
      orderBy: { name: "asc" }
    })

    return NextResponse.json(users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      tokensTotal: u.tokenBalance?.tokensTotal || 0,
      tokensUsed: u.tokenBalance?.tokensUsed || 0,
      tokensRemaining: (u.tokenBalance?.tokensTotal || 0) - (u.tokenBalance?.tokensUsed || 0)
    })))
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
