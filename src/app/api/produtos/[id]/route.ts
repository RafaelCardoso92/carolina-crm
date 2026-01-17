import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const produto = await prisma.produto.findUnique({
      where: { id },
      include: {
        _count: {
          select: { itensVenda: true }
        }
      }
    })

    if (!produto) {
      return NextResponse.json(
        { error: "Produto nao encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json(produto)
  } catch (error) {
    console.error("Error fetching produto:", error)
    return NextResponse.json(
      { error: "Erro ao carregar produto" },
      { status: 500 }
    )
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
      return NextResponse.json(
        { error: "Nome do produto e obrigatorio" },
        { status: 400 }
      )
    }

    // Check for duplicate code (excluding current product)
    if (data.codigo) {
      const existing = await prisma.produto.findFirst({
        where: {
          codigo: data.codigo,
          NOT: { id }
        }
      })
      if (existing) {
        return NextResponse.json(
          { error: "Ja existe outro produto com este codigo" },
          { status: 400 }
        )
      }
    }

    const produto = await prisma.produto.update({
      where: { id },
      data: {
        nome: data.nome,
        codigo: data.codigo || null,
        categoria: data.categoria || null,
        descricao: data.descricao || null,
        preco: data.preco !== undefined ? (data.preco ? parseFloat(data.preco) : null) : undefined,
        ativo: data.ativo !== false
      }
    })

    return NextResponse.json(produto)
  } catch (error) {
    console.error("Error updating produto:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar produto" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if product has sales items
    const produto = await prisma.produto.findUnique({
      where: { id },
      include: {
        _count: {
          select: { itensVenda: true }
        }
      }
    })

    if (!produto) {
      return NextResponse.json(
        { error: "Produto nao encontrado" },
        { status: 404 }
      )
    }

    // If product has sales, soft delete (deactivate)
    if (produto._count.itensVenda > 0) {
      await prisma.produto.update({
        where: { id },
        data: { ativo: false }
      })
      return NextResponse.json({ success: true, softDeleted: true })
    }

    // Otherwise, hard delete
    await prisma.produto.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting produto:", error)
    return NextResponse.json(
      { error: "Erro ao eliminar produto" },
      { status: 500 }
    )
  }
}
