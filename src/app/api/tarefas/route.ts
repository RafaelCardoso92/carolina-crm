import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET - List tasks with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const estado = searchParams.get("estado")
    const prioridade = searchParams.get("prioridade")
    const clienteId = searchParams.get("clienteId")
    const prospectoId = searchParams.get("prospectoId")
    const pendentes = searchParams.get("pendentes") // Get only pending tasks
    const hoje = searchParams.get("hoje") // Get tasks due today
    const atrasadas = searchParams.get("atrasadas") // Get overdue tasks
    const limit = parseInt(searchParams.get("limit") || "50")

    const where: Record<string, unknown> = {}

    if (estado) {
      where.estado = estado
    }
    
    if (prioridade) {
      where.prioridade = prioridade
    }

    if (clienteId) {
      where.clienteId = clienteId
    }

    if (prospectoId) {
      where.prospectoId = prospectoId
    }

    if (pendentes === "true") {
      where.estado = { in: ["PENDENTE", "EM_PROGRESSO"] }
    }

    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)

    if (hoje === "true") {
      where.dataVencimento = {
        gte: startOfDay,
        lt: endOfDay
      }
    }

    if (atrasadas === "true") {
      where.dataVencimento = { lt: startOfDay }
      where.estado = { in: ["PENDENTE", "EM_PROGRESSO"] }
    }

    const tarefas = await prisma.tarefa.findMany({
      where,
      include: {
        cliente: {
          select: { id: true, nome: true, codigo: true }
        },
        prospecto: {
          select: { id: true, nomeEmpresa: true, estado: true }
        }
      },
      orderBy: [
        { prioridade: "desc" },
        { dataVencimento: "asc" },
        { createdAt: "desc" }
      ],
      take: limit
    })

    return NextResponse.json(tarefas)
  } catch (error) {
    console.error("Error fetching tarefas:", error)
    return NextResponse.json(
      { error: "Erro ao carregar tarefas" },
      { status: 500 }
    )
  }
}

// POST - Create a new task
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      titulo,
      descricao,
      tipo,
      prioridade,
      dataVencimento,
      dataLembrete,
      clienteId,
      prospectoId
    } = body

    if (!titulo) {
      return NextResponse.json(
        { error: "Titulo e obrigatorio" },
        { status: 400 }
      )
    }

    const tarefa = await prisma.tarefa.create({
      data: {
        titulo,
        descricao,
        tipo,
        prioridade: prioridade || "MEDIA",
        dataVencimento: dataVencimento ? new Date(dataVencimento) : null,
        dataLembrete: dataLembrete ? new Date(dataLembrete) : null,
        clienteId: clienteId || null,
        prospectoId: prospectoId || null
      },
      include: {
        cliente: {
          select: { id: true, nome: true, codigo: true }
        },
        prospecto: {
          select: { id: true, nomeEmpresa: true, estado: true }
        }
      }
    })

    return NextResponse.json(tarefa, { status: 201 })
  } catch (error) {
    console.error("Error creating tarefa:", error)
    return NextResponse.json(
      { error: "Erro ao criar tarefa" },
      { status: 500 }
    )
  }
}
