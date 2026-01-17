import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

type ItemInput = {
  produtoId: string
  quantidade: number
  precoUnit: number
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const venda = await prisma.venda.findUnique({
      where: { id },
      include: {
        cliente: true,
        itens: {
          include: { produto: true },
          orderBy: { createdAt: "asc" }
        }
      }
    })

    if (!venda) {
      return NextResponse.json({ error: "Venda nao encontrada" }, { status: 404 })
    }

    return NextResponse.json(venda)
  } catch (error) {
    console.error("Error fetching venda:", error)
    return NextResponse.json({ error: "Erro ao buscar venda" }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()

    if (!data.clienteId) {
      return NextResponse.json({ error: "Cliente e obrigatorio" }, { status: 400 })
    }

    // Calculate total from both manual values AND items
    const itens: ItemInput[] = data.itens || []
    
    // Manual values
    const valor1 = data.valor1 ? parseFloat(data.valor1) : 0
    const valor2 = data.valor2 ? parseFloat(data.valor2) : 0
    const manualTotal = valor1 + valor2
    
    // Items total
    const itemsTotal = itens.reduce((sum: number, item: ItemInput) => {
      return sum + (item.quantidade * item.precoUnit)
    }, 0)
    
    // Combined total
    const total = manualTotal + itemsTotal

    if (total <= 0) {
      return NextResponse.json({ error: "O total deve ser maior que zero" }, { status: 400 })
    }

    // No limit on sales per client per month - removed the check

    // Update venda with items in a transaction
    const venda = await prisma.$transaction(async (tx) => {
      // Delete existing items
      await tx.itemVenda.deleteMany({
        where: { vendaId: id }
      })

      // Update the venda
      await tx.venda.update({
        where: { id },
        data: {
          clienteId: data.clienteId,
          valor1: valor1 || null,
          valor2: valor2 || null,
          total,
          notas: data.notas || null
        }
      })

      // Create new items if provided
      if (itens.length > 0) {
        await tx.itemVenda.createMany({
          data: itens.map((item: ItemInput) => ({
            vendaId: id,
            produtoId: item.produtoId,
            quantidade: item.quantidade,
            precoUnit: item.precoUnit,
            subtotal: item.quantidade * item.precoUnit
          }))
        })
      }

      // Return venda with items and client
      return tx.venda.findUnique({
        where: { id },
        include: {
          cliente: true,
          itens: {
            include: { produto: true },
            orderBy: { createdAt: "asc" }
          }
        }
      })
    })

    return NextResponse.json(venda)
  } catch (error) {
    console.error("Error updating venda:", error)
    return NextResponse.json({ error: "Erro ao atualizar venda" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.venda.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting venda:", error)
    return NextResponse.json({ error: "Erro ao eliminar venda" }, { status: 500 })
  }
}
