import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { hasPermission, PERMISSIONS } from "@/lib/permissions"
import { UserRole } from "@prisma/client"

type RouteParams = { params: Promise<{ id: string }> }

// POST /api/clientes/[id]/transfer - Transfer client to another seller
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
    }

    const role = session.user.role as UserRole
    const canManageAll = hasPermission(role, PERMISSIONS.MANAGE_USERS)
    const canManageSellers = hasPermission(role, PERMISSIONS.MANAGE_SELLERS)

    // Only ADMIN+ can transfer clients
    if (!canManageAll && !canManageSellers) {
      return NextResponse.json({ error: "Sem permissao para transferir clientes" }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { newSellerId } = body

    if (!newSellerId) {
      return NextResponse.json({ error: "Novo vendedor e obrigatorio" }, { status: 400 })
    }

    // Check client exists
    const cliente = await prisma.cliente.findUnique({
      where: { id },
      select: { id: true, nome: true, userId: true }
    })

    if (!cliente) {
      return NextResponse.json({ error: "Cliente nao encontrado" }, { status: 404 })
    }

    // Check new seller exists and is active
    const newSeller = await prisma.user.findUnique({
      where: { id: newSellerId },
      select: { id: true, name: true, email: true, role: true, status: true }
    })

    if (!newSeller) {
      return NextResponse.json({ error: "Vendedor nao encontrado" }, { status: 404 })
    }

    if (newSeller.status !== "ACTIVE") {
      return NextResponse.json({ error: "Vendedor nao esta ativo" }, { status: 400 })
    }

    // ADMIN can only transfer to SELLER accounts
    if (!canManageAll && newSeller.role !== "SELLER") {
      return NextResponse.json({ error: "Apenas pode transferir para vendedores" }, { status: 403 })
    }

    // Transfer client and all related data
    await prisma.$transaction([
      // Update cliente owner
      prisma.cliente.update({
        where: { id },
        data: { userId: newSellerId }
      }),
      // Update all prospectos linked to this client (if any via phone/email match)
      // Note: Prospectos are separate entities, not directly linked
      // Update tarefas related to this client
      prisma.tarefa.updateMany({
        where: { clienteId: id },
        data: { userId: newSellerId }
      }),
      // Update orcamentos related to this client
      prisma.orcamento.updateMany({
        where: { clienteId: id },
        data: { userId: newSellerId }
      }),
      // Update amostras related to this client
      prisma.amostra.updateMany({
        where: { clienteId: id },
        data: { userId: newSellerId }
      }),
    ])

    return NextResponse.json({
      success: true,
      message: `Cliente ${cliente.nome} transferido para ${newSeller.name || newSeller.email}`,
      cliente: { id: cliente.id, nome: cliente.nome },
      newSeller: { id: newSeller.id, name: newSeller.name, email: newSeller.email }
    })
  } catch (error) {
    console.error("Error transferring client:", error)
    return NextResponse.json({ error: "Erro ao transferir cliente" }, { status: 500 })
  }
}
