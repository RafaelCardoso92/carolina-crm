import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET - List incidencias for a venda
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const vendaId = searchParams.get("vendaId")

    if (!vendaId) {
      return NextResponse.json({ error: "vendaId is required" }, { status: 400 })
    }

    const incidencias = await prisma.incidencia.findMany({
      where: { vendaId },
      orderBy: { dataRegisto: "desc" }
    })

    return NextResponse.json(incidencias)
  } catch (error) {
    console.error("Error fetching incidencias:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Create new incidencia
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { vendaId, valor, motivo, notas } = body

    if (!vendaId || valor === undefined || !motivo) {
      return NextResponse.json({ error: "vendaId, valor, and motivo are required" }, { status: 400 })
    }

    // Verify venda exists
    const venda = await prisma.venda.findUnique({ where: { id: vendaId } })
    if (!venda) {
      return NextResponse.json({ error: "Venda not found" }, { status: 404 })
    }

    const incidencia = await prisma.incidencia.create({
      data: {
        vendaId,
        valor,
        motivo,
        notas: notas || null
      }
    })

    return NextResponse.json(incidencia)
  } catch (error) {
    console.error("Error creating incidencia:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
