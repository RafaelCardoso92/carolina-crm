import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/api-auth"
import { PERMISSIONS } from "@/lib/permissions"
import bcrypt from "bcryptjs"
import { UserRole, UserStatus } from "@prisma/client"

type RouteParams = { params: Promise<{ id: string }> }

// GET /api/admin/users/[id] - Get user details
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await requirePermission(PERMISSIONS.MANAGE_USERS)
    const { id } = await params

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            clientes: true,
            prospectos: true,
            tarefas: true,
            orcamentos: true,
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
  } catch (error) {
    if (error instanceof NextResponse) {
      return error
    }
    console.error("Error fetching user:", error)
    return NextResponse.json(
      { error: "Erro ao buscar usuário" },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/users/[id] - Update user
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await requirePermission(PERMISSIONS.MANAGE_USERS)
    const { id } = await params

    const body = await request.json()
    const { name, email, password, role, status } = body

    // Check user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      )
    }

    // If changing email, check it's not already in use
    if (email && email !== existingUser.email) {
      const emailInUse = await prisma.user.findUnique({
        where: { email }
      })
      if (emailInUse) {
        return NextResponse.json(
          { error: "Email já está em uso" },
          { status: 400 }
        )
      }
    }

    // Validate role
    const validRoles: UserRole[] = ["MASTERADMIN", "ADMIN", "SELLER"]
    if (role && !validRoles.includes(role)) {
      return NextResponse.json(
        { error: "Cargo inválido" },
        { status: 400 }
      )
    }

    // Validate status
    const validStatuses: UserStatus[] = ["ACTIVE", "INACTIVE", "PENDING"]
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Status inválido" },
        { status: 400 }
      )
    }

    // Build update data
    const updateData: {
      name?: string
      email?: string
      password?: string
      role?: UserRole
      status?: UserStatus
    } = {}

    if (name !== undefined) updateData.name = name
    if (email !== undefined) updateData.email = email
    if (role !== undefined) updateData.role = role
    if (status !== undefined) updateData.status = status

    // Hash new password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 10)
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json(user)
  } catch (error) {
    if (error instanceof NextResponse) {
      return error
    }
    console.error("Error updating user:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar usuário" },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/users/[id] - Deactivate user (soft delete)
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await requirePermission(PERMISSIONS.MANAGE_USERS)
    const { id } = await params

    // Prevent self-deletion
    if (id === session.user.id) {
      return NextResponse.json(
        { error: "Não pode desativar a própria conta" },
        { status: 400 }
      )
    }

    const user = await prisma.user.update({
      where: { id },
      data: { status: "INACTIVE" },
      select: {
        id: true,
        name: true,
        email: true,
        status: true
      }
    })

    return NextResponse.json(user)
  } catch (error) {
    if (error instanceof NextResponse) {
      return error
    }
    console.error("Error deactivating user:", error)
    return NextResponse.json(
      { error: "Erro ao desativar usuário" },
      { status: 500 }
    )
  }
}
