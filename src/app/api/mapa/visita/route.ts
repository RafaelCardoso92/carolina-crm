import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// Log a quick visit from the map
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { clienteId, prospectoId, notas, tipo = "VISITA" } = body

    if (!clienteId && !prospectoId) {
      return NextResponse.json({ error: "Cliente ou prospecto obrigatorio" }, { status: 400 })
    }

    // Create communication record
    const comunicacao = await prisma.comunicacao.create({
      data: {
        userId: session.user.id,
        clienteId: clienteId || null,
        prospectoId: prospectoId || null,
        tipo: tipo,
        assunto: "Visita registada via mapa",
        notas: notas || null,
        dataContacto: new Date(),
      },
    })

    // If it's a prospect, update the last action date
    if (prospectoId) {
      await prisma.prospecto.update({
        where: { id: prospectoId },
        data: {
          dataProximaAccao: null, // Clear next action since we just visited
          updatedAt: new Date(),
        },
      })
    }

    return NextResponse.json({
      success: true,
      comunicacao: {
        id: comunicacao.id,
        dataContacto: comunicacao.dataContacto,
      },
    })
  } catch (error) {
    console.error("Error logging visit:", error)
    return NextResponse.json({ error: "Erro ao registar visita" }, { status: 500 })
  }
}

// Complete a task from the map
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { tarefaId, notas } = body

    if (!tarefaId) {
      return NextResponse.json({ error: "Tarefa obrigatoria" }, { status: 400 })
    }

    // Update task as completed
    const tarefa = await prisma.tarefa.update({
      where: { id: tarefaId },
      data: {
        estado: "CONCLUIDA",
        dataConclusao: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      tarefa: {
        id: tarefa.id,
        estado: tarefa.estado,
      },
    })
  } catch (error) {
    console.error("Error completing task:", error)
    return NextResponse.json({ error: "Erro ao completar tarefa" }, { status: 500 })
  }
}
