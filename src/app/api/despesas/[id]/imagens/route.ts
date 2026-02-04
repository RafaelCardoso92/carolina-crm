import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { isAdminOrHigher } from "@/lib/permissions"
import { writeFile, mkdir, unlink } from "fs/promises"
import path from "path"
import { v4 as uuidv4 } from "uuid"

const UPLOAD_DIR = process.env.UPLOAD_DIR || "/app/uploads/despesas"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Check ownership
    const despesa = await prisma.despesa.findUnique({
      where: { id },
      select: { userId: true }
    })

    if (!despesa) {
      return NextResponse.json({ error: "Despesa não encontrada" }, { status: 404 })
    }

    if (despesa.userId !== session.user.id && !isAdminOrHigher(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Tipo de ficheiro não permitido" }, { status: 400 })
    }

    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Ficheiro muito grande (max 10MB)" }, { status: 400 })
    }

    // Ensure upload directory exists
    await mkdir(UPLOAD_DIR, { recursive: true })

    // Generate unique filename
    const ext = path.extname(file.name) || ".jpg"
    const storedName = `${uuidv4()}${ext}`
    const filePath = path.join(UPLOAD_DIR, storedName)

    // Write file
    const bytes = await file.arrayBuffer()
    await writeFile(filePath, Buffer.from(bytes))

    // Save to database
    const imagem = await prisma.despesaImagem.create({
      data: {
        despesaId: id,
        filename: file.name,
        storedName,
        mimeType: file.type,
        size: file.size
      }
    })

    return NextResponse.json(imagem)
  } catch (error) {
    console.error("Error uploading image:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const imagemId = searchParams.get("imagemId")

    if (!imagemId) {
      return NextResponse.json({ error: "imagemId is required" }, { status: 400 })
    }

    // Get the image and check ownership
    const imagem = await prisma.despesaImagem.findUnique({
      where: { id: imagemId },
      include: {
        despesa: {
          select: { userId: true }
        }
      }
    })

    if (!imagem) {
      return NextResponse.json({ error: "Imagem não encontrada" }, { status: 404 })
    }

    if (imagem.despesa.userId !== session.user.id && !isAdminOrHigher(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Delete file from disk
    try {
      const filePath = path.join(UPLOAD_DIR, imagem.storedName)
      await unlink(filePath)
    } catch {
      // File might not exist, continue anyway
    }

    // Delete from database
    await prisma.despesaImagem.delete({ where: { id: imagemId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting image:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
