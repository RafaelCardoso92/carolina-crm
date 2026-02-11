import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/messages/unread - Get unread message count
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
    }

    const count = await prisma.message.count({
      where: {
        recipientId: session.user.id,
        read: false
      }
    })

    const flaggedCount = await prisma.message.count({
      where: {
        recipientId: session.user.id,
        flagged: true,
        read: false
      }
    })

    return NextResponse.json({ count, flaggedCount })
  } catch (error) {
    console.error("Error fetching unread count:", error)
    return NextResponse.json({ error: "Erro" }, { status: 500 })
  }
}
