import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const clientes = await prisma.cliente.findMany({
      orderBy: { nome: "asc" }
    })
    return NextResponse.json(clientes)
  } catch (error) {
    console.error("Error fetching clientes:", error)
    return NextResponse.json({ error: "Erro ao buscar clientes" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()

    if (!data.nome) {
      return NextResponse.json({ error: "Nome e obrigatorio" }, { status: 400 })
    }

    // Check if codigo already exists
    if (data.codigo) {
      const existing = await prisma.cliente.findUnique({
        where: { codigo: data.codigo }
      })
      if (existing) {
        return NextResponse.json({ error: "Ja existe um cliente com este codigo" }, { status: 400 })
      }
    }

    const cliente = await prisma.cliente.create({
      data: {
        nome: data.nome,
        codigo: data.codigo || null,
        telefone: data.telefone || null,
        email: data.email || null,
        morada: data.morada || null,
        notas: data.notas || null
      }
    })

    return NextResponse.json(cliente, { status: 201 })
  } catch (error) {
    console.error("Error creating cliente:", error)
    return NextResponse.json({ error: "Erro ao criar cliente" }, { status: 500 })
  }
}
