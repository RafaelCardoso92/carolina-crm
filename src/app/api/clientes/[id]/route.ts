import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const cliente = await prisma.cliente.findUnique({
      where: { id },
      include: {
        vendas: true,
        cobrancas: true
      }
    })

    if (!cliente) {
      return NextResponse.json({ error: "Cliente nao encontrado" }, { status: 404 })
    }

    return NextResponse.json(cliente)
  } catch (error) {
    console.error("Error fetching cliente:", error)
    return NextResponse.json({ error: "Erro ao buscar cliente" }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()

    if (!data.nome) {
      return NextResponse.json({ error: "Nome e obrigatorio" }, { status: 400 })
    }

    // Check if codigo already exists for another client
    if (data.codigo) {
      const existing = await prisma.cliente.findFirst({
        where: {
          codigo: data.codigo,
          NOT: { id }
        }
      })
      if (existing) {
        return NextResponse.json({ error: "Ja existe um cliente com este codigo" }, { status: 400 })
      }
    }

    const cliente = await prisma.cliente.update({
      where: { id },
      data: {
        nome: data.nome,
        codigo: data.codigo || null,
        telefone: data.telefone || null,
        email: data.email || null,
        morada: data.morada || null,
        cidade: data.cidade || null,
        codigoPostal: data.codigoPostal || null,
        latitude: data.latitude || null,
        longitude: data.longitude || null,
        notas: data.notas || null
      }
    })

    return NextResponse.json(cliente)
  } catch (error) {
    console.error("Error updating cliente:", error)
    return NextResponse.json({ error: "Erro ao atualizar cliente" }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()

    const cliente = await prisma.cliente.update({
      where: { id },
      data
    })

    return NextResponse.json(cliente)
  } catch (error) {
    console.error("Error patching cliente:", error)
    return NextResponse.json({ error: "Erro ao atualizar cliente" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.cliente.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting cliente:", error)
    return NextResponse.json({ error: "Erro ao eliminar cliente" }, { status: 500 })
  }
}
