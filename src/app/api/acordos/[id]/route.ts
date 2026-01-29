import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// PATCH - Update agreement
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
    const { id } = await params

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
