import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const produtos = await prisma.produto.findMany({
      orderBy: { nome: "asc" },
      include: {
        _count: {
          select: { itensVenda: true }
        }
      }
    })

    return NextResponse.json(produtos)
  } catch (error) {
    console.error("Error fetching produtos:", error)
    return NextResponse.json(
      { error: "Erro ao carregar produtos" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const data = await request.json()

    if (!data.nome) {
      return NextResponse.json(
        { error: "Nome do produto e obrigatorio" },
        { status: 400 }
      )
    }

    // Check for duplicate code
    if (data.codigo) {
      const existing = await prisma.produto.findUnique({
        where: { codigo: data.codigo }
      })
      if (existing) {
        return NextResponse.json(
          { error: "Ja existe um produto com este codigo" },
          { status: 400 }
        )
      }
    }

    const produto = await prisma.produto.create({
      data: {
        nome: data.nome,
        codigo: data.codigo || null,
        categoria: data.categoria || null,
        descricao: data.descricao || null,
        preco: data.preco ? parseFloat(data.preco) : null,
        ativo: data.ativo !== false
      }
    })

    return NextResponse.json(produto, { status: 201 })
  } catch (error) {
    console.error("Error creating produto:", error)
    return NextResponse.json(
      { error: "Erro ao criar produto" },
      { status: 500 }
    )
  }
}
