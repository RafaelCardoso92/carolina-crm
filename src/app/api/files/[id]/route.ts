import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { readFile, unlink } from "fs/promises"
import { existsSync } from "fs"
import path from "path"

const UPLOAD_DIR = process.env.UPLOAD_DIR || "/app/uploads"

// GET - Download file
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const file = await prisma.userFile.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    })

    if (!file) {
      return NextResponse.json({ error: "Ficheiro nao encontrado" }, { status: 404 })
    }

    const filePath = path.join(UPLOAD_DIR, file.storedName)

    if (!existsSync(filePath)) {
      // File doesn't exist on disk, remove from database
      await prisma.userFile.delete({ where: { id } })
      return NextResponse.json({ error: "Ficheiro nao encontrado no servidor" }, { status: 404 })
    }

    const fileBuffer = await readFile(filePath)

    const response = new NextResponse(fileBuffer)
    response.headers.set("Content-Type", file.mimeType)
    response.headers.set("Content-Disposition", `attachment; filename="${file.filename}"`)
    response.headers.set("Content-Length", file.size.toString())

    return response
  } catch (error) {
    console.error("Error downloading file:", error)
    return NextResponse.json({ error: "Erro ao descarregar ficheiro" }, { status: 500 })
  }
}

// DELETE - Delete file
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

    const file = await prisma.userFile.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    })

    if (!file) {
      return NextResponse.json({ error: "Ficheiro nao encontrado" }, { status: 404 })
    }

    const filePath = path.join(UPLOAD_DIR, file.storedName)

    // Delete from disk if exists
    if (existsSync(filePath)) {
      await unlink(filePath)
    }

    // Delete from database
    await prisma.userFile.delete({ where: { id } })

    return NextResponse.json({ success: true, message: "Ficheiro eliminado" })
  } catch (error) {
    console.error("Error deleting file:", error)
    return NextResponse.json({ error: "Erro ao eliminar ficheiro" }, { status: 500 })
  }
}
