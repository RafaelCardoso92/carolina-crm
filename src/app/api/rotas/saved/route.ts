import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET - Get saved routes, optionally filtered by date range
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const concluida = searchParams.get("concluida")

    const where: any = {}

    if (startDate && endDate) {
      where.data = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    } else if (startDate) {
      where.data = { gte: new Date(startDate) }
    }

    if (concluida !== null) {
      where.concluida = concluida === "true"
    }

    const rotas = await prisma.rotaSalva.findMany({
      where,
      orderBy: { data: "asc" }
    })

    return NextResponse.json(rotas)
  } catch (error) {
    console.error("Error fetching saved routes:", error)
    return NextResponse.json(
      { error: "Erro ao carregar rotas" },
      { status: 500 }
    )
  }
}

// POST - Save a new route
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    if (!data.data || !data.locais || data.locais.length === 0) {
      return NextResponse.json(
        { error: "Data e locais são obrigatórios" },
        { status: 400 }
      )
    }

    if (!data.origemLatitude || !data.origemLongitude) {
      return NextResponse.json(
        { error: "Ponto de origem é obrigatório" },
        { status: 400 }
      )
    }

    // Calculate fuel cost if distance and consumption provided
    let custoCombuistivel = data.custoCombuistivel
    if (!custoCombuistivel && data.distanciaTotal && data.consumoMedio && data.precoLitro) {
      const distanceKm = parseFloat(data.distanciaTotal.replace(/[^\d.]/g, ""))
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

    const rota = await prisma.rotaSalva.create({
      data: {
        nome: data.nome || null,
        data: new Date(data.data),
        origemLatitude: data.origemLatitude,
        origemLongitude: data.origemLongitude,
        origemEndereco: data.origemEndereco || null,
        locais: data.locais,
        paragens: data.paragens || null,
        distanciaTotal: data.distanciaTotal || null,
        duracaoTotal: data.duracaoTotal || null,
        // Cost fields
        custoPortagens: data.custoPortagens || null,
        numPortagens: data.numPortagens || null,
        custoCombuistivel: custoCombuistivel || null,
        consumoMedio: data.consumoMedio || null,
        precoLitro: data.precoLitro || null,
        custoEstacionamento: data.custoEstacionamento || null,
        custoTotal: custoTotal,
        notasCustos: data.notasCustos || null,
        concluida: false
      }
    })

    return NextResponse.json(rota, { status: 201 })
  } catch (error) {
    console.error("Error saving route:", error)
    return NextResponse.json(
      { error: "Erro ao guardar rota" },
      { status: 500 }
    )
  }
}
