import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { requirePermission, userScopedWhere, getEffectiveUserId } from "@/lib/api-auth"
import { PERMISSIONS } from "@/lib/permissions"

// GET - List quotations
export async function GET(request: NextRequest) {
  try {
    const session = await requirePermission(PERMISSIONS.ORCAMENTOS_READ)

    const { searchParams } = new URL(request.url)
    const prospectoId = searchParams.get("prospectoId")
    const clienteId = searchParams.get("clienteId")
    const estado = searchParams.get("estado")

    const where: Record<string, unknown> = { ...userScopedWhere(session) }
    if (prospectoId) where.prospectoId = prospectoId
    if (clienteId) where.clienteId = clienteId
    if (estado) where.estado = estado

    const orcamentos = await prisma.orcamento.findMany({
      where,
      include: {
        prospecto: { select: { id: true, nomeEmpresa: true, email: true } },
        cliente: { select: { id: true, nome: true, email: true } },
        itens: {
          include: { produto: { select: { id: true, nome: true } } },
          orderBy: { ordem: "asc" }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json(orcamentos)
  } catch (error) {
    if (error instanceof NextResponse) return error
    console.error("Error fetching orcamentos:", error)
    return NextResponse.json({ error: "Erro ao carregar orcamentos" }, { status: 500 })
  }
}

// POST - Create quotation
export async function POST(request: NextRequest) {
  try {
    const session = await requirePermission(PERMISSIONS.ORCAMENTOS_WRITE)

    const body = await request.json()
    const { prospectoId, clienteId, titulo, introducao, condicoes, validadeDias, itens } = body

    if (!prospectoId && !clienteId) {
      return NextResponse.json({ error: "Prospecto ou Cliente e obrigatorio" }, { status: 400 })
    }

    // Generate quote number
    const year = new Date().getFullYear()
    const count = await prisma.orcamento.count({
      where: { numero: { startsWith: `ORC-${year}` } }
    })
    const numero = `ORC-${year}-${String(count + 1).padStart(3, "0")}`

    // Calculate totals
    const IVA_RATE = 0.23
    let subtotal = 0
    const processedItems = (itens || []).map((item: { produtoId?: string; descricao: string; quantidade: number; precoUnit: number; desconto?: number }, idx: number) => {
      const itemSubtotal = item.quantidade * item.precoUnit - (item.desconto || 0)
      subtotal += itemSubtotal
      return {
        produtoId: item.produtoId || null,
        descricao: item.descricao,
        quantidade: item.quantidade,
        precoUnit: item.precoUnit,
        desconto: item.desconto || 0,
        subtotal: itemSubtotal,
        ordem: idx
      }
    })

    const iva = subtotal * IVA_RATE
    const total = subtotal + iva
    const dataValidade = new Date()
    dataValidade.setDate(dataValidade.getDate() + (validadeDias || 30))

    const orcamento = await prisma.orcamento.create({
      data: {
        numero,
        userId: getEffectiveUserId(session),
        prospectoId: prospectoId || null,
        clienteId: clienteId || null,
        titulo,
        introducao,
        condicoes,
        validadeDias: validadeDias || 30,
        dataValidade,
        subtotal,
        desconto: 0,
        iva,
        total,
        itens: { create: processedItems }
      },
      include: {
        prospecto: { select: { id: true, nomeEmpresa: true } },
        cliente: { select: { id: true, nome: true } },
        itens: { include: { produto: true }, orderBy: { ordem: "asc" } }
      }
    })

    return NextResponse.json(orcamento, { status: 201 })
  } catch (error) {
    if (error instanceof NextResponse) return error
    console.error("Error creating orcamento:", error)
    return NextResponse.json({ error: "Erro ao criar orcamento" }, { status: 500 })
  }
}
