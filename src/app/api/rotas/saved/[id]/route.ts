import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET - Get a specific saved route
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const rota = await prisma.rotaSalva.findUnique({
      where: { id }
    })

    if (!rota) {
      return NextResponse.json(
        { error: "Rota não encontrada" },
        { status: 404 }
      )
    }

    return NextResponse.json(rota)
  } catch (error) {
    console.error("Error fetching route:", error)
    return NextResponse.json(
      { error: "Erro ao carregar rota" },
      { status: 500 }
    )
  }
}

// PUT - Update a saved route (full update)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()

    // Calculate fuel cost if needed
    let custoCombuistivel = data.custoCombuistivel
    if (data.distanciaTotal && data.consumoMedio && data.precoLitro && !custoCombuistivel) {
      const distanceKm = parseFloat(String(data.distanciaTotal).replace(/[^\d.]/g, ""))
      if (!isNaN(distanceKm)) {
        custoCombuistivel = (distanceKm / 100) * data.consumoMedio * data.precoLitro
      }
    }

    // Calculate total cost
    const custoTotal = (
      (parseFloat(data.custoPortagens) || 0) +
      (parseFloat(custoCombuistivel) || 0) +
      (parseFloat(data.custoEstacionamento) || 0)
    ) || null

    const rota = await prisma.rotaSalva.update({
      where: { id },
      data: {
        nome: data.nome,
        data: data.data ? new Date(data.data) : undefined,
        origemLatitude: data.origemLatitude,
        origemLongitude: data.origemLongitude,
        origemEndereco: data.origemEndereco,
        locais: data.locais,
        paragens: data.paragens,
        distanciaTotal: data.distanciaTotal,
        duracaoTotal: data.duracaoTotal,
        // Cost fields
        custoPortagens: data.custoPortagens,
        numPortagens: data.numPortagens,
        custoCombuistivel: custoCombuistivel,
        consumoMedio: data.consumoMedio,
        precoLitro: data.precoLitro,
        custoEstacionamento: data.custoEstacionamento,
        custoTotal: custoTotal,
        custoReal: data.custoReal,
        notasCustos: data.notasCustos,
        concluida: data.concluida
      }
    })

    return NextResponse.json(rota)
  } catch (error) {
    console.error("Error updating route:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar rota" },
      { status: 500 }
    )
  }
}

// PATCH - Partial update (mark complete, update costs, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()

    // If updating cost fields, recalculate total
    if (data.custoPortagens !== undefined || data.custoCombuistivel !== undefined || data.custoEstacionamento !== undefined) {
      const existing = await prisma.rotaSalva.findUnique({ where: { id } })
      if (existing) {
        const custoPortagens = data.custoPortagens ?? existing.custoPortagens ?? 0
        const custoCombuistivel = data.custoCombuistivel ?? existing.custoCombuistivel ?? 0
        const custoEstacionamento = data.custoEstacionamento ?? existing.custoEstacionamento ?? 0

        data.custoTotal = (
          parseFloat(String(custoPortagens)) +
          parseFloat(String(custoCombuistivel)) +
          parseFloat(String(custoEstacionamento))
        ) || null
      }
    }

    const rota = await prisma.rotaSalva.update({
      where: { id },
      data
    })

    return NextResponse.json(rota)
  } catch (error) {
    console.error("Error patching route:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar rota" },
      { status: 500 }
    )
  }
}

// DELETE - Delete a saved route
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.rotaSalva.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting route:", error)
    return NextResponse.json(
      { error: "Erro ao eliminar rota" },
      { status: 500 }
    )
  }
}
