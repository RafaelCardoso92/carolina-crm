import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// DELETE - Remove incidencia
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

    await prisma.incidencia.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting incidencia:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT - Update incidencia
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
    const { valor, motivo, notas } = body

    const incidencia = await prisma.incidencia.update({
      where: { id },
      data: {
        ...(valor !== undefined && { valor }),
        ...(motivo && { motivo }),
        ...(notas !== undefined && { notas })
      }
    })

    return NextResponse.json(incidencia)
  } catch (error) {
    console.error("Error updating incidencia:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
