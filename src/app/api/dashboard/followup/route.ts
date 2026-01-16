import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET - Get clients needing follow-up (no contact in X days)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dias = parseInt(searchParams.get("dias") || "30")

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - dias)

    // Get clients with no contact in X days or never contacted
    const clientesSemContacto = await prisma.cliente.findMany({
      where: {
        ativo: true,
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
