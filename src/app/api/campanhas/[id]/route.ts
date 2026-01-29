import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

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
    const { id } = await params
    const campanha = await prisma.campanha.findUnique({
      where: { id },
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
    console.error("Error fetching campanha:", error)
    return NextResponse.json({ error: "Erro ao buscar campanha" }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()

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
    console.error("Error updating campanha:", error)
    return NextResponse.json({ error: "Erro ao atualizar campanha" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.campanha.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting campanha:", error)
    return NextResponse.json({ error: "Erro ao eliminar campanha" }, { status: 500 })
  }
}
