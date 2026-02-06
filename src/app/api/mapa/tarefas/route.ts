import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// Get today's tasks with location data
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get today's date range
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

    // Get tasks for today with client/prospect location
    const tarefas = await prisma.tarefa.findMany({
      where: {
        userId: session.user.id,
        estado: { not: "CONCLUIDA" },
        dataVencimento: {
          gte: startOfDay,
          lt: endOfDay,
        },
        OR: [
          { clienteId: { not: null } },
          { prospectoId: { not: null } },
        ],
      },
      include: {
        cliente: {
          select: {
            id: true,
            nome: true,
            latitude: true,
            longitude: true,
            cidade: true,
            telefone: true,
          },
        },
        prospecto: {
          select: {
            id: true,
            nomeEmpresa: true,
            latitude: true,
            longitude: true,
            cidade: true,
            telefone: true,
          },
        },
      },
      orderBy: { dataVencimento: "asc" },
    })

    // Also get overdue tasks with locations
    const overdueTarefas = await prisma.tarefa.findMany({
      where: {
        userId: session.user.id,
        estado: { not: "CONCLUIDA" },
        dataVencimento: { lt: startOfDay },
        OR: [
          { clienteId: { not: null } },
          { prospectoId: { not: null } },
        ],
      },
      include: {
        cliente: {
          select: {
            id: true,
            nome: true,
            latitude: true,
            longitude: true,
            cidade: true,
            telefone: true,
          },
        },
        prospecto: {
          select: {
            id: true,
            nomeEmpresa: true,
            latitude: true,
            longitude: true,
            cidade: true,
            telefone: true,
          },
        },
      },
      orderBy: { dataVencimento: "asc" },
    })

    // Format for map display
    const todayTasks = tarefas
      .filter((t) => (t.cliente?.latitude && t.cliente?.longitude) || (t.prospecto?.latitude && t.prospecto?.longitude))
      .map((t) => ({
        id: t.id,
        titulo: t.titulo,
        tipo: t.tipo,
        prioridade: t.prioridade,
        dataVencimento: t.dataVencimento,
        locationId: t.clienteId || t.prospectoId,
        locationType: t.clienteId ? "cliente" : "prospecto",
        locationName: t.cliente?.nome || t.prospecto?.nomeEmpresa,
        latitude: t.cliente?.latitude || t.prospecto?.latitude,
        longitude: t.cliente?.longitude || t.prospecto?.longitude,
        cidade: t.cliente?.cidade || t.prospecto?.cidade,
        telefone: t.cliente?.telefone || t.prospecto?.telefone,
        isOverdue: false,
      }))

    const overdueTasks = overdueTarefas
      .filter((t) => (t.cliente?.latitude && t.cliente?.longitude) || (t.prospecto?.latitude && t.prospecto?.longitude))
      .map((t) => ({
        id: t.id,
        titulo: t.titulo,
        tipo: t.tipo,
        prioridade: t.prioridade,
        dataVencimento: t.dataVencimento,
        locationId: t.clienteId || t.prospectoId,
        locationType: t.clienteId ? "cliente" : "prospecto",
        locationName: t.cliente?.nome || t.prospecto?.nomeEmpresa,
        latitude: t.cliente?.latitude || t.prospecto?.latitude,
        longitude: t.cliente?.longitude || t.prospecto?.longitude,
        cidade: t.cliente?.cidade || t.prospecto?.cidade,
        telefone: t.cliente?.telefone || t.prospecto?.telefone,
        isOverdue: true,
      }))

    return NextResponse.json({
      today: todayTasks,
      overdue: overdueTasks,
      totalToday: todayTasks.length,
      totalOverdue: overdueTasks.length,
    })
  } catch (error) {
    console.error("Error fetching map tasks:", error)
    return NextResponse.json({ error: "Erro ao buscar tarefas" }, { status: 500 })
  }
}
