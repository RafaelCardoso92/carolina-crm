import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const mes = searchParams.get("mes") ? parseInt(searchParams.get("mes")!) : undefined
    const ano = searchParams.get("ano") ? parseInt(searchParams.get("ano")!) : undefined
    const ativo = searchParams.get("ativo")

    const where: Record<string, unknown> = {}
    if (mes) where.mes = mes
    if (ano) where.ano = ano
    if (ativo !== null && ativo !== undefined) where.ativo = ativo === "true"

    const campanhas = await prisma.campanha.findMany({
      where,
      include: {
        vendas: {
          include: {
            venda: {
              include: { cliente: true }
            }
          }
        }
      },
      orderBy: [{ ano: "desc" }, { mes: "desc" }, { titulo: "asc" }]
    })

    // Calculate totals sold for each campanha
    const campanhasComTotais = campanhas.map(c => ({
      ...c,
      totalVendido: c.vendas.reduce((sum, v) => sum + v.quantidade, 0),
      totalVendas: c.vendas.length
    }))

    return NextResponse.json(campanhasComTotais)
  } catch (error) {
    console.error("Error fetching campanhas:", error)
    return NextResponse.json({ error: "Erro ao buscar campanhas" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()

    if (!data.titulo || !data.mes || !data.ano) {
      return NextResponse.json({ error: "Titulo, mes e ano sao obrigatorios" }, { status: 400 })
    }

    const campanha = await prisma.campanha.create({
      data: {
        titulo: data.titulo,
        descricao: data.descricao || null,
        mes: parseInt(data.mes),
        ano: parseInt(data.ano),
        ativo: true
      }
    })

    return NextResponse.json(campanha, { status: 201 })
  } catch (error) {
    console.error("Error creating campanha:", error)
    return NextResponse.json({ error: "Erro ao criar campanha" }, { status: 500 })
  }
}
