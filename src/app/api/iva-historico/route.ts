import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET: List all IVA rate history
export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const historico = await prisma.historicoIVA.findMany({
      orderBy: { dataInicio: "desc" }
    })

    // Get the current active rate (dataFim is null)
    const taxaAtual = historico.find(h => h.dataFim === null)

    return NextResponse.json({
      success: true,
      historico: historico.map(h => ({
        ...h,
        percentagem: Number(h.percentagem)
      })),
      taxaAtual: taxaAtual ? Number(taxaAtual.percentagem) : 23
    })
  } catch (error) {
    console.error("Error fetching IVA history:", error)
    return NextResponse.json(
      { success: false, error: "Erro ao carregar histórico de IVA" },
      { status: 500 }
    )
  }
}

// POST: Add a new IVA rate (effective from a specific date)
export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { percentagem, dataInicio, notas } = body

    if (percentagem === undefined || !dataInicio) {
      return NextResponse.json(
        { success: false, error: "Percentagem e data de início são obrigatórios" },
        { status: 400 }
      )
    }

    const newDataInicio = new Date(dataInicio)
    newDataInicio.setHours(0, 0, 0, 0)

    // Check if there's already a rate starting on the same date
    const existingSameDate = await prisma.historicoIVA.findFirst({
      where: {
        dataInicio: newDataInicio
      }
    })

    if (existingSameDate) {
      return NextResponse.json(
        { success: false, error: "Já existe uma taxa com esta data de início. Apague a existente primeiro." },
        { status: 400 }
      )
    }

    // Close any existing open rate (set its dataFim to one day before the new rate starts)
    const currentOpenRate = await prisma.historicoIVA.findFirst({
      where: { dataFim: null }
    })

    if (currentOpenRate) {
      const dayBefore = new Date(newDataInicio)
      dayBefore.setDate(dayBefore.getDate() - 1)
      dayBefore.setHours(23, 59, 59, 999)

      // Only close if the new rate starts after the current one
      if (newDataInicio > currentOpenRate.dataInicio) {
        await prisma.historicoIVA.update({
          where: { id: currentOpenRate.id },
          data: { dataFim: dayBefore }
        })
      }
    }

    // Create the new rate
    const novoIVA = await prisma.historicoIVA.create({
      data: {
        percentagem,
        dataInicio: newDataInicio,
        dataFim: null, // This is now the active rate
        notas
      }
    })

    return NextResponse.json({
      success: true,
      iva: {
        ...novoIVA,
        percentagem: Number(novoIVA.percentagem)
      }
    })
  } catch (error) {
    console.error("Error creating IVA rate:", error)
    return NextResponse.json(
      { success: false, error: "Erro ao criar nova taxa de IVA" },
      { status: 500 }
    )
  }
}

// DELETE: Remove an IVA rate
export async function DELETE(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID do IVA é obrigatório" },
        { status: 400 }
      )
    }

    // Get the rate to delete
    const toDelete = await prisma.historicoIVA.findUnique({
      where: { id }
    })

    if (!toDelete) {
      return NextResponse.json(
        { success: false, error: "Taxa de IVA não encontrada" },
        { status: 404 }
      )
    }

    // If this was the active rate (dataFim = null), reopen the previous one
    if (toDelete.dataFim === null) {
      const previousRate = await prisma.historicoIVA.findFirst({
        where: {
          dataInicio: { lt: toDelete.dataInicio }
        },
        orderBy: { dataInicio: "desc" }
      })

      if (previousRate) {
        await prisma.historicoIVA.update({
          where: { id: previousRate.id },
          data: { dataFim: null }
        })
      }
    }

    await prisma.historicoIVA.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting IVA rate:", error)
    return NextResponse.json(
      { success: false, error: "Erro ao apagar taxa de IVA" },
      { status: 500 }
    )
  }
}
