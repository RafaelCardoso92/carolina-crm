import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { userScopedWhere } from "@/lib/permissions"

// Helper to verify acordo belongs to user's client
async function verifyAcordoOwnership(id: string, session: any) {
  const userFilter = userScopedWhere(session)

  const acordo = await prisma.acordoParceria.findFirst({
    where: {
      id,
      cliente: userFilter
    },
    include: {
      cliente: { select: { id: true, userId: true } }
    }
  })

  return acordo
}

// PATCH - Update agreement
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Verify acordo belongs to user's client
    const existing = await verifyAcordoOwnership(id, session)
    if (!existing) {
      return NextResponse.json({ error: "Acordo não encontrado" }, { status: 404 })
    }

    const body = await request.json()

    const acordo = await prisma.acordoParceria.update({
      where: { id },
      data: body,
      include: {
        cliente: { select: { id: true, nome: true, codigo: true } }
      }
    })

    return NextResponse.json(acordo)
  } catch (error) {
    console.error("Error updating acordo:", error)
    return NextResponse.json({ error: "Erro ao atualizar acordo" }, { status: 500 })
  }
}

// DELETE - Deactivate agreement
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Verify acordo belongs to user's client
    const existing = await verifyAcordoOwnership(id, session)
    if (!existing) {
      return NextResponse.json({ error: "Acordo não encontrado" }, { status: 404 })
    }

    await prisma.acordoParceria.update({
      where: { id },
      data: { ativo: false, dataFim: new Date() }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting acordo:", error)
    return NextResponse.json({ error: "Erro ao desativar acordo" }, { status: 500 })
  }
}
