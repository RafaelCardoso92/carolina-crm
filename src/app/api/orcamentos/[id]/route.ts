import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requirePermission, userScopedWhere } from "@/lib/api-auth"
import { PERMISSIONS } from "@/lib/permissions"

type RouteParams = { params: Promise<{ id: string }> }

// GET - Get single quotation
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requirePermission(PERMISSIONS.ORCAMENTOS_READ)
    const { id } = await params

    const orcamento = await prisma.orcamento.findFirst({
      where: {
        id,
        ...userScopedWhere(session)
      },
      include: {
        prospecto: { select: { id: true, nomeEmpresa: true, email: true, telefone: true, morada: true } },
        cliente: { select: { id: true, nome: true, email: true, telefone: true, morada: true } },
        itens: {
          include: { produto: { select: { id: true, nome: true, codigo: true } } },
          orderBy: { ordem: "asc" }
        }
      }
    })

    if (!orcamento) {
      return NextResponse.json({ error: "Orçamento não encontrado" }, { status: 404 })
    }

    return NextResponse.json(orcamento)
  } catch (error) {
    if (error instanceof NextResponse) return error
    console.error("Error fetching orcamento:", error)
    return NextResponse.json({ error: "Erro ao carregar orcamento" }, { status: 500 })
  }
}

// PATCH - Update quotation status or details
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requirePermission(PERMISSIONS.ORCAMENTOS_WRITE)
    const { id } = await params
    const body = await request.json()

    // Verify ownership
    const existing = await prisma.orcamento.findFirst({
      where: {
        id,
        ...userScopedWhere(session)
      }
    })

    if (!existing) {
      return NextResponse.json({ error: "Orçamento não encontrado" }, { status: 404 })
    }

    const { estado, titulo, introducao, condicoes, validadeDias } = body

    const updateData: Record<string, unknown> = {}
    if (estado) updateData.estado = estado
    if (titulo !== undefined) updateData.titulo = titulo
    if (introducao !== undefined) updateData.introducao = introducao
    if (condicoes !== undefined) updateData.condicoes = condicoes
    if (validadeDias !== undefined) {
      updateData.validadeDias = validadeDias
      const dataValidade = new Date(existing.dataEmissao)
      dataValidade.setDate(dataValidade.getDate() + validadeDias)
      updateData.dataValidade = dataValidade
    }

    const orcamento = await prisma.orcamento.update({
      where: { id },
      data: updateData,
      include: {
        prospecto: { select: { id: true, nomeEmpresa: true } },
        cliente: { select: { id: true, nome: true } },
        itens: { include: { produto: true }, orderBy: { ordem: "asc" } }
      }
    })

    return NextResponse.json(orcamento)
  } catch (error) {
    if (error instanceof NextResponse) return error
    console.error("Error updating orcamento:", error)
    return NextResponse.json({ error: "Erro ao atualizar orcamento" }, { status: 500 })
  }
}

// DELETE - Delete quotation
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requirePermission(PERMISSIONS.ORCAMENTOS_WRITE)
    const { id } = await params

    // Verify ownership
    const existing = await prisma.orcamento.findFirst({
      where: {
        id,
        ...userScopedWhere(session)
      }
    })

    if (!existing) {
      return NextResponse.json({ error: "Orçamento não encontrado" }, { status: 404 })
    }

    await prisma.orcamento.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof NextResponse) return error
    console.error("Error deleting orcamento:", error)
    return NextResponse.json({ error: "Erro ao eliminar orçamento" }, { status: 500 })
  }
}
