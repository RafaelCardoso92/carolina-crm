import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Generate notifications for overdue payments, tasks, and stale leads
export async function POST() {
  try {
    const now = new Date()
    const notifications: any[] = []

    // 1. Check for overdue payments
    const overduePayments = await prisma.parcela.findMany({
      where: {
        pago: false,
        dataVencimento: { lt: now }
      },
      include: {
        cobranca: {
          include: { cliente: true }
        }
      },
      take: 50
    })

    for (const parcela of overduePayments) {
      // Check if notification already exists for this parcela today
      const existing = await prisma.notificacao.findFirst({
        where: {
          parcelaId: parcela.id,
          tipo: "PAGAMENTO_ATRASADO",
          createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) }
        }
      })

      if (!existing) {
        notifications.push({
          tipo: "PAGAMENTO_ATRASADO",
          titulo: "Pagamento em Atraso",
          mensagem: `${parcela.cobranca.cliente.nome} - Parcela ${parcela.numero} de ${Number(parcela.valor).toFixed(2)}€ vencida em ${new Date(parcela.dataVencimento).toLocaleDateString("pt-PT")}`,
          clienteId: parcela.cobranca.clienteId,
          parcelaId: parcela.id
        })
      }
    }

    // 2. Check for tasks due today
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)

    const tasksDueToday = await prisma.tarefa.findMany({
      where: {
        estado: { in: ["PENDENTE", "EM_PROGRESSO"] },
        dataVencimento: {
          gte: todayStart,
          lt: todayEnd
        }
      },
      include: {
        cliente: true,
        prospecto: true
      }
    })

    for (const tarefa of tasksDueToday) {
      const existing = await prisma.notificacao.findFirst({
        where: {
          tarefaId: tarefa.id,
          tipo: "TAREFA_HOJE",
          createdAt: { gte: todayStart }
        }
      })

      if (!existing) {
        notifications.push({
          tipo: "TAREFA_HOJE",
          titulo: "Tarefa para Hoje",
          mensagem: `${tarefa.titulo}${tarefa.cliente ? ` - ${tarefa.cliente.nome}` : ""}${tarefa.prospecto ? ` - ${tarefa.prospecto.nomeEmpresa}` : ""}`,
          tarefaId: tarefa.id,
          clienteId: tarefa.clienteId,
          prospectoId: tarefa.prospectoId
        })
      }
    }

    // 3. Check for overdue tasks
    const overdueTasks = await prisma.tarefa.findMany({
      where: {
        estado: { in: ["PENDENTE", "EM_PROGRESSO"] },
        dataVencimento: { lt: todayStart }
      },
      include: {
        cliente: true,
        prospecto: true
      },
      take: 20
    })

    for (const tarefa of overdueTasks) {
      const existing = await prisma.notificacao.findFirst({
        where: {
          tarefaId: tarefa.id,
          tipo: "TAREFA_VENCIDA",
          createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) }
        }
      })

      if (!existing) {
        notifications.push({
          tipo: "TAREFA_VENCIDA",
          titulo: "Tarefa Atrasada",
          mensagem: `${tarefa.titulo} - Vencida em ${new Date(tarefa.dataVencimento!).toLocaleDateString("pt-PT")}`,
          tarefaId: tarefa.id,
          clienteId: tarefa.clienteId,
          prospectoId: tarefa.prospectoId
        })
      }
    }

    // 4. Check for stale leads (no action in 7+ days)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const staleLeads = await prisma.prospecto.findMany({
      where: {
        ativo: true,
        estado: { notIn: ["GANHO", "PERDIDO"] },
        OR: [
          { dataUltimoContacto: { lt: sevenDaysAgo } },
          { dataUltimoContacto: null }
        ]
      },
      take: 20
    })

    for (const lead of staleLeads) {
      const existing = await prisma.notificacao.findFirst({
        where: {
          prospectoId: lead.id,
          tipo: "LEAD_PARADO",
          createdAt: { gte: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) }
        }
      })

      if (!existing) {
        const diasParado = lead.dataUltimoContacto
          ? Math.floor((now.getTime() - new Date(lead.dataUltimoContacto).getTime()) / (1000 * 60 * 60 * 24))
          : null
        notifications.push({
          tipo: "LEAD_PARADO",
          titulo: "Lead Parado",
          mensagem: `${lead.nomeEmpresa} - ${diasParado ? `${diasParado} dias sem contacto` : "Nunca contactado"}`,
          prospectoId: lead.id
        })
      }
    }

    // 5. Check for clients without contact in 30+ days
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const staleClients = await prisma.cliente.findMany({
      where: {
        ativo: true,
        OR: [
          { ultimoContacto: { lt: thirtyDaysAgo } },
          { ultimoContacto: null }
        ]
      },
      take: 20
    })

    for (const cliente of staleClients) {
      const existing = await prisma.notificacao.findFirst({
        where: {
          clienteId: cliente.id,
          tipo: "CLIENTE_SEM_CONTACTO",
          createdAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) }
        }
      })

      if (!existing) {
        const diasSemContacto = cliente.ultimoContacto
          ? Math.floor((now.getTime() - new Date(cliente.ultimoContacto).getTime()) / (1000 * 60 * 60 * 24))
          : null
        notifications.push({
          tipo: "CLIENTE_SEM_CONTACTO",
          titulo: "Cliente sem Contacto",
          mensagem: `${cliente.nome} - ${diasSemContacto ? `${diasSemContacto} dias sem contacto` : "Nunca contactado"}`,
          clienteId: cliente.id
        })
      }
    }

    // Create all notifications
    if (notifications.length > 0) {
      await prisma.notificacao.createMany({
        data: notifications
      })
    }

    return NextResponse.json({
      success: true,
      created: notifications.length,
      breakdown: {
        overduePayments: overduePayments.length,
        tasksDueToday: tasksDueToday.length,
        overdueTasks: overdueTasks.length,
        staleLeads: staleLeads.length,
        staleClients: staleClients.length
      }
    })
  } catch (error) {
    console.error("Error generating notifications:", error)
    return NextResponse.json({ error: "Erro ao gerar notificacoes" }, { status: 500 })
  }
}
