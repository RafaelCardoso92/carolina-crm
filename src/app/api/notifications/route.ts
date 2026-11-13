import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"
import type { Session } from "next-auth"
import { userScopedWhere, isAdminOrHigher } from "@/lib/permissions"

// Notificacao has no userId: a seller sees notifications whose cliente/prospecto/tarefa/parcela is theirs.
// Admins (not impersonating, no seller filter) see all.
async function notificacaoScope(session: Session): Promise<Prisma.NotificacaoWhereInput> {
  const { userId } = userScopedWhere(session)
  if (!userId) return {}
  const sel = { where: { userId }, select: { id: true } }
  const [clientes, prospectos, tarefas, parcelas] = await Promise.all([
    prisma.cliente.findMany(sel),
    prisma.prospecto.findMany(sel),
    prisma.tarefa.findMany(sel),
    prisma.parcela.findMany({ where: { cobranca: { cliente: { userId } } }, select: { id: true } })
  ])
  const ids = (rows: { id: string }[]) => rows.map(r => r.id)
  return {
    OR: [
      { clienteId: { in: ids(clientes) } },
      { prospectoId: { in: ids(prospectos) } },
      { tarefaId: { in: ids(tarefas) } },
      { parcelaId: { in: ids(parcelas) } }
    ]
  }
}

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get("unread") === "true"
    const limit = parseInt(searchParams.get("limit") || "20")

    const scope = await notificacaoScope(session)
    const notifications = await prisma.notificacao.findMany({
      where: unreadOnly ? { ...scope, lida: false } : scope,
      orderBy: { createdAt: "desc" },
      take: limit
    })

    const unreadCount = await prisma.notificacao.count({
      where: { ...scope, lida: false }
    })

    return NextResponse.json({ notifications, unreadCount })
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return NextResponse.json({ error: "Erro ao carregar notificacoes" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }
  // Notifications have no owner: only admins may create them by hand (UI does not use this)
  if (!isAdminOrHigher(session.user.role)) {
    return NextResponse.json({ error: "Sem permissão para criar notificações" }, { status: 403 })
  }

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
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { id, markAllRead } = body

    const scope = await notificacaoScope(session)

    if (markAllRead) {
      await prisma.notificacao.updateMany({
        where: { ...scope, lida: false },
        data: { lida: true, readAt: new Date() }
      })
      return NextResponse.json({ success: true })
    }

    if (id) {
      const { count } = await prisma.notificacao.updateMany({
        where: { ...scope, id },
        data: { lida: true, readAt: new Date() }
      })
      if (count === 0) {
        return NextResponse.json({ error: "Notificacao nao encontrada" }, { status: 404 })
      }
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "ID ou markAllRead necessario" }, { status: 400 })
  } catch (error) {
    console.error("Error updating notification:", error)
    return NextResponse.json({ error: "Erro ao atualizar notificacao" }, { status: 500 })
  }
}
