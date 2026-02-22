import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { canViewAllData } from "@/lib/permissions"
import { UserRole } from "@prisma/client"

// GET - Get visit statistics
export async function GET(request: NextRequest) {
  try {
    process.stdout.write("[stats] Starting request...\n")
    const session = await auth()
    process.stdout.write(`[stats] Session: ${session?.user?.id ? "authenticated" : "not authenticated"}\n`)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const mes = searchParams.get("mes")
    const ano = searchParams.get("ano") || new Date().getFullYear().toString()
    const seller = searchParams.get("seller")
    process.stdout.write(`[stats] Params - ano: ${ano}, mes: ${mes}, seller: ${seller}\n`)

    const userRole = session.user.role as UserRole | undefined
    const isAdmin = userRole ? canViewAllData(userRole) : false
    process.stdout.write(`[stats] Role: ${userRole}, isAdmin: ${isAdmin}\n`)

    // Build user filter
    let userFilter: Record<string, unknown> = {}
    if (!isAdmin) {
      userFilter = { userId: session.user.id }
    } else if (seller) {
      userFilter = { userId: seller }
    }

    // Date filter for the requested month/year
    let dateFilter: Record<string, unknown> = {}
    if (mes && ano) {
      const startOfMonth = new Date(parseInt(ano), parseInt(mes) - 1, 1)
      const endOfMonth = new Date(parseInt(ano), parseInt(mes), 0, 23, 59, 59)
      dateFilter = {
        dataAgendada: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      }
    } else if (ano) {
      const startOfYear = new Date(parseInt(ano), 0, 1)
      const endOfYear = new Date(parseInt(ano), 11, 31, 23, 59, 59)
      dateFilter = {
        dataAgendada: {
          gte: startOfYear,
          lte: endOfYear
        }
      }
    }

    const where = { ...userFilter, ...dateFilter }
    process.stdout.write(`[stats] Where clause: ${JSON.stringify(where)}\n`)

    // Get counts by status
    process.stdout.write("[stats] Querying database...\n")
    const [total, agendadas, realizadas, canceladas, reagendadas] = await Promise.all([
      prisma.visita.count({ where }),
      prisma.visita.count({ where: { ...where, estado: "AGENDADA" } }),
      prisma.visita.count({ where: { ...where, estado: "REALIZADA" } }),
      prisma.visita.count({ where: { ...where, estado: "CANCELADA" } }),
      prisma.visita.count({ where: { ...where, estado: "REAGENDADA" } })
    ])

    // Get monthly breakdown for the year
    const monthlyStats = []
    const targetYear = parseInt(ano)

    for (let month = 1; month <= 12; month++) {
      const startOfMonth = new Date(targetYear, month - 1, 1)
      const endOfMonth = new Date(targetYear, month, 0, 23, 59, 59)

      const monthWhere = {
        ...userFilter,
        dataAgendada: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      }

      const [monthTotal, monthRealizadas] = await Promise.all([
        prisma.visita.count({ where: monthWhere }),
        prisma.visita.count({ where: { ...monthWhere, estado: "REALIZADA" } })
      ])

      monthlyStats.push({
        mes: month,
        ano: targetYear,
        total: monthTotal,
        realizadas: monthRealizadas,
        taxaRealizacao: monthTotal > 0 ? Math.round((monthRealizadas / monthTotal) * 100) : 0
      })
    }

    // If admin, get stats by seller
    let sellerStats: Array<{
      id: string
      name: string | null
      email: string
      total: number
      realizadas: number
      taxaRealizacao: number
    }> = []
    if (isAdmin && !seller) {
      const sellers = await prisma.user.findMany({
        where: { role: "SELLER", status: "ACTIVE" },
        select: { id: true, name: true, email: true }
      })

      sellerStats = await Promise.all(
        sellers.map(async (s) => {
          const sellerWhere = { ...dateFilter, userId: s.id }
          const [sellerTotal, sellerRealizadas] = await Promise.all([
            prisma.visita.count({ where: sellerWhere }),
            prisma.visita.count({ where: { ...sellerWhere, estado: "REALIZADA" } })
          ])
          return {
            id: s.id,
            name: s.name,
            email: s.email,
            total: sellerTotal,
            realizadas: sellerRealizadas,
            taxaRealizacao: sellerTotal > 0 ? Math.round((sellerRealizadas / sellerTotal) * 100) : 0
          }
        })
      )
    }

    // Today's visits
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)

    const hoje = await prisma.visita.count({
      where: {
        ...userFilter,
        dataAgendada: {
          gte: startOfDay,
          lt: endOfDay
        }
      }
    })

    // This week's visits
    const dayOfWeek = now.getDay()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - dayOfWeek)
    startOfWeek.setHours(0, 0, 0, 0)
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 7)

    const semana = await prisma.visita.count({
      where: {
        ...userFilter,
        dataAgendada: {
          gte: startOfWeek,
          lt: endOfWeek
        }
      }
    })

    return NextResponse.json({
      resumo: {
        total,
        agendadas,
        realizadas,
        canceladas,
        reagendadas,
        hoje,
        semana,
        taxaRealizacao: total > 0 ? Math.round((realizadas / total) * 100) : 0
      },
      mensal: monthlyStats,
      vendedores: sellerStats
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : "No stack"
    process.stdout.write(`[stats] ERROR: ${errorMessage}\n`)
    process.stdout.write(`[stats] Stack: ${errorStack}\n`)
    return NextResponse.json(
      { error: "Erro ao carregar estatisticas", details: errorMessage },
      { status: 500 }
    )
  }
}
