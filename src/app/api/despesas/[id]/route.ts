import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { isAdminOrHigher } from "@/lib/permissions"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const despesa = await prisma.despesa.findUnique({
      where: { id },
      include: {
        imagens: true,
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    if (!despesa) {
      return NextResponse.json({ error: "Despesa não encontrada" }, { status: 404 })
    }

    // Check ownership
    if (despesa.userId !== session.user.id && !isAdminOrHigher(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json({
      ...despesa,
      valor: Number(despesa.valor)
    })
  } catch (error) {
    console.error("Error fetching despesa:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { tipo, valor, data, descricao } = body

    // Check ownership
    const existing = await prisma.despesa.findUnique({
      where: { id },
      select: { userId: true }
    })

    if (!existing) {
      return NextResponse.json({ error: "Despesa não encontrada" }, { status: 404 })
    }

    if (existing.userId !== session.user.id && !isAdminOrHigher(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const dataObj = data ? new Date(data) : undefined
    const updateData: Record<string, unknown> = {}

    if (tipo) updateData.tipo = tipo
    if (valor !== undefined) updateData.valor = parseFloat(valor)
    if (dataObj) {
      updateData.data = dataObj
      updateData.mes = dataObj.getMonth() + 1
      updateData.ano = dataObj.getFullYear()
    }
    if (descricao !== undefined) updateData.descricao = descricao || null

    const despesa = await prisma.despesa.update({
      where: { id },
      data: updateData,
      include: {
        imagens: true,
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    return NextResponse.json({
      ...despesa,
      valor: Number(despesa.valor)
    })
  } catch (error) {
    console.error("Error updating despesa:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

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

    // Check ownership
    const existing = await prisma.despesa.findUnique({
      where: { id },
      select: { userId: true }
    })

    if (!existing) {
      return NextResponse.json({ error: "Despesa não encontrada" }, { status: 404 })
    }

    if (existing.userId !== session.user.id && !isAdminOrHigher(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await prisma.despesa.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting despesa:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
