import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET - Get a single visit
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

    const visita = await prisma.visita.findUnique({
      where: { id },
      include: {
        cliente: {
          select: { id: true, nome: true, codigo: true, cidade: true, telefone: true, morada: true }
        },
        prospecto: {
          select: { id: true, nomeEmpresa: true, estado: true, cidade: true, telefone: true, morada: true }
        },
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    if (!visita) {
      return NextResponse.json({ error: "Visita nao encontrada" }, { status: 404 })
    }

    return NextResponse.json(visita)
  } catch (error) {
    console.error("Error fetching visita:", error)
    return NextResponse.json(
      { error: "Erro ao carregar visita" },
      { status: 500 }
    )
  }
}

// PUT - Update a visit
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

    const {
      dataAgendada,
      dataRealizada,
      duracao,
      estado,
      objetivo,
      notas,
      resultado,
      proximosPassos,
      clienteId,
      prospectoId
    } = body

    const updateData: Record<string, unknown> = {}

    if (dataAgendada !== undefined) updateData.dataAgendada = new Date(dataAgendada)
    if (dataRealizada !== undefined) updateData.dataRealizada = dataRealizada ? new Date(dataRealizada) : null
    if (duracao !== undefined) updateData.duracao = duracao
    if (estado !== undefined) updateData.estado = estado
    if (objetivo !== undefined) updateData.objetivo = objetivo
    if (notas !== undefined) updateData.notas = notas
    if (resultado !== undefined) updateData.resultado = resultado
    if (proximosPassos !== undefined) updateData.proximosPassos = proximosPassos
    if (clienteId !== undefined) updateData.clienteId = clienteId || null
    if (prospectoId !== undefined) updateData.prospectoId = prospectoId || null

    // If marking as REALIZADA and no dataRealizada provided, use current time
    if (estado === "REALIZADA" && !dataRealizada && !updateData.dataRealizada) {
      updateData.dataRealizada = new Date()
    }

    const visita = await prisma.visita.update({
      where: { id },
      data: updateData,
      include: {
        cliente: {
          select: { id: true, nome: true, codigo: true, cidade: true }
        },
        prospecto: {
          select: { id: true, nomeEmpresa: true, estado: true, cidade: true }
        }
      }
    })

    return NextResponse.json(visita)
  } catch (error) {
    console.error("Error updating visita:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar visita" },
      { status: 500 }
    )
  }
}

// DELETE - Delete a visit
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

    await prisma.visita.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting visita:", error)
    return NextResponse.json(
      { error: "Erro ao eliminar visita" },
      { status: 500 }
    )
  }
}
