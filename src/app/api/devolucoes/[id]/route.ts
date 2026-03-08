import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { getEffectiveUserId, canViewAllData } from "@/lib/permissions"
import { unlink } from "fs/promises"
import { join } from "path"
import type { UpdateDevolucaoRequest, DevolucaoResponse } from "@/types/devolucao"

const UPLOADS_DIR = process.env.UPLOADS_DIR || "/app/uploads"

async function checkDevolucaoAccess(devolucaoId: string, session: Parameters<typeof getEffectiveUserId>[0]) {
  const devolucao = await prisma.devolucao.findUnique({
    where: { id: devolucaoId },
    include: {
      venda: { include: { cliente: { select: { userId: true } } } }
    }
  })

  if (!devolucao) return false

  const effectiveUserId = getEffectiveUserId(session)
  const canViewAll = canViewAllData(session.user.role as Parameters<typeof canViewAllData>[0]) && !session.user.impersonating

  return canViewAll || devolucao.venda.cliente.userId === effectiveUserId
}

// GET - Get single return with full details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json<DevolucaoResponse>(
        { success: false, error: "Não autorizado" },
        { status: 401 }
      )
    }

    const { id } = await params

    const authorized = await checkDevolucaoAccess(id, session)
    if (!authorized) {
      return NextResponse.json<DevolucaoResponse>(
        { success: false, error: "Devolução não encontrada" },
        { status: 404 }
      )
    }

    const devolucao = await prisma.devolucao.findUnique({
      where: { id },
      include: {
        venda: { include: { cliente: true } },
        itens: {
          include: {
            itemVenda: { include: { produto: true } },
            substituicao: true
          }
        },
        imagens: true
      }
    })

    return NextResponse.json<DevolucaoResponse>({
      success: true,
      devolucao: devolucao!
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
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json<DevolucaoResponse>(
        { success: false, error: "Não autorizado" },
        { status: 401 }
      )
    }

    const { id } = await params

    const authorized = await checkDevolucaoAccess(id, session)
    if (!authorized) {
      return NextResponse.json<DevolucaoResponse>(
        { success: false, error: "Devolução não encontrada" },
        { status: 404 }
      )
    }

    const body: UpdateDevolucaoRequest = await request.json()

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
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json<DevolucaoResponse>(
        { success: false, error: "Não autorizado" },
        { status: 401 }
      )
    }

    const { id } = await params

    const authorized = await checkDevolucaoAccess(id, session)
    if (!authorized) {
      return NextResponse.json<DevolucaoResponse>(
        { success: false, error: "Devolução não encontrada" },
        { status: 404 }
      )
    }

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
