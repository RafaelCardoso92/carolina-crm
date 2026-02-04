import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isAdminOrHigher } from "@/lib/permissions"

// GET - List all active sellers (for admin view)
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only admins can list all sellers
    if (!isAdminOrHigher(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const sellers = await prisma.user.findMany({
      where: {
        status: "ACTIVE",
        role: "SELLER"
      },
      select: {
        id: true,
        name: true,
        email: true,
        _count: {
          select: {
            clientes: true,
            prospectos: true,
          }
        }
      },
      orderBy: { name: "asc" }
    })

    return NextResponse.json({ sellers })
  } catch (error) {
    console.error("Error listing sellers:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
