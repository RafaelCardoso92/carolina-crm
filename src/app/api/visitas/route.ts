import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { userScopedWhere, getEffectiveUserId } from "@/lib/permissions"

// GET - List visits with optional filters
export async function GET(request: NextRequest) {
  try {
    process.stdout.write("[visitas] Starting request...\n")
    const session = await auth()
    process.stdout.write(`[visitas] Session: ${session?.user?.id ? "authenticated" : "not authenticated"}\n`)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    process.stdout.write(`[visitas] User ID: ${session.user.id}, Role: ${session.user.role}\n`)

    const { searchParams } = new URL(request.url)
    const estado = searchParams.get("estado")
    const clienteId = searchParams.get("clienteId")
    const prospectoId = searchParams.get("prospectoId")
    const mes = searchParams.get("mes")
    const ano = searchParams.get("ano")
    const agendadas = searchParams.get("agendadas")
    const realizadas = searchParams.get("realizadas")
    const hoje = searchParams.get("hoje")
    const semana = searchParams.get("semana")
    const limit = parseInt(searchParams.get("limit") || "100")
    const seller = searchParams.get("seller")

    const userFilter = userScopedWhere(session, seller)
    const where: Record<string, unknown> = { ...userFilter }

    if (estado) {
      where.estado = estado
    }

    if (clienteId) {
      where.clienteId = clienteId
    }

    if (prospectoId) {
      where.prospectoId = prospectoId
    }

    // Filter by month/year
    if (mes && ano) {
      const startOfMonth = new Date(parseInt(ano), parseInt(mes) - 1, 1)
      const endOfMonth = new Date(parseInt(ano), parseInt(mes), 0, 23, 59, 59)
      where.dataAgendada = {
        gte: startOfMonth,
        lte: endOfMonth
      }
    } else if (ano) {
      const startOfYear = new Date(parseInt(ano), 0, 1)
      const endOfYear = new Date(parseInt(ano), 11, 31, 23, 59, 59)
      where.dataAgendada = {
        gte: startOfYear,
        lte: endOfYear
      }
    }

    // Quick filters
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)

    if (hoje === "true") {
      where.dataAgendada = {
        gte: startOfDay,
        lt: endOfDay
      }
    }

    if (semana === "true") {
      const dayOfWeek = now.getDay()
      const startOfWeek = new Date(now)
      startOfWeek.setDate(now.getDate() - dayOfWeek)
      startOfWeek.setHours(0, 0, 0, 0)
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 7)
      where.dataAgendada = {
        gte: startOfWeek,
        lt: endOfWeek
      }
    }

    if (agendadas === "true") {
      where.estado = "AGENDADA"
    }

    if (realizadas === "true") {
      where.estado = "REALIZADA"
    }

    const visitas = await prisma.visita.findMany({
      where,
      include: {
        cliente: {
          select: { id: true, nome: true, codigo: true, cidade: true }
        },
        prospecto: {
          select: { id: true, nomeEmpresa: true, estado: true, cidade: true }
        },
        user: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: [
        { dataAgendada: "asc" },
        { createdAt: "desc" }
      ],
      take: limit
    })

    return NextResponse.json(visitas)
  } catch (error) {
    console.error("Error fetching visitas:", error instanceof Error ? error.message : error)
    console.error("Stack:", error instanceof Error ? error.stack : "No stack")
    return NextResponse.json(
      { error: "Erro ao carregar visitas", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

// POST - Create a new visit
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      dataAgendada,
      objetivo,
      notas,
      clienteId,
      prospectoId
    } = body

    if (!dataAgendada) {
      return NextResponse.json(
        { error: "Data agendada e obrigatoria" },
        { status: 400 }
      )
    }

    if (!clienteId && !prospectoId) {
      return NextResponse.json(
        { error: "Cliente ou Prospecto e obrigatorio" },
        { status: 400 }
      )
    }

    const userId = getEffectiveUserId(session)

    const visita = await prisma.visita.create({
      data: {
        userId,
        dataAgendada: new Date(dataAgendada),
        objetivo,
        notas,
        clienteId: clienteId || null,
        prospectoId: prospectoId || null,
        estado: "AGENDADA"
      },
      include: {
        cliente: {
          select: { id: true, nome: true, codigo: true, cidade: true }
        },
        prospecto: {
          select: { id: true, nomeEmpresa: true, estado: true, cidade: true }
        }
      }
    })

    return NextResponse.json(visita, { status: 201 })
  } catch (error) {
    console.error("Error creating visita:", error)
    return NextResponse.json(
      { error: "Erro ao criar visita" },
      { status: 500 }
    )
  }
}
