import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { userScopedWhere, isAdminOrHigher } from "@/lib/permissions"

const DEFAULT_VALUES: Record<string, number> = {
  HOTEL: 70,
  COMBUSTIVEL: 0,
  GLP: 0,
  ESTACIONAMENTO: 0,
  PORTAGENS: 0,
  RESTAURANTE: 0,
  OUTRO: 0
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const mes = parseInt(searchParams.get("mes") || new Date().getMonth().toString()) + 1
    const ano = parseInt(searchParams.get("ano") || new Date().getFullYear().toString())
    const seller = searchParams.get("seller")

    const userFilter = userScopedWhere(session, seller)

    const despesas = await prisma.despesa.findMany({
      where: {
        ...userFilter,
        mes,
        ano
      },
      include: {
        imagens: true,
        user: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { data: "desc" }
    })

    // Serialize Decimal values
    const serialized = despesas.map(d => ({
      ...d,
      valor: Number(d.valor)
    }))

    return NextResponse.json(serialized)
  } catch (error) {
    console.error("Error fetching despesas:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { tipo, valor, data, descricao } = body

    if (!tipo || !data) {
      return NextResponse.json({ error: "Tipo e data são obrigatórios" }, { status: 400 })
    }

    const dataObj = new Date(data)
    const mes = dataObj.getMonth() + 1
    const ano = dataObj.getFullYear()

    // Use default value if not provided
    const valorFinal = valor !== undefined && valor !== null && valor !== "" 
      ? parseFloat(valor) 
      : DEFAULT_VALUES[tipo] || 0

    const despesa = await prisma.despesa.create({
      data: {
        userId: session.user.id,
        tipo,
        valor: valorFinal,
        data: dataObj,
        descricao: descricao || null,
        mes,
        ano
      },
      include: {
        imagens: true,
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    return NextResponse.json({
      ...despesa,
      valor: Number(despesa.valor)
    })
  } catch (error) {
    console.error("Error creating despesa:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
