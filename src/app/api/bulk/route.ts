import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, ids, data } = body

    switch (action) {
      case "create-tasks": {
        // Bulk create tasks for multiple clients/prospects
        const { titulo, tipo, prioridade, dataVencimento, descricao, entityType } = data
        const tasks = []

        for (const id of ids) {
          tasks.push({
            titulo,
            tipo,
            prioridade: prioridade || "MEDIA",
            dataVencimento: dataVencimento ? new Date(dataVencimento) : null,
            descricao,
            clienteId: entityType === "cliente" ? id : null,
            prospectoId: entityType === "prospecto" ? id : null
          })
        }

        const created = await prisma.tarefa.createMany({
          data: tasks
        })

        return NextResponse.json({
          success: true,
          created: created.count,
          message: `${created.count} tarefas criadas`
        })
      }

      case "update-status": {
        // Bulk update prospect status
        const { estado } = data
        const updated = await prisma.prospecto.updateMany({
          where: { id: { in: ids } },
          data: { estado, updatedAt: new Date() }
        })

        return NextResponse.json({
          success: true,
          updated: updated.count,
          message: `${updated.count} prospectos atualizados`
        })
      }

      case "update-segment": {
        // Bulk update client segment
        const { segmento, tags } = data
        let updated = 0

        for (const clienteId of ids) {
          await prisma.clienteSegmento.upsert({
            where: { clienteId },
            update: {
              segmento,
              tags: tags || [],
              updatedAt: new Date()
            },
            create: {
              clienteId,
              segmento,
              tags: tags || []
            }
          })
          updated++
        }

        return NextResponse.json({
          success: true,
          updated,
          message: `${updated} clientes atualizados`
        })
      }

      case "log-communication": {
        // Bulk log communication for multiple clients/prospects
        const { tipo, assunto, notas, entityType } = data
        const communications = []

        for (const id of ids) {
          communications.push({
            tipo,
            assunto,
            notas,
            dataContacto: new Date(),
            clienteId: entityType === "cliente" ? id : null,
            prospectoId: entityType === "prospecto" ? id : null
          })
        }

        const created = await prisma.comunicacao.createMany({
          data: communications
        })

        // Update last contact date
        if (entityType === "cliente") {
          await prisma.cliente.updateMany({
            where: { id: { in: ids } },
            data: { ultimoContacto: new Date() }
          })
        } else if (entityType === "prospecto") {
          await prisma.prospecto.updateMany({
            where: { id: { in: ids } },
            data: { dataUltimoContacto: new Date() }
          })
        }

        return NextResponse.json({
          success: true,
          created: created.count,
          message: `${created.count} comunicacoes registadas`
        })
      }

      case "get-contacts": {
        // Get contact info for bulk messaging
        const { entityType } = data

        if (entityType === "cliente") {
          const clientes = await prisma.cliente.findMany({
            where: { id: { in: ids } },
            select: { id: true, nome: true, telefone: true, email: true }
          })
          return NextResponse.json({ contacts: clientes })
        } else {
          const prospectos = await prisma.prospecto.findMany({
            where: { id: { in: ids } },
            select: { id: true, nomeEmpresa: true, telefone: true, email: true }
          })
          return NextResponse.json({
            contacts: prospectos.map(p => ({
              id: p.id,
              nome: p.nomeEmpresa,
              telefone: p.telefone,
              email: p.email
            }))
          })
        }
      }

      case "mark-inactive": {
        // Bulk mark clients/prospects as inactive
        const { entityType } = data

        if (entityType === "cliente") {
          const updated = await prisma.cliente.updateMany({
            where: { id: { in: ids } },
            data: { ativo: false }
          })
          return NextResponse.json({
            success: true,
            updated: updated.count,
            message: `${updated.count} clientes marcados como inativos`
          })
        } else {
          const updated = await prisma.prospecto.updateMany({
            where: { id: { in: ids } },
            data: { ativo: false }
          })
          return NextResponse.json({
            success: true,
            updated: updated.count,
            message: `${updated.count} prospectos marcados como inativos`
          })
        }
      }

      default:
        return NextResponse.json({ error: "Accao desconhecida" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error in bulk operation:", error)
    return NextResponse.json({ error: "Erro na operacao em massa" }, { status: 500 })
  }
}
