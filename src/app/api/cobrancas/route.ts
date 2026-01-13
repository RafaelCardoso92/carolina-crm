import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const cobrancas = await prisma.cobranca.findMany({
      include: { cliente: true },
      orderBy: [{ pago: "asc" }, { createdAt: "desc" }]
    })
    return NextResponse.json(cobrancas)
  } catch (error) {
    console.error("Error fetching cobrancas:", error)
    return NextResponse.json({ error: "Erro ao buscar cobrancas" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()

    if (!data.clienteId || !data.valor) {
      return NextResponse.json({ error: "Cliente e valor sao obrigatorios" }, { status: 400 })
    }

    const cobranca = await prisma.cobranca.create({
      data: {
        clienteId: data.clienteId,
        fatura: data.fatura || null,
        valor: data.valor,
        valorSemIva: data.valorSemIva || null,
        comissao: data.comissao || null,
        dataEmissao: data.dataEmissao ? new Date(data.dataEmissao) : null,
        notas: data.notas || null
      },
      include: { cliente: true }
    })

    return NextResponse.json(cobranca, { status: 201 })
  } catch (error) {
    console.error("Error creating cobranca:", error)
    return NextResponse.json({ error: "Erro ao criar cobranca" }, { status: 500 })
  }
}
