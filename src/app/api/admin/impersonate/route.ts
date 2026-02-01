import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requirePermission, getAuthSession } from "@/lib/api-auth"
import { PERMISSIONS } from "@/lib/permissions"

// POST /api/admin/impersonate - Start impersonating a user
export async function POST(request: Request) {
  try {
    const session = await requirePermission(PERMISSIONS.IMPERSONATE)

    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { error: "ID do usuário é obrigatório" },
        { status: 400 }
      )
    }

    // Prevent impersonating yourself
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: "Não pode impersonar a própria conta" },
        { status: 400 }
      )
    }

    // Get user to impersonate
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true
      }
    })

    if (!targetUser) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      )
    }

    // Log the impersonation
    await prisma.impersonationLog.create({
      data: {
        impersonatorId: session.user.id,
        impersonatedUserId: targetUser.id,
        impersonatedEmail: targetUser.email
      }
    })

    // Return the user data to be stored in session
    return NextResponse.json({
      impersonating: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email
      }
    })
  } catch (error) {
    if (error instanceof NextResponse) {
      return error
    }
    console.error("Error starting impersonation:", error)
    return NextResponse.json(
      { error: "Erro ao iniciar impersonação" },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/impersonate - Stop impersonating
export async function DELETE() {
  try {
    const session = await getAuthSession()

    if (!session?.user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      )
    }

    // Update the impersonation log to mark it as ended
    if (session.user.impersonating) {
      await prisma.impersonationLog.updateMany({
        where: {
          impersonatorId: session.user.originalUserId || session.user.id,
          impersonatedUserId: session.user.impersonating.id,
          endedAt: null
        },
        data: {
          endedAt: new Date()
        }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof NextResponse) {
      return error
    }
    console.error("Error stopping impersonation:", error)
    return NextResponse.json(
      { error: "Erro ao parar impersonação" },
      { status: 500 }
    )
  }
}
