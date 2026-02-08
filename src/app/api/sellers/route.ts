import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isAdminOrHigher, hasPermission, PERMISSIONS } from "@/lib/permissions"
import { UserRole } from "@prisma/client"

// GET - List all active sellers/users for filtering
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const role = session.user.role as UserRole

    // Only admins can list sellers
    if (!isAdminOrHigher(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const canManageAll = hasPermission(role, PERMISSIONS.MANAGE_USERS)
    
    // MASTERADMIN sees all users, ADMIN sees only SELLER
    const whereClause = canManageAll 
      ? { status: "ACTIVE" as const, role: { not: "MASTERADMIN" as const } }
      : { status: "ACTIVE" as const, role: "SELLER" as UserRole }

    const sellers = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        _count: {
          select: {
            clientes: true,
            prospectos: true,
          }
        }
      },
      orderBy: { name: "asc" }
    })

    // Return array directly for easier consumption
    return NextResponse.json(sellers)
  } catch (error) {
    console.error("Error listing sellers:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
