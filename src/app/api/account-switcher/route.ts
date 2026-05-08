import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/api-auth"

// GET /api/account-switcher
// Returns the accounts the caller can switch into via the sidebar account
// switcher (users with managedByUserId === caller.id). Drives whether the
// switcher renders at all.
// Note: lives outside /api/me/* because a Cloudflare WAF/Page-Rule at the
// zone returns 404 for unmatched /api/me/<sub> paths before they hit the
// origin tunnel.
export async function GET() {
  try {
    const session = await requireAuth()

    const managed = await prisma.user.findMany({
      where: { managedByUserId: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        status: true
      },
      orderBy: { name: "asc" }
    })

    return NextResponse.json({ managed })
  } catch (error) {
    if (error instanceof NextResponse) return error
    console.error("Error fetching managed users:", error)
    return NextResponse.json(
      { error: "Erro ao carregar contas geridas" },
      { status: 500 }
    )
  }
}
