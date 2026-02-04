import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { unlink } from "fs/promises"
import { join } from "path"
import type { ReconciliacaoResponse, UpdateReconciliacaoRequest } from "@/types/reconciliacao"

const UPLOADS_DIR = process.env.UPLOADS_DIR || "/app/uploads"

// GET - Get single reconciliation with full details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const reconciliacao = await prisma.reconciliacaoMensal.findUnique({
      where: { id },
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

// PUT - Update reconciliation (status, notes)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body: UpdateReconciliacaoRequest = await request.json()

    // Check if exists
    const existing = await prisma.reconciliacaoMensal.findUnique({
      where: { id }
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

// DELETE - Delete reconciliation and cleanup file
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Fetch with file path
    const reconciliacao = await prisma.reconciliacaoMensal.findUnique({
      where: { id }
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
