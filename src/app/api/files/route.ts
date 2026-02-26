import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getEffectiveUserId } from "@/lib/permissions"
import { writeFile, mkdir, unlink } from "fs/promises"
import { existsSync } from "fs"
import path from "path"
import crypto from "crypto"

const UPLOAD_DIR = process.env.UPLOAD_DIR || "/app/uploads"
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true })
  }
}

// GET - List files (ALWAYS user-scoped - ficheiros is personal storage)
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Files are ALWAYS scoped to the effective user (personal storage)
    // Even admins only see their own files here
    const userId = getEffectiveUserId(session)

    const files = await prisma.userFile.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json({ files })
  } catch (error) {
    console.error("Error listing files:", error)
    return NextResponse.json({ error: "Erro ao listar ficheiros" }, { status: 500 })
  }
}

// POST - Upload file(s)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await ensureUploadDir()

    const formData = await request.formData()
    const files = formData.getAll("files") as File[]
    const overwrite = formData.get("overwrite") === "true"
    const userId = getEffectiveUserId(session)

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "Nenhum ficheiro enviado" }, { status: 400 })
    }

    const uploadedFiles = []

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ 
          error: `Ficheiro ${file.name} excede o limite de 50MB`
        }, { status: 400 })
      }

      const existingFile = await prisma.userFile.findFirst({
        where: {
          userId,
          filename: file.name
        }
      })

      if (existingFile) {
        if (!overwrite) {
          return NextResponse.json({
            error: "duplicate",
            duplicates: [file.name],
            message: `Ficheiro "${file.name}" ja existe`
          }, { status: 409 })
        }

        const existingPath = path.join(UPLOAD_DIR, existingFile.storedName)
        try {
          if (existsSync(existingPath)) {
            await unlink(existingPath)
          }
        } catch (e) {
          console.error("Error deleting old file:", e)
        }
        await prisma.userFile.delete({ where: { id: existingFile.id } })
      }

      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      const uuid = crypto.randomUUID()
      const storedName = `${uuid}-${file.name}`
      const filePath = path.join(UPLOAD_DIR, storedName)

      await writeFile(filePath, buffer)

      const savedFile = await prisma.userFile.create({
        data: {
          userId,
          filename: file.name,
          storedName,
          mimeType: file.type || getMimeType(file.name),
          size: file.size
        }
      })

      uploadedFiles.push(savedFile)
    }

    return NextResponse.json({ 
      success: true, 
      files: uploadedFiles,
      message: `${uploadedFiles.length} ficheiro(s) carregado(s) com sucesso`
    })
  } catch (error) {
    console.error("Error uploading files:", error)
    return NextResponse.json({ error: "Erro ao carregar ficheiros" }, { status: 500 })
  }
}

function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase()
  const mimeTypes: Record<string, string> = {
    ".pdf": "application/pdf",
    ".doc": "application/msword",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".xls": "application/vnd.ms-excel",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".ppt": "application/vnd.ms-powerpoint",
    ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ".txt": "text/plain",
    ".csv": "text/csv",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".zip": "application/zip",
    ".rar": "application/x-rar-compressed",
    ".7z": "application/x-7z-compressed",
    ".mp3": "audio/mpeg",
    ".mp4": "video/mp4",
    ".json": "application/json",
    ".xml": "application/xml",
    ".html": "text/html",
    ".css": "text/css",
    ".js": "application/javascript",
  }
  return mimeTypes[ext] || "application/octet-stream"
}
