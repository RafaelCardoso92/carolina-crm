import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/api-auth"
import { PERMISSIONS } from "@/lib/permissions"
import bcrypt from "bcryptjs"
import { UserRole, UserStatus } from "@prisma/client"

// GET /api/admin/users - List all users
export async function GET() {
  try {
    const session = await requirePermission(PERMISSIONS.MANAGE_USERS)

    const users = await prisma.user.findMany({
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
    if (error instanceof NextResponse) {
      return error
    }
    console.error("Error fetching users:", error)
    return NextResponse.json(
      { error: "Erro ao buscar usuários" },
      { status: 500 }
    )
  }
}

// POST /api/admin/users - Create new user
export async function POST(request: Request) {
  try {
    const session = await requirePermission(PERMISSIONS.MANAGE_USERS)

    const body = await request.json()
    const { name, email, password, role } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email e senha são obrigatórios" },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Email já está em uso" },
        { status: 400 }
      )
    }

    // Validate role
    const validRoles: UserRole[] = ["MASTERADMIN", "ADMIN", "SELLER"]
    if (role && !validRoles.includes(role)) {
      return NextResponse.json(
        { error: "Cargo inválido" },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || "SELLER",
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
    if (error instanceof NextResponse) {
      return error
    }
    console.error("Error creating user:", error)
    return NextResponse.json(
      { error: "Erro ao criar usuário" },
      { status: 500 }
    )
  }
}
