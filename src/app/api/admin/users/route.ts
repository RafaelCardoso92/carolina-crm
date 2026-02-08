import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { PERMISSIONS, hasPermission } from "@/lib/permissions"
import bcrypt from "bcryptjs"
import { UserRole, UserStatus } from "@prisma/client"

// GET /api/admin/users - List users (filtered by role permissions)
export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
    }

    const role = session.user.role as UserRole
    const canManageAll = hasPermission(role, PERMISSIONS.MANAGE_USERS)
    const canManageSellers = hasPermission(role, PERMISSIONS.MANAGE_SELLERS)

    if (!canManageAll && !canManageSellers) {
      return NextResponse.json({ error: "Sem permissao" }, { status: 403 })
    }

    // ADMIN can only see SELLER accounts, MASTERADMIN sees all
    const whereClause = canManageAll ? {} : { role: "SELLER" as UserRole }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
        _count: {
          select: {
            clientes: true,
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json(
      { error: "Erro ao buscar usuarios" },
      { status: 500 }
    )
  }
}

// POST /api/admin/users - Create new user
export async function POST(request: Request) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
    }

    const role = session.user.role as UserRole
    const canManageAll = hasPermission(role, PERMISSIONS.MANAGE_USERS)
    const canManageSellers = hasPermission(role, PERMISSIONS.MANAGE_SELLERS)

    if (!canManageAll && !canManageSellers) {
      return NextResponse.json({ error: "Sem permissao" }, { status: 403 })
    }

    const body = await request.json()
    const { name, email, password, role: newUserRole } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email e senha sao obrigatorios" },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Email ja esta em uso" },
        { status: 400 }
      )
    }

    // Validate role - ADMIN can only create SELLER accounts
    const validRoles: UserRole[] = ["MASTERADMIN", "ADMIN", "SELLER"]
    if (newUserRole && !validRoles.includes(newUserRole)) {
      return NextResponse.json(
        { error: "Cargo invalido" },
        { status: 400 }
      )
    }

    // ADMIN cannot create ADMIN or MASTERADMIN accounts
    if (!canManageAll && newUserRole && newUserRole !== "SELLER") {
      return NextResponse.json(
        { error: "Apenas pode criar contas de Vendedor" },
        { status: 403 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: newUserRole || "SELLER",
        status: "ACTIVE"
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true
      }
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json(
      { error: "Erro ao criar usuario" },
      { status: 500 }
    )
  }
}
