import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import type { UpdateItemRequest } from "@/types/reconciliacao"

// PUT - Update item resolution
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id, itemId } = await params
    const body: UpdateItemRequest = await request.json()

    // Check if item exists and belongs to this reconciliation
    const item = await prisma.itemReconciliacao.findFirst({
      where: {
        id: itemId,
        reconciliacaoId: id
      }
    })

    if (!item) {
      return NextResponse.json(
        { success: false, error: "Item não encontrado" },
        { status: 404 }
      )
    }

    // Update item
    const updateData: { resolvido?: boolean; notaResolucao?: string | null } = {}

    if (body.resolvido !== undefined) {
      updateData.resolvido = body.resolvido
    }

    if (body.notaResolucao !== undefined) {
      updateData.notaResolucao = body.notaResolucao || null
    }

    const updatedItem = await prisma.itemReconciliacao.update({
      where: { id: itemId },
      data: updateData,
      include: {
        cliente: {
          select: { id: true, nome: true, codigo: true }
        },
        venda: {
          select: { id: true, total: true, mes: true, ano: true }
        }
      }
    })

    // Recalculate reconciliation summary
    const allItems = await prisma.itemReconciliacao.findMany({
      where: { reconciliacaoId: id }
    })

    const itensCorretos = allItems.filter(i => i.corresponde || i.resolvido).length
    const itensComProblema = allItems.filter(i => !i.corresponde && !i.resolvido).length

    // Update reconciliation summary
    await prisma.reconciliacaoMensal.update({
      where: { id },
      data: {
        itensCorretos,
        itensComProblema,
        estado: itensComProblema > 0 ? "COM_PROBLEMAS" : "APROVADA"
      }
    })

    return NextResponse.json({
      success: true,
      item: updatedItem
    })
  } catch (error) {
    console.error("Error updating item:", error)
    return NextResponse.json(
      { success: false, error: "Erro ao atualizar item" },
      { status: 500 }
    )
  }
}
