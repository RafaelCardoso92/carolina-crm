import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { requirePermission, userScopedWhere } from "@/lib/api-auth"
import { PERMISSIONS } from "@/lib/permissions"

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await requirePermission(PERMISSIONS.CLIENTES_READ)
    const { id } = await params

    const cliente = await prisma.cliente.findFirst({
      where: {
        id,
        ...userScopedWhere(session)
      },
      include: {
        vendas: {
          include: {
            itens: {
              include: { produto: true }
            }
          },
          orderBy: { createdAt: "desc" },
          take: 10
        },
        
        cobrancas: true
      }
    })

    if (!cliente) {
      return NextResponse.json({ error: "Cliente nao encontrado" }, { status: 404 })
    }

    return NextResponse.json(cliente)
  } catch (error) {
    if (error instanceof NextResponse) {
      return error
    }
    console.error("Error fetching cliente:", error)
    return NextResponse.json({ error: "Erro ao buscar cliente" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await requirePermission(PERMISSIONS.CLIENTES_WRITE)
    const { id } = await params
    const data = await request.json()

    if (!data.nome) {
      return NextResponse.json({ error: "Nome e obrigatorio" }, { status: 400 })
    }

    // Verify client belongs to user
    const existing = await prisma.cliente.findFirst({
      where: {
        id,
        ...userScopedWhere(session)
      }
    })

    if (!existing) {
      return NextResponse.json({ error: "Cliente nao encontrado" }, { status: 404 })
    }

    // Check if codigo already exists for another client
    if (data.codigo) {
      const codigoExists = await prisma.cliente.findFirst({
        where: {
          codigo: data.codigo,
          NOT: { id }
        }
      })
      if (codigoExists) {
        return NextResponse.json({ error: "Ja existe um cliente com este codigo" }, { status: 400 })
      }
    }

    const cliente = await prisma.cliente.update({
      where: { id },
      data: {
        nome: data.nome,
        codigo: data.codigo || null,
        telefone: data.telefone || null,
        email: data.email || null,
        morada: data.morada || null,
        notas: data.notas || null
      }
    })

    return NextResponse.json(cliente)
  } catch (error) {
    if (error instanceof NextResponse) {
      return error
    }
    console.error("Error updating cliente:", error)
    return NextResponse.json({ error: "Erro ao atualizar cliente" }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await requirePermission(PERMISSIONS.CLIENTES_WRITE)
    const { id } = await params
    const data = await request.json()

    // Verify client belongs to user
    const existing = await prisma.cliente.findFirst({
      where: {
        id,
        ...userScopedWhere(session)
      }
    })

    if (!existing) {
      return NextResponse.json({ error: "Cliente nao encontrado" }, { status: 404 })
    }

    const cliente = await prisma.cliente.update({
      where: { id },
      data
    })

    return NextResponse.json(cliente)
  } catch (error) {
    if (error instanceof NextResponse) {
      return error
    }
    console.error("Error patching cliente:", error)
    return NextResponse.json({ error: "Erro ao atualizar cliente" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await requirePermission(PERMISSIONS.CLIENTES_WRITE)
    const { id } = await params

    // Verify client belongs to user
    const existing = await prisma.cliente.findFirst({
      where: {
        id,
        ...userScopedWhere(session)
      }
    })

    if (!existing) {
      return NextResponse.json({ error: "Cliente nao encontrado" }, { status: 404 })
    }

    await prisma.cliente.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof NextResponse) {
      return error
    }
    console.error("Error deleting cliente:", error)
    return NextResponse.json({ error: "Erro ao eliminar cliente" }, { status: 500 })
  }
}
