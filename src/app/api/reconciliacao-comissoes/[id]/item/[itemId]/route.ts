import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import type { UpdateItemComissaoRequest } from "@/types/reconciliacao-comissoes"

// PATCH - Update item resolution status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id, itemId } = await params
    const data: UpdateItemComissaoRequest = await request.json()
    
    const updateData: Record<string, unknown> = {}
    
    if (data.resolvido !== undefined) {
      updateData.resolvido = data.resolvido
    }
    
    if (data.notaResolucao !== undefined) {
      updateData.notaResolucao = data.notaResolucao
    }
    
    const item = await prisma.itemReconciliacaoComissao.update({
      where: { id: itemId },
      data: updateData,
      include: {
        cliente: {
          select: { id: true, nome: true, codigo: true }
        },
        cobranca: {
          select: { id: true, fatura: true, valor: true, comissao: true }
        },
        parcela: {
          select: { id: true, numero: true, valor: true, dataPago: true }
        }
      }
    })
    
    // Update reconciliation counters
    const reconciliacao = await prisma.reconciliacaoComissoes.findUnique({
      where: { id },
      include: {
        itens: true
      }
    })
    
    if (reconciliacao) {
      const itensCorretos = reconciliacao.itens.filter(i => i.corresponde || i.resolvido).length
      const itensComProblema = reconciliacao.itens.filter(i => !i.corresponde && !i.resolvido).length
      
      // Update state based on items
      let estado = reconciliacao.estado
      if (itensComProblema === 0) {
        estado = "APROVADA"
      } else if (itensCorretos > 0 && itensComProblema > 0) {
        estado = "EM_REVISAO"
      }
      
      await prisma.reconciliacaoComissoes.update({
        where: { id },
        data: {
          itensCorretos,
          itensComProblema,
          estado
        }
      })
    }
    
    return NextResponse.json({
      success: true,
      item
    })
  } catch (error) {
    console.error("Error updating item reconciliacao comissoes:", error)
    return NextResponse.json(
      { success: false, error: "Erro ao atualizar item" },
      { status: 500 }
    )
  }
}
