import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isAdminOrHigher } from "@/lib/permissions"

// GET /api/messages - Get messages for current user
export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get("unread") === "true"
    const entityType = searchParams.get("entityType")
    const entityId = searchParams.get("entityId")

    const where: any = {
      OR: [
        { recipientId: session.user.id },
        { senderId: session.user.id }
      ],
      parentId: null // Only get root messages, not replies
    }

    if (unreadOnly) {
      where.recipientId = session.user.id
      where.read = false
      delete where.OR
    }

    if (entityType && entityId) {
      where.entityType = entityType
      where.entityId = entityId
    }

    const messages = await prisma.message.findMany({
      where,
      include: {
        sender: { select: { id: true, name: true, email: true } },
        recipient: { select: { id: true, name: true, email: true } },
        replies: {
          include: {
            sender: { select: { id: true, name: true, email: true } }
          },
          orderBy: { createdAt: "asc" }
        },
        _count: { select: { replies: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 100
    })

    return NextResponse.json(messages)
  } catch (error) {
    console.error("Error fetching messages:", error)
    return NextResponse.json({ error: "Erro ao buscar mensagens" }, { status: 500 })
  }
}

// POST /api/messages - Send a new message
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { recipientId, content, entityType, entityId, entityName, priority, flagged, parentId } = body

    if (!recipientId || !content) {
      return NextResponse.json({ error: "Destinatario e conteudo sao obrigatorios" }, { status: 400 })
    }

    // Only ADMIN+ can flag messages
    const canFlag = isAdminOrHigher(session.user.role)
    
    // Verify recipient exists
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
      select: { id: true, name: true, status: true }
    })

    if (!recipient || recipient.status !== "ACTIVE") {
      return NextResponse.json({ error: "Destinatario nao encontrado ou inativo" }, { status: 404 })
    }

    const message = await prisma.message.create({
      data: {
        senderId: session.user.id,
        recipientId,
        content,
        entityType: entityType || "GERAL",
        entityId: entityId || null,
        entityName: entityName || null,
        priority: priority || "NORMAL",
        flagged: canFlag ? (flagged || false) : false,
        parentId: parentId || null,
        updatedAt: new Date()
      },
      include: {
        sender: { select: { id: true, name: true, email: true } },
        recipient: { select: { id: true, name: true, email: true } }
      }
    })

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error("Error sending message:", error)
    return NextResponse.json({ error: "Erro ao enviar mensagem" }, { status: 500 })
  }
}
