import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

function getCurrentQuarter(): number {
  const month = new Date().getMonth() + 1
  return Math.ceil(month / 3)
}

// GET - List all agreements with progress
export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const clienteId = searchParams.get("clienteId")
    const apenasAtivos = searchParams.get("ativos") !== "false"

    const where: any = {}
    if (clienteId) where.clienteId = clienteId
    if (apenasAtivos) where.ativo = true

    const acordos = await prisma.acordoParceria.findMany({
      where,
      include: {
        cliente: {
          select: { id: true, nome: true, codigo: true }
        }
      }
    })

    // Calculate progress for each agreement
    const currentYear = new Date().getFullYear()
    const currentMonth = new Date().getMonth() + 1
    const currentQuarter = getCurrentQuarter()

    const acordosComProgresso = await Promise.all(
      acordos.map(async (acordo) => {
        // Get all vendas for this client this year
        const vendas = await prisma.venda.findMany({
          where: {
            clienteId: acordo.clienteId,
            ano: acordo.ano
          },
          select: { mes: true, total: true }
        })

        // Calculate quarterly totals
        const quarterlyTotals: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 }
        vendas.forEach(v => {
          const q = Math.ceil(v.mes / 3)
          quarterlyTotals[q] += Number(v.total)
        })

        const quarterlyTarget = Number(acordo.valorAnual) / 4

        // Only count completed quarters + progress through current quarter
        const completedQuarters = currentQuarter - 1
        const currentQuarterMonths = [1, 2, 3].map(m => (currentQuarter - 1) * 3 + m)
        const monthsPassedInQuarter = currentMonth - currentQuarterMonths[0] + 1
        const quarterProgress = monthsPassedInQuarter / 3

        const yearToDateTarget = (quarterlyTarget * completedQuarters) + (quarterlyTarget * quarterProgress)

        const yearToDateActual = Object.entries(quarterlyTotals)
          .filter(([q]) => parseInt(q) <= currentQuarter)
          .reduce((sum, [, val]) => sum + val, 0)

        const progressPercent = yearToDateTarget > 0
          ? (yearToDateActual / yearToDateTarget) * 100
          : 0

        let estado: "NO_CAMINHO" | "ATRAS" | "ADIANTADO" = "NO_CAMINHO"
        if (progressPercent < 90) estado = "ATRAS"
        else if (progressPercent > 110) estado = "ADIANTADO"

        return {
          ...acordo,
          valorAnual: Number(acordo.valorAnual),
          quarterlyTarget,
          quarterlyTotals,
          currentQuarter,
          yearToDateTarget,
          yearToDateActual,
          progressPercent,
          estado
        }
      })
    )

    return NextResponse.json(acordosComProgresso)
  } catch (error) {
    console.error("Error fetching acordos:", error)
    return NextResponse.json({ error: "Erro ao carregar acordos" }, { status: 500 })
  }
}

// POST - Create new agreement
export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { clienteId, valorAnual, ano, notas } = body

    if (!clienteId || !valorAnual || !ano) {
      return NextResponse.json(
        { error: "Cliente, valor anual e ano sao obrigatorios" },
        { status: 400 }
      )
    }

    // Check for existing active agreement
    const existing = await prisma.acordoParceria.findFirst({
      where: { clienteId, ativo: true }
    })

    if (existing) {
      // Deactivate old agreement
      await prisma.acordoParceria.update({
        where: { id: existing.id },
        data: { ativo: false, dataFim: new Date() }
      })
    }

    const acordo = await prisma.acordoParceria.create({
      data: {
        clienteId,
        valorAnual,
        ano,
        notas
      },
      include: {
        cliente: { select: { id: true, nome: true, codigo: true } }
      }
    })

    return NextResponse.json(acordo, { status: 201 })
  } catch (error) {
    console.error("Error creating acordo:", error)
    return NextResponse.json({ error: "Erro ao criar acordo" }, { status: 500 })
  }
}
