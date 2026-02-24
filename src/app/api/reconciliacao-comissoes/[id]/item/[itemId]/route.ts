import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import type { UpdateItemComissaoRequest } from "@/types/reconciliacao-comissoes"

// PATCH - Update item resolution status or edit values
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

    // Handle manual value edits
    let valuesEdited = false

    if (data.valorLiquidoPdf !== undefined) {
      updateData.valorLiquidoPdf = data.valorLiquidoPdf
      valuesEdited = true
    }

    if (data.valorComissaoPdf !== undefined) {
      updateData.valorComissaoPdf = data.valorComissaoPdf
      valuesEdited = true
    }

    if (data.valorSistema !== undefined) {
      updateData.valorSistema = data.valorSistema
      valuesEdited = true
    }

    if (data.comissaoSistema !== undefined) {
      updateData.comissaoSistema = data.comissaoSistema
      valuesEdited = true
    }

    // Mark as manually edited if any value was changed
    if (valuesEdited) {
      updateData.editadoManualmente = true

      // Recalculate differences
      const currentItem = await prisma.itemReconciliacaoComissao.findUnique({
        where: { id: itemId }
      })

      if (currentItem) {
        const newValorPdf = data.valorLiquidoPdf ?? Number(currentItem.valorLiquidoPdf)
        const newComissaoPdf = data.valorComissaoPdf ?? Number(currentItem.valorComissaoPdf)
        const newValorSistema = data.valorSistema ?? (currentItem.valorSistema ? Number(currentItem.valorSistema) : null)
        const newComissaoSistema = data.comissaoSistema ?? (currentItem.comissaoSistema ? Number(currentItem.comissaoSistema) : null)

        if (newValorSistema !== null) {
          const diferencaValor = newValorPdf - newValorSistema
          const diferencaComissao = newComissaoSistema !== null ? newComissaoPdf - newComissaoSistema : null

          updateData.diferencaValor = Math.round(diferencaValor * 100) / 100
          if (diferencaComissao !== null) {
            updateData.diferencaComissao = Math.round(diferencaComissao * 100) / 100
          }

          // Check if values now match (within tolerance)
          const valoresCorrespondem = Math.abs(diferencaValor) <= 0.10 &&
            (diferencaComissao === null || Math.abs(diferencaComissao) <= 0.15)

          if (valoresCorrespondem) {
            updateData.corresponde = true
            updateData.tipoDiscrepancia = null
            updateData.diferencaValor = 0
            updateData.diferencaComissao = 0
          }
        }
      }
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
