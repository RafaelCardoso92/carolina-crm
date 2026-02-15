import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET - Get single task
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const tarefa = await prisma.tarefa.findUnique({
      where: { id },
      include: {
        cliente: {
          select: { id: true, nome: true, codigo: true }
        },
        prospecto: {
          select: { id: true, nomeEmpresa: true, estado: true }
        }
      }
    })

    if (!tarefa) {
      return NextResponse.json(
        { error: "Tarefa não encontrada" },
        { status: 404 }
      )
    }

    return NextResponse.json(tarefa)
  } catch (error) {
    console.error("Error fetching tarefa:", error)
    return NextResponse.json(
      { error: "Erro ao carregar tarefa" },
      { status: 500 }
    )
  }
}

// PUT - Update task
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const {
      titulo,
      descricao,
      tipo,
      prioridade,
      estado,
      dataVencimento,
      dataLembrete,
      clienteId,
      prospectoId
    } = body

    // Build update data
    const updateData: Record<string, unknown> = {}
    
    if (titulo !== undefined) updateData.titulo = titulo
    if (descricao !== undefined) updateData.descricao = descricao
    if (tipo !== undefined) updateData.tipo = tipo
    if (prioridade !== undefined) updateData.prioridade = prioridade
    if (estado !== undefined) {
      updateData.estado = estado
      // Set completion date if marking as done
      if (estado === "CONCLUIDA") {
        updateData.dataConclusao = new Date()
      } else if (estado === "PENDENTE" || estado === "EM_PROGRESSO") {
        updateData.dataConclusao = null
      }
    }
    if (dataVencimento !== undefined) {
      updateData.dataVencimento = dataVencimento ? new Date(dataVencimento) : null
    }
    if (dataLembrete !== undefined) {
      updateData.dataLembrete = dataLembrete ? new Date(dataLembrete) : null
    }
    if (clienteId !== undefined) {
      updateData.clienteId = clienteId || null
    }
    if (prospectoId !== undefined) {
      updateData.prospectoId = prospectoId || null
    }

    const tarefa = await prisma.tarefa.update({
      where: { id },
      data: updateData,
      include: {
        cliente: {
          select: { id: true, nome: true, codigo: true }
        },
        prospecto: {
          select: { id: true, nomeEmpresa: true, estado: true }
        }
      }
    })

    return NextResponse.json(tarefa)
  } catch (error) {
    console.error("Error updating tarefa:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar tarefa" },
      { status: 500 }
    )
  }
}

// DELETE - Delete task
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await prisma.tarefa.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting tarefa:", error)
    return NextResponse.json(
      { error: "Erro ao eliminar tarefa" },
      { status: 500 }
    )
  }
}
