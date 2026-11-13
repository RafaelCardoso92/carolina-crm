import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { userScopedWhere } from "@/lib/permissions"
import { emAtraso } from "@/lib/cobranca-valores"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const seller = searchParams.get("seller")

    // Apply user scoping
    const userFilter = userScopedWhere(session, seller)

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const [
      cobrancasPorPagar,
      tasksDueToday,
      staleLeads,
      clientsNoContact
    ] = await Promise.all([
      // Overdue = same rule as the dashboard banner and the cobranças page (parcelas + single payments, partial payments net)
      prisma.cobranca.findMany({
        where: { pago: false, cliente: userFilter },
        select: {
          valor: true, pago: true, valorPago: true, dataVencimento: true,
          parcelas: { select: { valor: true, pago: true, valorPago: true, dataVencimento: true } }
        }
      }),
      // Tasks due today - filter by userId
      prisma.tarefa.count({
        where: {
          estado: { in: ["PENDENTE", "EM_PROGRESSO"] },
          dataVencimento: {
            gte: todayStart,
            lt: todayEnd
          },
          ...userFilter
        }
      }),
      // Stale leads (no contact in 7+ days, not closed)
      prisma.prospecto.count({
        where: {
          ativo: true,
          estado: { notIn: ["GANHO", "PERDIDO"] },
          ...userFilter,
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
          ...userFilter,
          OR: [
            { ultimoContacto: { lt: thirtyDaysAgo } },
            { ultimoContacto: null }
          ]
        }
      })
    ])

    const atrasos = cobrancasPorPagar.map(c => emAtraso(c, now))
    return NextResponse.json({
      overduePayments: {
        count: atrasos.reduce((s, a) => s + a.count, 0),
        value: Math.round(atrasos.reduce((s, a) => s + a.valor, 0) * 100) / 100
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
