import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import type {
  ComissoesReconciliacaoResponse,
  UpdateComissoesReconciliacaoRequest
} from "@/types/reconciliacao-comissoes"

// GET single reconciliation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const reconciliacao = await prisma.reconciliacaoComissoes.findUnique({
      where: { id },
      include: {
        itens: {
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
          },
          orderBy: [
            { corresponde: "asc" },
            { codigoClientePdf: "asc" },
            { numeroPdf: "asc" },
            { parcelaPdf: "asc" }
          ]
        }
      }
    })
    
    if (!reconciliacao) {
      return NextResponse.json<ComissoesReconciliacaoResponse>(
        { success: false, error: "Reconciliação não encontrada" },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      reconciliacao
    })
  } catch (error) {
    console.error("Error fetching reconciliacao comissoes:", error)
    return NextResponse.json<ComissoesReconciliacaoResponse>(
      { success: false, error: "Erro ao carregar reconciliação" },
      { status: 500 }
    )
  }
}

// PATCH - Update reconciliation state/notes
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data: UpdateComissoesReconciliacaoRequest = await request.json()
    
    const updateData: Record<string, unknown> = {}
    
    if (data.estado) {
      updateData.estado = data.estado
      if (data.estado === "EM_REVISAO" || data.estado === "APROVADA") {
        updateData.dataRevisao = new Date()
      }
    }
    
    if (data.notas !== undefined) {
      updateData.notas = data.notas
    }
    
    const reconciliacao = await prisma.reconciliacaoComissoes.update({
      where: { id },
      data: updateData,
      include: {
        itens: {
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
        }
      }
    })
    
    return NextResponse.json({
      success: true,
      reconciliacao
    })
  } catch (error) {
    console.error("Error updating reconciliacao comissoes:", error)
    return NextResponse.json<ComissoesReconciliacaoResponse>(
      { success: false, error: "Erro ao atualizar reconciliação" },
      { status: 500 }
    )
  }
}

// DELETE - Remove reconciliation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    await prisma.reconciliacaoComissoes.delete({
      where: { id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting reconciliacao comissoes:", error)
    return NextResponse.json(
      { success: false, error: "Erro ao eliminar reconciliação" },
      { status: 500 }
    )
  }
}
