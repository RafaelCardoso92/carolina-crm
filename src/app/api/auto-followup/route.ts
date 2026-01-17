import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { EstadoPipeline } from "@prisma/client"

// Auto-create tasks when leads sit in a stage too long
export async function POST() {
  try {
    const now = new Date()
    const tasksCreated: any[] = []

    // Define stage timeouts (days before creating a follow-up task)
    const stageTimeouts: Record<EstadoPipeline, number> = {
      NOVO: 2,           // 2 days without action
      CONTACTADO: 5,     // 5 days without follow-up
      REUNIAO: 3,        // 3 days after meeting without update
      PROPOSTA: 7,       // 7 days without response
      NEGOCIACAO: 5,     // 5 days in negotiation
      GANHO: 999,        // Won - no follow-up needed
      PERDIDO: 999       // Lost - no follow-up needed
    }

    const activeStates: EstadoPipeline[] = ["NOVO", "CONTACTADO", "REUNIAO", "PROPOSTA", "NEGOCIACAO"]

    // Get prospects that need follow-up
    const prospects = await prisma.prospecto.findMany({
      where: {
        ativo: true,
        estado: { in: activeStates }
      },
      include: {
        tarefas: {
          where: {
            estado: { in: ["PENDENTE", "EM_PROGRESSO"] }
          }
        }
      }
    })

    for (const prospect of prospects) {
      const timeout = stageTimeouts[prospect.estado]
      const lastActivity = prospect.dataUltimoContacto || prospect.createdAt
      const daysSinceActivity = Math.floor(
        (now.getTime() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24)
      )

      // Skip if within timeout period
      if (daysSinceActivity < timeout) continue

      // Skip if already has a pending follow-up task
      const hasFollowUpTask = prospect.tarefas.some(t =>
        t.titulo.toLowerCase().includes("follow") ||
        t.titulo.toLowerCase().includes("contactar") ||
        t.titulo.toLowerCase().includes("acompanhar")
      )
      if (hasFollowUpTask) continue

      // Create follow-up task
      const taskTitle = getFollowUpTaskTitle(prospect.estado, daysSinceActivity)
      const task = await prisma.tarefa.create({
        data: {
          titulo: taskTitle,
          descricao: `Auto-criada: ${prospect.nomeEmpresa} esta no estado "${prospect.estado}" ha ${daysSinceActivity} dias sem actualizacao.`,
          tipo: "Telefonema",
          prioridade: daysSinceActivity > timeout * 2 ? "ALTA" : "MEDIA",
          dataVencimento: new Date(now.getTime() + 24 * 60 * 60 * 1000), // Tomorrow
          prospectoId: prospect.id
        }
      })

      tasksCreated.push({
        taskId: task.id,
        prospectId: prospect.id,
        prospectName: prospect.nomeEmpresa,
        reason: `${daysSinceActivity} dias em "${prospect.estado}"`
      })
    }

    // Also check for clients that haven't been contacted
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const staleClients = await prisma.cliente.findMany({
      where: {
        ativo: true,
        OR: [
          { ultimoContacto: { lt: thirtyDaysAgo } },
          { ultimoContacto: null }
        ]
      },
      include: {
        tarefas: {
          where: {
            estado: { in: ["PENDENTE", "EM_PROGRESSO"] }
          }
        },
        segmento: true
      }
    })

    for (const cliente of staleClients) {
      // Skip if already has a pending task
      const hasPendingTask = cliente.tarefas.length > 0
      if (hasPendingTask) continue

      // Priority based on segment
      let prioridade: "BAIXA" | "MEDIA" | "ALTA" = "MEDIA"
      if (cliente.segmento?.segmento === "A") prioridade = "ALTA"
      else if (cliente.segmento?.segmento === "C") prioridade = "BAIXA"

      const diasSemContacto = cliente.ultimoContacto
        ? Math.floor((now.getTime() - new Date(cliente.ultimoContacto).getTime()) / (1000 * 60 * 60 * 24))
        : null

      const task = await prisma.tarefa.create({
        data: {
          titulo: `Contactar ${cliente.nome}`,
          descricao: diasSemContacto
            ? `Auto-criada: Cliente sem contacto ha ${diasSemContacto} dias.`
            : `Auto-criada: Cliente nunca foi contactado.`,
          tipo: "Telefonema",
          prioridade,
          dataVencimento: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days
          clienteId: cliente.id
        }
      })

      tasksCreated.push({
        taskId: task.id,
        clientId: cliente.id,
        clientName: cliente.nome,
        reason: diasSemContacto ? `${diasSemContacto} dias sem contacto` : "Nunca contactado"
      })
    }

    return NextResponse.json({
      success: true,
      tasksCreated: tasksCreated.length,
      tasks: tasksCreated
    })
  } catch (error) {
    console.error("Error in auto follow-up:", error)
    return NextResponse.json({ error: "Erro ao criar follow-ups automaticos" }, { status: 500 })
  }
}

function getFollowUpTaskTitle(estado: EstadoPipeline, dias: number): string {
  switch (estado) {
    case "NOVO":
      return "Fazer primeiro contacto"
    case "CONTACTADO":
      return "Agendar reuniao/demonstracao"
    case "REUNIAO":
      return "Enviar proposta pos-reuniao"
    case "PROPOSTA":
      return `Follow-up proposta (${dias} dias)`
    case "NEGOCIACAO":
      return "Fechar negociacao"
    default:
      return "Fazer follow-up"
  }
}

// GET endpoint to check what tasks would be created (preview)
export async function GET() {
  try {
    const now = new Date()
    const preview: any[] = []

    const stageTimeouts: Record<EstadoPipeline, number> = {
      NOVO: 2,
      CONTACTADO: 5,
      REUNIAO: 3,
      PROPOSTA: 7,
      NEGOCIACAO: 5,
      GANHO: 999,
      PERDIDO: 999
    }

    const activeStates: EstadoPipeline[] = ["NOVO", "CONTACTADO", "REUNIAO", "PROPOSTA", "NEGOCIACAO"]

    const prospects = await prisma.prospecto.findMany({
      where: {
        ativo: true,
        estado: { in: activeStates }
      },
      include: {
        tarefas: {
          where: {
            estado: { in: ["PENDENTE", "EM_PROGRESSO"] }
          }
        }
      }
    })

    for (const prospect of prospects) {
      const timeout = stageTimeouts[prospect.estado]
      const lastActivity = prospect.dataUltimoContacto || prospect.createdAt
      const daysSinceActivity = Math.floor(
        (now.getTime() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24)
      )

      if (daysSinceActivity < timeout) continue

      const hasFollowUpTask = prospect.tarefas.some(t =>
        t.titulo.toLowerCase().includes("follow") ||
        t.titulo.toLowerCase().includes("contactar") ||
        t.titulo.toLowerCase().includes("acompanhar")
      )

      preview.push({
        tipo: "prospecto",
        id: prospect.id,
        nome: prospect.nomeEmpresa,
        estado: prospect.estado,
        diasSemActividade: daysSinceActivity,
        temTarefaPendente: hasFollowUpTask,
        seriaCriada: !hasFollowUpTask
      })
    }

    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const staleClients = await prisma.cliente.findMany({
      where: {
        ativo: true,
        OR: [
          { ultimoContacto: { lt: thirtyDaysAgo } },
          { ultimoContacto: null }
        ]
      },
      include: {
        tarefas: {
          where: {
            estado: { in: ["PENDENTE", "EM_PROGRESSO"] }
          }
        }
      }
    })

    for (const cliente of staleClients) {
      const diasSemContacto = cliente.ultimoContacto
        ? Math.floor((now.getTime() - new Date(cliente.ultimoContacto).getTime()) / (1000 * 60 * 60 * 24))
        : null

      preview.push({
        tipo: "cliente",
        id: cliente.id,
        nome: cliente.nome,
        diasSemContacto,
        temTarefaPendente: cliente.tarefas.length > 0,
        seriaCriada: cliente.tarefas.length === 0
      })
    }

    return NextResponse.json({
      total: preview.length,
      seriaoCriadas: preview.filter(p => p.seriaCriada).length,
      items: preview
    })
  } catch (error) {
    console.error("Error in auto follow-up preview:", error)
    return NextResponse.json({ error: "Erro ao prever follow-ups" }, { status: 500 })
  }
}
