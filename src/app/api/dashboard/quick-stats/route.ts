import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const [
      overduePaymentsCount,
      overduePaymentsValue,
      tasksDueToday,
      staleLeads,
      clientsNoContact
    ] = await Promise.all([
      // Overdue payments count
      prisma.parcela.count({
        where: {
          pago: false,
          dataVencimento: { lt: now }
        }
      }),
      // Overdue payments value
      prisma.parcela.aggregate({
        where: {
          pago: false,
          dataVencimento: { lt: now }
        },
        _sum: { valor: true }
      }),
      // Tasks due today
      prisma.tarefa.count({
        where: {
          estado: { in: ["PENDENTE", "EM_PROGRESSO"] },
          dataVencimento: {
            gte: todayStart,
            lt: todayEnd
          }
        }
      }),
      // Stale leads (no contact in 7+ days, not closed)
      prisma.prospecto.count({
        where: {
          ativo: true,
          estado: { notIn: ["GANHO", "PERDIDO"] },
          OR: [
            { dataUltimoContacto: { lt: sevenDaysAgo } },
            { dataUltimoContacto: null }
          ]
        }
      }),
      // Clients without contact in 30+ days
      prisma.cliente.count({
        where: {
          ativo: true,
          OR: [
            { ultimoContacto: { lt: thirtyDaysAgo } },
            { ultimoContacto: null }
          ]
        }
      })
    ])

    return NextResponse.json({
      overduePayments: {
        count: overduePaymentsCount,
        value: Number(overduePaymentsValue._sum.valor) || 0
      },
      tasksDueToday,
      staleLeads,
      clientsNoContact
    })
  } catch (error) {
    console.error("Error fetching quick stats:", error)
    return NextResponse.json({ error: "Erro ao carregar estatisticas" }, { status: 500 })
  }
}
