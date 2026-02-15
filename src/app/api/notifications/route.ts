import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get("unread") === "true"
    const limit = parseInt(searchParams.get("limit") || "20")

    const notifications = await prisma.notificacao.findMany({
      where: unreadOnly ? { lida: false } : {},
      orderBy: { createdAt: "desc" },
      take: limit
    })

    const unreadCount = await prisma.notificacao.count({
      where: { lida: false }
    })

    return NextResponse.json({ notifications, unreadCount })
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return NextResponse.json({ error: "Erro ao carregar notificacoes" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { tipo, titulo, mensagem, clienteId, prospectoId, tarefaId, parcelaId } = body

    const notification = await prisma.notificacao.create({
      data: {
        tipo,
        titulo,
        mensagem,
        clienteId,
        prospectoId,
        tarefaId,
        parcelaId
      }
    })

    return NextResponse.json(notification)
  } catch (error) {
    console.error("Error creating notification:", error)
    return NextResponse.json({ error: "Erro ao criar notificacao" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, markAllRead } = body

    if (markAllRead) {
      await prisma.notificacao.updateMany({
        where: { lida: false },
        data: { lida: true, readAt: new Date() }
      })
      return NextResponse.json({ success: true })
    }

    if (id) {
      await prisma.notificacao.update({
        where: { id },
        data: { lida: true, readAt: new Date() }
      })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "ID ou markAllRead necessario" }, { status: 400 })
  } catch (error) {
    console.error("Error updating notification:", error)
    return NextResponse.json({ error: "Erro ao atualizar notificacao" }, { status: 500 })
  }
}
