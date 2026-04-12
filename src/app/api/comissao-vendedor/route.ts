import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getComissaoForDate } from "@/lib/comissao"

// GET: List all sellers with their current commission rates
export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const sellers = await prisma.user.findMany({
      where: { role: "SELLER", status: "ACTIVE" },
      select: {
        id: true,
        name: true,
        email: true,
        historicoComissoes: {
          orderBy: { dataInicio: "desc" }
        }
      },
      orderBy: { name: "asc" }
    })

    const globalRate = await getComissaoForDate(new Date())

    const result = sellers.map(seller => {
      const currentRate = seller.historicoComissoes.find(h => h.dataFim === null)
      return {
        id: seller.id,
        name: seller.name,
        email: seller.email,
        currentRate: currentRate ? Number(currentRate.percentagem) : null,
        historico: seller.historicoComissoes.map(h => ({
          ...h,
          percentagem: Number(h.percentagem)
        }))
      }
    })

    return NextResponse.json({
      success: true,
      sellers: result,
      globalRate
    })
  } catch (error) {
    console.error("Error fetching seller commissions:", error)
    return NextResponse.json(
      { success: false, error: "Erro ao carregar comissões por vendedor" },
      { status: 500 }
    )
  }
}

// POST: Create new rate for a seller
export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { userId, percentagem, dataInicio, notas } = body

    if (!userId || percentagem === undefined || !dataInicio) {
      return NextResponse.json(
        { success: false, error: "Vendedor, percentagem e data de início são obrigatórios" },
        { status: 400 }
      )
    }

    const newDataInicio = new Date(dataInicio)
    newDataInicio.setHours(0, 0, 0, 0)

    // Check if there's already a rate for this seller starting on the same date
    const existingSameDate = await prisma.historicoComissaoVendedor.findFirst({
      where: {
        userId,
        dataInicio: newDataInicio
      }
    })

    if (existingSameDate) {
      return NextResponse.json(
        { success: false, error: "Já existe uma taxa para este vendedor com esta data de início." },
        { status: 400 }
      )
    }

    // Close any existing open rate for this seller
    const currentOpenRate = await prisma.historicoComissaoVendedor.findFirst({
      where: { userId, dataFim: null }
    })

    if (currentOpenRate) {
      const dayBefore = new Date(newDataInicio)
      dayBefore.setDate(dayBefore.getDate() - 1)
      dayBefore.setHours(23, 59, 59, 999)

      if (newDataInicio > currentOpenRate.dataInicio) {
        await prisma.historicoComissaoVendedor.update({
          where: { id: currentOpenRate.id },
          data: { dataFim: dayBefore }
        })
      }
    }

    const novaComissao = await prisma.historicoComissaoVendedor.create({
      data: {
        userId,
        percentagem,
        dataInicio: newDataInicio,
        dataFim: null,
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
    console.error("Error creating seller commission rate:", error)
    return NextResponse.json(
      { success: false, error: "Erro ao criar taxa de comissão do vendedor" },
      { status: 500 }
    )
  }
}

// DELETE: Remove a seller commission rate
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

    const toDelete = await prisma.historicoComissaoVendedor.findUnique({
      where: { id }
    })

    if (!toDelete) {
      return NextResponse.json(
        { success: false, error: "Taxa de comissão não encontrada" },
        { status: 404 }
      )
    }

    // If this was the active rate, reopen the previous one for this seller
    if (toDelete.dataFim === null) {
      const previousRate = await prisma.historicoComissaoVendedor.findFirst({
        where: {
          userId: toDelete.userId,
          dataInicio: { lt: toDelete.dataInicio }
        },
        orderBy: { dataInicio: "desc" }
      })

      if (previousRate) {
        await prisma.historicoComissaoVendedor.update({
          where: { id: previousRate.id },
          data: { dataFim: null }
        })
      }
    }

    await prisma.historicoComissaoVendedor.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting seller commission rate:", error)
    return NextResponse.json(
      { success: false, error: "Erro ao apagar taxa de comissão do vendedor" },
      { status: 500 }
    )
  }
}
