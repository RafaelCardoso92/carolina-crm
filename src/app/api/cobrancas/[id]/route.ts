import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const cobranca = await prisma.cobranca.findUnique({
      where: { id },
      include: { cliente: true }
    })

    if (!cobranca) {
      return NextResponse.json({ error: "Cobranca nao encontrada" }, { status: 404 })
    }

    return NextResponse.json(cobranca)
  } catch (error) {
    console.error("Error fetching cobranca:", error)
    return NextResponse.json({ error: "Erro ao buscar cobranca" }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()

    if (!data.clienteId || !data.valor) {
      return NextResponse.json({ error: "Cliente e valor sao obrigatorios" }, { status: 400 })
    }

    const cobranca = await prisma.cobranca.update({
      where: { id },
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

    return NextResponse.json(cobranca)
  } catch (error) {
    console.error("Error updating cobranca:", error)
    return NextResponse.json({ error: "Erro ao atualizar cobranca" }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()

    const cobranca = await prisma.cobranca.update({
      where: { id },
      data: {
        pago: data.pago,
        dataPago: data.dataPago ? new Date(data.dataPago) : null
      },
      include: { cliente: true }
    })

    return NextResponse.json(cobranca)
  } catch (error) {
    console.error("Error patching cobranca:", error)
    return NextResponse.json({ error: "Erro ao atualizar cobranca" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.cobranca.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting cobranca:", error)
    return NextResponse.json({ error: "Erro ao eliminar cobranca" }, { status: 500 })
  }
}
