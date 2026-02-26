import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getEffectiveUserId } from "@/lib/permissions"
import type {
  ComissoesReconciliacaoResponse,
  UpdateComissoesReconciliacaoRequest
} from "@/types/reconciliacao-comissoes"

// GET single reconciliation (ALWAYS user-scoped - personal data)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json<ComissoesReconciliacaoResponse>({ success: false, error: "Não autorizado" }, { status: 401 })
    }

    const { id } = await params
    const userId = getEffectiveUserId(session)

    const reconciliacao = await prisma.reconciliacaoComissoes.findFirst({
      where: { id, userId },
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

// PATCH - Update reconciliation state/notes (ALWAYS user-scoped - personal data)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json<ComissoesReconciliacaoResponse>({ success: false, error: "Não autorizado" }, { status: 401 })
    }

    const { id } = await params
    const userId = getEffectiveUserId(session)
    const data: UpdateComissoesReconciliacaoRequest = await request.json()

    // Verify ownership
    const existing = await prisma.reconciliacaoComissoes.findFirst({
      where: { id, userId }
    })
    if (!existing) {
      return NextResponse.json<ComissoesReconciliacaoResponse>({ success: false, error: "Reconciliação não encontrada" }, { status: 404 })
    }

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

// DELETE - Remove reconciliation (ALWAYS user-scoped - personal data)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Não autorizado" }, { status: 401 })
    }

    const { id } = await params
    const userId = getEffectiveUserId(session)

    // Verify ownership before deleting
    const existing = await prisma.reconciliacaoComissoes.findFirst({
      where: { id, userId }
    })
    if (!existing) {
      return NextResponse.json({ success: false, error: "Reconciliação não encontrada" }, { status: 404 })
    }

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
