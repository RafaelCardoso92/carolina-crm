import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { requirePermission, userScopedWhere } from "@/lib/api-auth"
import { PERMISSIONS } from "@/lib/permissions"

type ProdutoInput = {
  produtoId?: string | null
  nome: string
  precoSemIva: number
  quantidade: number
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission(PERMISSIONS.CLIENTES_READ)
    const { id } = await params

    const objetivo = await prisma.objetivoVario.findFirst({
      where: { id, ...userScopedWhere(session) },
      include: {
        produtos: {
          include: { produto: true }
        }
      }
    })

    if (!objetivo) {
      return NextResponse.json({ error: "Objetivo não encontrado" }, { status: 404 })
    }

    return NextResponse.json({
      ...objetivo,
      totalProdutos: objetivo.produtos.length,
      totalValor: objetivo.produtos.reduce((sum, p) => sum + Number(p.precoSemIva) * p.quantidade, 0)
    })
  } catch (error) {
    if (error instanceof Response) return error
    console.error("Error fetching objetivo vario:", error)
    return NextResponse.json({ error: "Erro ao buscar objetivo" }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission(PERMISSIONS.CLIENTES_WRITE)
    const { id } = await params
    const data = await request.json()

    // Verify ownership
    const existing = await prisma.objetivoVario.findFirst({
      where: { id, ...userScopedWhere(session) }
    })
    if (!existing) {
      return NextResponse.json({ error: "Objetivo não encontrado" }, { status: 404 })
    }

    const produtosData: ProdutoInput[] = data.produtos || []

    const objetivo = await prisma.$transaction(async (tx) => {
      // Delete existing products and recreate
      await tx.objetivoVarioProduto.deleteMany({
        where: { objetivoVarioId: id }
      })

      return tx.objetivoVario.update({
        where: { id },
        data: {
          titulo: data.titulo,
          descricao: data.descricao,
          mes: data.mes ? parseInt(data.mes) : undefined,
          ano: data.ano ? parseInt(data.ano) : undefined,
          ativo: data.ativo,
          produtos: produtosData.length > 0 ? {
            create: produtosData.map(p => ({
              produtoId: p.produtoId || null,
              nome: p.nome,
              precoSemIva: p.precoSemIva,
              quantidade: p.quantidade || 1
            }))
          } : undefined
        },
        include: {
          produtos: {
            include: { produto: true }
          }
        }
      })
    })

    return NextResponse.json(objetivo)
  } catch (error) {
    if (error instanceof Response) return error
    console.error("Error updating objetivo vario:", error)
    return NextResponse.json({ error: "Erro ao atualizar objetivo" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission(PERMISSIONS.CLIENTES_WRITE)
    const { id } = await params

    // Verify ownership
    const existing = await prisma.objetivoVario.findFirst({
      where: { id, ...userScopedWhere(session) }
    })
    if (!existing) {
      return NextResponse.json({ error: "Objetivo não encontrado" }, { status: 404 })
    }

    await prisma.objetivoVario.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Response) return error
    console.error("Error deleting objetivo vario:", error)
    return NextResponse.json({ error: "Erro ao eliminar objetivo" }, { status: 500 })
  }
}
