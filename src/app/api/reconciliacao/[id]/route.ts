import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getEffectiveUserId } from "@/lib/permissions"
import { unlink } from "fs/promises"
import { join } from "path"
import type { ReconciliacaoResponse, UpdateReconciliacaoRequest } from "@/types/reconciliacao"

const UPLOADS_DIR = process.env.UPLOADS_DIR || "/app/uploads"

// GET - Get single reconciliation with full details (ALWAYS user-scoped - personal data)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json<ReconciliacaoResponse>({ success: false, error: "Não autorizado" }, { status: 401 })
    }

    const { id } = await params
    const userId = getEffectiveUserId(session)

    const reconciliacao = await prisma.reconciliacaoMensal.findFirst({
      where: { id, userId },
      include: {
        itens: {
          include: {
            cliente: {
              select: { id: true, nome: true, codigo: true }
            },
            venda: {
              select: { id: true, total: true, mes: true, ano: true }
            }
          },
          orderBy: [
            { corresponde: "asc" },  // Problems first
            { codigoClientePdf: "asc" }
          ]
        }
      }
    })

    if (!reconciliacao) {
      return NextResponse.json<ReconciliacaoResponse>(
        { success: false, error: "Reconciliação não encontrada" },
        { status: 404 }
      )
    }

    // Cast to handle type compatibility with the response type
    return NextResponse.json({
      success: true,
      reconciliacao
    })
  } catch (error) {
    console.error("Error fetching reconciliacao:", error)
    return NextResponse.json<ReconciliacaoResponse>(
      { success: false, error: "Erro ao carregar reconciliação" },
      { status: 500 }
    )
  }
}

// PUT - Update reconciliation (status, notes) (ALWAYS user-scoped - personal data)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json<ReconciliacaoResponse>({ success: false, error: "Não autorizado" }, { status: 401 })
    }

    const { id } = await params
    const userId = getEffectiveUserId(session)
    const body: UpdateReconciliacaoRequest = await request.json()

    // Check if exists and belongs to user
    const existing = await prisma.reconciliacaoMensal.findFirst({
      where: { id, userId }
    })

    if (!existing) {
      return NextResponse.json<ReconciliacaoResponse>(
        { success: false, error: "Reconciliação não encontrada" },
        { status: 404 }
      )
    }

    // Build update data
    const updateData: {
      estado?: "PENDENTE" | "EM_REVISAO" | "APROVADA" | "COM_PROBLEMAS"
      notas?: string
      dataRevisao?: Date
    } = {}

    if (body.estado !== undefined) {
      updateData.estado = body.estado
      if (body.estado === "APROVADA" || body.estado === "COM_PROBLEMAS") {
        updateData.dataRevisao = new Date()
      }
    }

    if (body.notas !== undefined) {
      updateData.notas = body.notas
    }

    const reconciliacao = await prisma.reconciliacaoMensal.update({
      where: { id },
      data: updateData,
      include: {
        itens: {
          include: {
            cliente: {
              select: { id: true, nome: true, codigo: true }
            },
            venda: {
              select: { id: true, total: true, mes: true, ano: true }
            }
          }
        }
      }
    })

    // Cast to handle type compatibility with the response type
    return NextResponse.json({
      success: true,
      reconciliacao
    })
  } catch (error) {
    console.error("Error updating reconciliacao:", error)
    return NextResponse.json<ReconciliacaoResponse>(
      { success: false, error: "Erro ao atualizar reconciliação" },
      { status: 500 }
    )
  }
}

// DELETE - Delete reconciliation and cleanup file (ALWAYS user-scoped - personal data)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json<ReconciliacaoResponse>({ success: false, error: "Não autorizado" }, { status: 401 })
    }

    const { id } = await params
    const userId = getEffectiveUserId(session)

    // Fetch with file path, verify ownership
    const reconciliacao = await prisma.reconciliacaoMensal.findFirst({
      where: { id, userId }
    })

    if (!reconciliacao) {
      return NextResponse.json<ReconciliacaoResponse>(
        { success: false, error: "Reconciliação não encontrada" },
        { status: 404 }
      )
    }

    // Delete PDF file
    try {
      const filePath = join(UPLOADS_DIR, reconciliacao.caminhoArquivo)
      await unlink(filePath)
    } catch (err) {
      console.error(`Failed to delete PDF file: ${reconciliacao.caminhoArquivo}`, err)
    }

    // Delete from database (cascade will delete items)
    await prisma.reconciliacaoMensal.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting reconciliacao:", error)
    return NextResponse.json<ReconciliacaoResponse>(
      { success: false, error: "Erro ao eliminar reconciliação" },
      { status: 500 }
    )
  }
}
