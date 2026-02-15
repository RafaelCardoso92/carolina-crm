import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { PERMISSIONS, hasPermission } from "@/lib/permissions"
import bcrypt from "bcryptjs"
import { UserRole, UserStatus } from "@prisma/client"

type RouteParams = { params: Promise<{ id: string }> }

// GET /api/admin/users/[id] - Get user details
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const role = session.user.role as UserRole
    const canManageAll = hasPermission(role, PERMISSIONS.MANAGE_USERS)
    const canManageSellers = hasPermission(role, PERMISSIONS.MANAGE_SELLERS)

    if (!canManageAll && !canManageSellers) {
      return NextResponse.json({ error: "Sem permissao" }, { status: 403 })
    }

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
        { error: "Utilizador não encontrado" },
        { status: 404 }
      )
    }

    // ADMIN cannot view ADMIN or MASTERADMIN accounts
    if (!canManageAll && user.role !== "SELLER") {
      return NextResponse.json({ error: "Sem permissao" }, { status: 403 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json(
      { error: "Erro ao buscar usuario" },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/users/[id] - Update user
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const currentRole = session.user.role as UserRole
    const canManageAll = hasPermission(currentRole, PERMISSIONS.MANAGE_USERS)
    const canManageSellers = hasPermission(currentRole, PERMISSIONS.MANAGE_SELLERS)

    if (!canManageAll && !canManageSellers) {
      return NextResponse.json({ error: "Sem permissao" }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, email, password, role, status } = body

    // Check user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: "Utilizador não encontrado" },
        { status: 404 }
      )
    }

    // ADMIN cannot edit ADMIN or MASTERADMIN accounts
    if (!canManageAll && existingUser.role !== "SELLER") {
      return NextResponse.json(
        { error: "Sem permissao para editar este usuario" },
        { status: 403 }
      )
    }

    // ADMIN cannot promote users to ADMIN or MASTERADMIN
    if (!canManageAll && role && role !== "SELLER") {
      return NextResponse.json(
        { error: "Apenas pode definir cargo de Vendedor" },
        { status: 403 }
      )
    }

    // If changing email, check its not already in use
    if (email && email !== existingUser.email) {
      const emailInUse = await prisma.user.findUnique({
        where: { email }
      })
      if (emailInUse) {
        return NextResponse.json(
          { error: "Email ja esta em uso" },
          { status: 400 }
        )
      }
    }

    // Validate role
    const validRoles: UserRole[] = ["MASTERADMIN", "ADMIN", "SELLER"]
    if (role && !validRoles.includes(role)) {
      return NextResponse.json(
        { error: "Cargo invalido" },
        { status: 400 }
      )
    }

    // Validate status
    const validStatuses: UserStatus[] = ["ACTIVE", "INACTIVE", "PENDING"]
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Status invalido" },
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
    console.error("Error updating user:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar usuario" },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/users/[id] - Deactivate user (soft delete)
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const currentRole = session.user.role as UserRole
    const canManageAll = hasPermission(currentRole, PERMISSIONS.MANAGE_USERS)
    const canManageSellers = hasPermission(currentRole, PERMISSIONS.MANAGE_SELLERS)

    if (!canManageAll && !canManageSellers) {
      return NextResponse.json({ error: "Sem permissao" }, { status: 403 })
    }

    const { id } = await params

    // Prevent self-deletion
    if (id === session.user.id) {
      return NextResponse.json(
        { error: "Nao pode desativar a propria conta" },
        { status: 400 }
      )
    }

    // Check user exists and get their role
    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: { role: true }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: "Utilizador não encontrado" },
        { status: 404 }
      )
    }

    // ADMIN cannot deactivate ADMIN or MASTERADMIN accounts
    if (!canManageAll && existingUser.role !== "SELLER") {
      return NextResponse.json(
        { error: "Sem permissao para desativar este usuario" },
        { status: 403 }
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
    console.error("Error deactivating user:", error)
    return NextResponse.json(
      { error: "Erro ao desativar usuario" },
      { status: 500 }
    )
  }
}
