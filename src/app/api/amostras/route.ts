import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET - List samples
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clienteId = searchParams.get("clienteId")
    const prospectoId = searchParams.get("prospectoId")
    const limit = parseInt(searchParams.get("limit") || "50")

    const where: Record<string, unknown> = {}
    if (clienteId) where.clienteId = clienteId
    if (prospectoId) where.prospectoId = prospectoId

    const amostras = await prisma.amostra.findMany({
      where,
      include: {
        cliente: { select: { id: true, nome: true } },
        prospecto: { select: { id: true, nomeEmpresa: true } },
        produto: { select: { id: true, nome: true, codigo: true } }
      },
      orderBy: { dataEntrega: "desc" },
      take: limit
    })

    return NextResponse.json(amostras)
  } catch (error) {
    console.error("Error fetching amostras:", error)
    return NextResponse.json({ error: "Erro ao carregar amostras" }, { status: 500 })
  }
}

// POST - Create sample
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { clienteId, prospectoId, produtoId, tipo, descricao, quantidade, valorEstimado, dataEntrega, notas } = body

    if (!clienteId && !prospectoId) {
      return NextResponse.json({ error: "Cliente ou Prospecto e obrigatorio" }, { status: 400 })
    }

    const amostra = await prisma.amostra.create({
      data: {
        clienteId: clienteId || null,
        prospectoId: prospectoId || null,
        produtoId: produtoId || null,
        tipo: tipo || "AMOSTRA",
        descricao,
        quantidade: quantidade || 1,
        valorEstimado: valorEstimado ? parseFloat(valorEstimado) : null,
        dataEntrega: dataEntrega ? new Date(dataEntrega) : new Date(),
        notas
      },
      include: {
        cliente: { select: { id: true, nome: true } },
        prospecto: { select: { id: true, nomeEmpresa: true } },
        produto: { select: { id: true, nome: true } }
      }
    })

    return NextResponse.json(amostra, { status: 201 })
  } catch (error) {
    console.error("Error creating amostra:", error)
    return NextResponse.json({ error: "Erro ao criar amostra" }, { status: 500 })
  }
}
