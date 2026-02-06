import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { requirePermission, userScopedWhere } from "@/lib/api-auth"
import { PERMISSIONS } from "@/lib/permissions"

type ProdutoInput = {
  produtoId?: string | null
  nome: string
  precoUnit: number
  quantidade: number
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission(PERMISSIONS.CAMPANHAS_READ)
    const { id } = await params

    const campanha = await prisma.campanha.findFirst({
      where: { id, ...userScopedWhere(session) },
      include: {
        vendas: {
          include: {
            venda: {
              include: { cliente: true }
            }
          }
        },
        produtos: {
          include: { produto: true }
        }
      }
    })

    if (!campanha) {
      return NextResponse.json({ error: "Campanha nao encontrada" }, { status: 404 })
    }

    return NextResponse.json({
      ...campanha,
      totalVendido: campanha.vendas.reduce((sum, v) => sum + v.quantidade, 0),
      totalVendas: campanha.vendas.length,
      totalSemIva: campanha.produtos.reduce((sum, p) => sum + Number(p.precoUnit) * p.quantidade, 0)
    })
  } catch (error) {
    if (error instanceof Response) return error
    console.error("Error fetching campanha:", error)
    return NextResponse.json({ error: "Erro ao buscar campanha" }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission(PERMISSIONS.CAMPANHAS_WRITE)
    const { id } = await params
    const data = await request.json()

    // Verify ownership
    const existing = await prisma.campanha.findFirst({
      where: { id, ...userScopedWhere(session) }
    })
    if (!existing) {
      return NextResponse.json({ error: "Campanha nao encontrada" }, { status: 404 })
    }

    const produtosData: ProdutoInput[] = data.produtos || []

    const campanha = await prisma.$transaction(async (tx) => {
      // Delete existing products and recreate
      await tx.campanhaProduto.deleteMany({
        where: { campanhaId: id }
      })

      return tx.campanha.update({
        where: { id },
        data: {
          titulo: data.titulo,
          descricao: data.descricao,
          mes: data.mes ? parseInt(data.mes) : undefined,
          ano: data.ano ? parseInt(data.ano) : undefined,
          ativo: data.ativo,
          recorrente: data.recorrente,
          produtos: produtosData.length > 0 ? {
            create: produtosData.map(p => ({
              produtoId: p.produtoId || null,
              nome: p.nome,
              precoUnit: p.precoUnit,
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

    return NextResponse.json(campanha)
  } catch (error) {
    if (error instanceof Response) return error
    console.error("Error updating campanha:", error)
    return NextResponse.json({ error: "Erro ao atualizar campanha" }, { status: 500 })
  }
}

// PATCH for quick toggle of ativo/recorrente
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission(PERMISSIONS.CAMPANHAS_WRITE)
    const { id } = await params
    const data = await request.json()

    // Verify ownership
    const existing = await prisma.campanha.findFirst({
      where: { id, ...userScopedWhere(session) }
    })
    if (!existing) {
      return NextResponse.json({ error: "Campanha nao encontrada" }, { status: 404 })
    }

    // Only allow toggling ativo and recorrente
    const updateData: { ativo?: boolean; recorrente?: boolean } = {}
    if (typeof data.ativo === "boolean") updateData.ativo = data.ativo
    if (typeof data.recorrente === "boolean") updateData.recorrente = data.recorrente

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "Nada para atualizar" }, { status: 400 })
    }

    const campanha = await prisma.campanha.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(campanha)
  } catch (error) {
    if (error instanceof Response) return error
    console.error("Error patching campanha:", error)
    return NextResponse.json({ error: "Erro ao atualizar campanha" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission(PERMISSIONS.CAMPANHAS_WRITE)
    const { id } = await params

    // Verify ownership
    const existing = await prisma.campanha.findFirst({
      where: { id, ...userScopedWhere(session) }
    })
    if (!existing) {
      return NextResponse.json({ error: "Campanha nao encontrada" }, { status: 404 })
    }

    await prisma.campanha.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Response) return error
    console.error("Error deleting campanha:", error)
    return NextResponse.json({ error: "Erro ao eliminar campanha" }, { status: 500 })
  }
}
