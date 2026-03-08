import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { getEffectiveUserId, canViewAllData } from "@/lib/permissions"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { randomUUID } from "crypto"
import type { ImageUploadResponse } from "@/types/devolucao"

const UPLOADS_DIR = process.env.UPLOADS_DIR || "/app/uploads"
const MAX_FILE_SIZE = 5 * 1024 * 1024  // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]

// POST - Upload image for a return
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json<ImageUploadResponse>(
        { success: false, error: "Não autorizado" },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const devolucaoId = formData.get("devolucaoId") as string | null

    // Validate inputs
    if (!file) {
      return NextResponse.json<ImageUploadResponse>(
        { success: false, error: "Ficheiro não fornecido" },
        { status: 400 }
      )
    }

    if (!devolucaoId) {
      return NextResponse.json<ImageUploadResponse>(
        { success: false, error: "ID da devolução não fornecido" },
        { status: 400 }
      )
    }

    // Check devolucao exists and verify ownership
    const devolucao = await prisma.devolucao.findUnique({
      where: { id: devolucaoId },
      include: {
        imagens: true,
        venda: { include: { cliente: { select: { userId: true } } } }
      }
    })

    if (!devolucao) {
      return NextResponse.json<ImageUploadResponse>(
        { success: false, error: "Devolução não encontrada" },
        { status: 404 }
      )
    }

    // Verify ownership
    const effectiveUserId = getEffectiveUserId(session)
    const canViewAll = canViewAllData(session.user.role) && !session.user.impersonating
    if (!canViewAll && devolucao.venda.cliente.userId !== effectiveUserId) {
      return NextResponse.json<ImageUploadResponse>(
        { success: false, error: "Sem permissão" },
        { status: 403 }
      )
    }

    // Check image limit (max 2)
    if (devolucao.imagens.length >= 2) {
      return NextResponse.json<ImageUploadResponse>(
        { success: false, error: "Limite de 2 imagens por devolução atingido" },
        { status: 400 }
      )
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json<ImageUploadResponse>(
        { success: false, error: "Tipo de ficheiro não permitido. Use JPG, PNG ou WebP." },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json<ImageUploadResponse>(
        { success: false, error: "Ficheiro muito grande. Máximo 5MB." },
        { status: 400 }
      )
    }

    // Create directory for this devolucao
    const dirPath = join(UPLOADS_DIR, "devolucoes", devolucaoId)
    await mkdir(dirPath, { recursive: true })

    // Generate unique filename
    const ext = file.name.split(".").pop() || "jpg"
    const filename = `${randomUUID()}.${ext}`
    const relativePath = join("devolucoes", devolucaoId, filename)
    const fullPath = join(UPLOADS_DIR, relativePath)

    // Write file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(fullPath, buffer)

    // Create database record
    const imagem = await prisma.imagemDevolucao.create({
      data: {
        devolucaoId,
        caminho: relativePath,
        nomeOriginal: file.name,
        tamanho: file.size,
        tipo: file.type
      }
    })

    return NextResponse.json<ImageUploadResponse>({
      success: true,
      imagem
    })
  } catch (error) {
    console.error("Error uploading image:", error)
    return NextResponse.json<ImageUploadResponse>(
      { success: false, error: "Erro ao carregar imagem" },
      { status: 500 }
    )
  }
}

// DELETE - Delete a specific image
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Não autorizado" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const imagemId = searchParams.get("id")

    if (!imagemId) {
      return NextResponse.json(
        { success: false, error: "ID da imagem não fornecido" },
        { status: 400 }
      )
    }

    // Fetch image with ownership check through devolucao → venda → cliente
    const imagem = await prisma.imagemDevolucao.findUnique({
      where: { id: imagemId },
      include: {
        devolucao: {
          include: {
            venda: { include: { cliente: { select: { userId: true } } } }
          }
        }
      }
    })

    if (!imagem) {
      return NextResponse.json(
        { success: false, error: "Imagem não encontrada" },
        { status: 404 }
      )
    }

    // Verify ownership
    const effectiveUserId = getEffectiveUserId(session)
    const canViewAll = canViewAllData(session.user.role) && !session.user.impersonating
    if (!canViewAll && imagem.devolucao.venda.cliente.userId !== effectiveUserId) {
      return NextResponse.json(
        { success: false, error: "Sem permissão" },
        { status: 403 }
      )
    }

    // Delete file
    try {
      const { unlink } = await import("fs/promises")
      const filePath = join(UPLOADS_DIR, imagem.caminho)
      await unlink(filePath)
    } catch {
      // File might not exist
    }

    // Delete from database
    await prisma.imagemDevolucao.delete({
      where: { id: imagemId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting image:", error)
    return NextResponse.json(
      { success: false, error: "Erro ao eliminar imagem" },
      { status: 500 }
    )
  }
}
