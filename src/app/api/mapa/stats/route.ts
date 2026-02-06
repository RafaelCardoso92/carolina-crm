import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { userScopedWhere } from "@/lib/permissions"

// Get map statistics: revenue per client, last visit dates, coverage analysis
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userFilter = userScopedWhere(session)

    // Get client revenue (last 12 months)
    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

    const clientRevenue = await prisma.venda.groupBy({
      by: ["clienteId"],
      _sum: { total: true },
      where: {
        cliente: userFilter,
        createdAt: { gte: twelveMonthsAgo },
      },
    })

    // Get last visit/communication for each client and prospect
    const lastClientVisits = await prisma.comunicacao.groupBy({
      by: ["clienteId"],
      _max: { dataContacto: true },
      where: {
        cliente: userFilter,
        clienteId: { not: null },
      },
    })

    const lastProspectVisits = await prisma.comunicacao.groupBy({
      by: ["prospectoId"],
      _max: { dataContacto: true },
      where: {
        prospecto: userFilter,
        prospectoId: { not: null },
      },
    })

    // Get all clients with coordinates for coverage analysis
    const clientsWithCoords = await prisma.cliente.findMany({
      where: {
        ...userFilter,
        ativo: true,
        latitude: { not: null },
        longitude: { not: null },
      },
      select: {
        id: true,
        latitude: true,
        longitude: true,
        cidade: true,
      },
    })

    // Build revenue map
    const revenueMap: Record<string, number> = {}
    const maxRevenue = clientRevenue.reduce((max, cr) => {
      const val = Number(cr._sum.total || 0)
      revenueMap[cr.clienteId] = val
      return Math.max(max, val)
    }, 0)

    // Build last visit map
    const lastVisitMap: Record<string, string> = {}
    lastClientVisits.forEach((lv) => {
      if (lv.clienteId && lv._max.dataContacto) {
        lastVisitMap[`cliente-${lv.clienteId}`] = lv._max.dataContacto.toISOString()
      }
    })
    lastProspectVisits.forEach((lv) => {
      if (lv.prospectoId && lv._max.dataContacto) {
        lastVisitMap[`prospecto-${lv.prospectoId}`] = lv._max.dataContacto.toISOString()
      }
    })

    // Calculate coverage by city
    const coverageByCity: Record<string, number> = {}
    clientsWithCoords.forEach((c) => {
      if (c.cidade) {
        coverageByCity[c.cidade] = (coverageByCity[c.cidade] || 0) + 1
      }
    })

    return NextResponse.json({
      revenue: revenueMap,
      maxRevenue,
      lastVisit: lastVisitMap,
      coverage: coverageByCity,
      totalClients: clientsWithCoords.length,
    })
  } catch (error) {
    console.error("Error fetching map stats:", error)
    return NextResponse.json({ error: "Erro ao buscar estatisticas" }, { status: 500 })
  }
}
