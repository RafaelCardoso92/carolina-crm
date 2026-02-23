import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { userScopedWhere } from "@/lib/permissions"

// GET - Get clients needing follow-up (no contact in X days)
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const dias = parseInt(searchParams.get("dias") || "30")
    const seller = searchParams.get("seller")

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - dias)

    // Apply user scoping
    const userFilter = userScopedWhere(session, seller)

    // Get clients with no contact in X days or never contacted
    const clientesSemContacto = await prisma.cliente.findMany({
      where: {
        ativo: true,
        ...userFilter,
        OR: [
          { ultimoContacto: null },
          { ultimoContacto: { lt: cutoffDate } }
        ]
      },
      select: {
        id: true,
        nome: true,
        codigo: true,
        telefone: true,
        email: true,
        ultimoContacto: true,
        segmento: {
          select: { segmento: true }
        },
        vendas: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { total: true, mes: true, ano: true }
        }
      },
      orderBy: [
        { ultimoContacto: { sort: "asc", nulls: "first" } }
      ],
      take: 20
    })

    // Calculate days since last contact
    const result = clientesSemContacto.map(cliente => {
      const diasSemContacto = cliente.ultimoContacto
        ? Math.floor((Date.now() - new Date(cliente.ultimoContacto).getTime()) / (1000 * 60 * 60 * 24))
        : null
      
      return {
        ...cliente,
        diasSemContacto,
        ultimaVenda: cliente.vendas[0] || null
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error fetching followup:", error)
    return NextResponse.json({ error: "Erro ao carregar follow-up" }, { status: 500 })
  }
}
