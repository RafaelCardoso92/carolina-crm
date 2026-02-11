import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isAdminOrHigher } from "@/lib/permissions"

type RouteParams = { params: Promise<{ id: string }> }

// GET /api/messages/[id] - Get a specific message with replies
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
    }

    const { id } = await params

    const message = await prisma.message.findUnique({
      where: { id },
      include: {
        sender: { select: { id: true, name: true, email: true } },
        recipient: { select: { id: true, name: true, email: true } },
        replies: {
          include: {
            sender: { select: { id: true, name: true, email: true } }
          },
          orderBy: { createdAt: "asc" }
        }
      }
    })

    if (!message) {
      return NextResponse.json({ error: "Mensagem nao encontrada" }, { status: 404 })
    }

    // Check user has access to this message
    if (message.senderId !== session.user.id && message.recipientId !== session.user.id) {
      return NextResponse.json({ error: "Sem permissao" }, { status: 403 })
    }

    return NextResponse.json(message)
  } catch (error) {
    console.error("Error fetching message:", error)
    return NextResponse.json({ error: "Erro ao buscar mensagem" }, { status: 500 })
  }
}

// PATCH /api/messages/[id] - Update message (mark as read, flag, etc.)
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { read, flagged } = body

    const message = await prisma.message.findUnique({
      where: { id },
      select: { senderId: true, recipientId: true }
    })

    if (!message) {
      return NextResponse.json({ error: "Mensagem nao encontrada" }, { status: 404 })
    }

    // Only recipient can mark as read
    if (read !== undefined && message.recipientId !== session.user.id) {
      return NextResponse.json({ error: "Apenas o destinatario pode marcar como lida" }, { status: 403 })
    }

    // Only ADMIN+ can flag messages
    if (flagged !== undefined && !isAdminOrHigher(session.user.role)) {
      return NextResponse.json({ error: "Apenas administradores podem sinalizar mensagens" }, { status: 403 })
    }

    const updateData: any = { updatedAt: new Date() }
    
    if (read !== undefined) {
      updateData.read = read
      updateData.readAt = read ? new Date() : null
    }
    
    if (flagged !== undefined) {
      updateData.flagged = flagged
    }

    const updated = await prisma.message.update({
      where: { id },
      data: updateData,
      include: {
        sender: { select: { id: true, name: true, email: true } },
        recipient: { select: { id: true, name: true, email: true } }
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating message:", error)
    return NextResponse.json({ error: "Erro ao atualizar mensagem" }, { status: 500 })
  }
}
