import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { unlink } from "fs/promises"
import { join } from "path"
import type { UpdateDevolucaoRequest, DevolucaoResponse } from "@/types/devolucao"

const UPLOADS_DIR = process.env.UPLOADS_DIR || "/app/uploads"

// GET - Get single return with full details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const devolucao = await prisma.devolucao.findUnique({
      where: { id },
      include: {
        venda: {
          include: {
            cliente: true
          }
        },
        itens: {
          include: {
            itemVenda: {
              include: {
                produto: true
              }
            },
            substituicao: true
          }
        },
        imagens: true
      }
    })

    if (!devolucao) {
      return NextResponse.json<DevolucaoResponse>(
        { success: false, error: "Devolução não encontrada" },
        { status: 404 }
      )
    }

    return NextResponse.json<DevolucaoResponse>({
      success: true,
      devolucao
    })
  } catch (error) {
    console.error("Error fetching devolucao:", error)
    return NextResponse.json<DevolucaoResponse>(
      { success: false, error: "Erro ao carregar devolução" },
      { status: 500 }
    )
  }
}

// PUT - Update return (status, notes)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body: UpdateDevolucaoRequest = await request.json()

    // Check if devolucao exists
    const existing = await prisma.devolucao.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json<DevolucaoResponse>(
        { success: false, error: "Devolução não encontrada" },
        { status: 404 }
      )
    }

    // Update only allowed fields
    const updateData: { motivo?: string; estado?: "PENDENTE" | "PROCESSADA" | "CANCELADA" } = {}

    if (body.motivo !== undefined) {
      updateData.motivo = body.motivo
    }

    if (body.estado !== undefined) {
      updateData.estado = body.estado
    }

    const devolucao = await prisma.devolucao.update({
      where: { id },
      data: updateData,
      include: {
        venda: {
          include: {
            cliente: true
          }
        },
        itens: {
          include: {
            itemVenda: {
              include: {
                produto: true
              }
            },
            substituicao: true
          }
        },
        imagens: true
      }
    })

    return NextResponse.json<DevolucaoResponse>({
      success: true,
      devolucao
    })
  } catch (error) {
    console.error("Error updating devolucao:", error)
    return NextResponse.json<DevolucaoResponse>(
      { success: false, error: "Erro ao atualizar devolução" },
      { status: 500 }
    )
  }
}

// DELETE - Delete return and cleanup images
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Fetch with images to clean up files
    const devolucao = await prisma.devolucao.findUnique({
      where: { id },
      include: { imagens: true }
    })

    if (!devolucao) {
      return NextResponse.json<DevolucaoResponse>(
        { success: false, error: "Devolução não encontrada" },
        { status: 404 }
      )
    }

    // Delete image files from filesystem
    for (const imagem of devolucao.imagens) {
      try {
        const filePath = join(UPLOADS_DIR, imagem.caminho)
        await unlink(filePath)
      } catch (err) {
        // File might not exist, continue
        console.error(`Failed to delete image file: ${imagem.caminho}`, err)
      }
    }

    // Delete from database (cascade will delete items and images records)
    await prisma.devolucao.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting devolucao:", error)
    return NextResponse.json<DevolucaoResponse>(
      { success: false, error: "Erro ao eliminar devolução" },
      { status: 500 }
    )
  }
}
