import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requirePermission, getEffectiveUserId, userScopedWhere, canViewAllData } from "@/lib/api-auth"
import { PERMISSIONS } from "@/lib/permissions"

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission(PERMISSIONS.ROTAS_WRITE)
    const { id } = await params
    const userId = getEffectiveUserId(session)
    const role = session.user.role || "ADMIN"

    // Check if route exists and belongs to user (unless MASTERADMIN)
    const route = await prisma.rotaSalva.findUnique({
      where: { id },
    })

    if (!route) {
      return NextResponse.json({ error: "Rota não encontrada" }, { status: 404 })
    }

    // Check ownership unless MASTERADMIN
    if (!canViewAllData(role) && route.userId !== userId) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 })
    }

    await prisma.rotaSalva.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof NextResponse) return error
    console.error("Error deleting route:", error)
    return NextResponse.json({ error: "Erro ao eliminar rota" }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission(PERMISSIONS.ROTAS_WRITE)
    const { id } = await params
    const userId = getEffectiveUserId(session)
    const role = session.user.role || "ADMIN"
    const body = await request.json()

    // Check if route exists and belongs to user
    const route = await prisma.rotaSalva.findUnique({
      where: { id },
    })

    if (!route) {
      return NextResponse.json({ error: "Rota não encontrada" }, { status: 404 })
    }

    if (!canViewAllData(role) && route.userId !== userId) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 })
    }

    const updated = await prisma.rotaSalva.update({
      where: { id },
      data: {
        concluida: body.concluida,
        custoReal: body.custoReal,
        notasCustos: body.notasCustos,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof NextResponse) return error
    console.error("Error updating route:", error)
    return NextResponse.json({ error: "Erro ao atualizar rota" }, { status: 500 })
  }
}
