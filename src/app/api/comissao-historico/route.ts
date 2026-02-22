import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET: List all commission rate history
export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const historico = await prisma.historicoComissao.findMany({
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
      taxaAtual: taxaAtual ? Number(taxaAtual.percentagem) : 3.5
    })
  } catch (error) {
    console.error("Error fetching commission history:", error)
    return NextResponse.json(
      { success: false, error: "Erro ao carregar histórico de comissões" },
      { status: 500 }
    )
  }
}

// POST: Add a new commission rate (effective from a specific date)
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
    const existingSameDate = await prisma.historicoComissao.findFirst({
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
    const currentOpenRate = await prisma.historicoComissao.findFirst({
      where: { dataFim: null }
    })

    if (currentOpenRate) {
      const dayBefore = new Date(newDataInicio)
      dayBefore.setDate(dayBefore.getDate() - 1)
      dayBefore.setHours(23, 59, 59, 999)

      // Only close if the new rate starts after the current one
      if (newDataInicio > currentOpenRate.dataInicio) {
        await prisma.historicoComissao.update({
          where: { id: currentOpenRate.id },
          data: { dataFim: dayBefore }
        })
      }
    }

    // Create the new rate
    const novaComissao = await prisma.historicoComissao.create({
      data: {
        percentagem,
        dataInicio: newDataInicio,
        dataFim: null, // This is now the active rate
        notas
      }
    })

    return NextResponse.json({
      success: true,
      comissao: {
        ...novaComissao,
        percentagem: Number(novaComissao.percentagem)
      }
    })
  } catch (error) {
    console.error("Error creating commission rate:", error)
    return NextResponse.json(
      { success: false, error: "Erro ao criar nova taxa de comissão" },
      { status: 500 }
    )
  }
}

// DELETE: Remove a commission rate
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
        { success: false, error: "ID da comissão é obrigatório" },
        { status: 400 }
      )
    }

    // Get the rate to delete
    const toDelete = await prisma.historicoComissao.findUnique({
      where: { id }
    })

    if (!toDelete) {
      return NextResponse.json(
        { success: false, error: "Taxa de comissão não encontrada" },
        { status: 404 }
      )
    }

    // If this was the active rate (dataFim = null), reopen the previous one
    if (toDelete.dataFim === null) {
      const previousRate = await prisma.historicoComissao.findFirst({
        where: {
          dataInicio: { lt: toDelete.dataInicio }
        },
        orderBy: { dataInicio: "desc" }
      })

      if (previousRate) {
        await prisma.historicoComissao.update({
          where: { id: previousRate.id },
          data: { dataFim: null }
        })
      }
    }

    await prisma.historicoComissao.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting commission rate:", error)
    return NextResponse.json(
      { success: false, error: "Erro ao apagar taxa de comissão" },
      { status: 500 }
    )
  }
}
