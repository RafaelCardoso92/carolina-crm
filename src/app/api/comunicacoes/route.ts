import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - List communications
export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const clienteId = searchParams.get("clienteId")
    const prospectoId = searchParams.get("prospectoId")
    const limit = parseInt(searchParams.get("limit") || "50")

    const where: Record<string, unknown> = {}

    if (clienteId) where.clienteId = clienteId
    if (prospectoId) where.prospectoId = prospectoId

    const comunicacoes = await prisma.comunicacao.findMany({
      where,
      include: {
        cliente: { select: { id: true, nome: true, codigo: true } },
        prospecto: { select: { id: true, nomeEmpresa: true } }
      },
      orderBy: { dataContacto: "desc" },
      take: limit
    })

    return NextResponse.json(comunicacoes)
  } catch (error) {
    console.error("Error fetching comunicacoes:", error)
    return NextResponse.json({ error: "Erro ao carregar comunicacoes" }, { status: 500 })
  }
}

// POST - Create communication
export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { clienteId, prospectoId, tipo, assunto, notas, dataContacto, duracao } = body

    if (!clienteId && !prospectoId) {
      return NextResponse.json({ error: "Cliente ou Prospecto e obrigatorio" }, { status: 400 })
    }

    const comunicacao = await prisma.comunicacao.create({
      data: {
        clienteId: clienteId || null,
        prospectoId: prospectoId || null,
        tipo,
        assunto,
        notas,
        dataContacto: dataContacto ? new Date(dataContacto) : new Date(),
        duracao: duracao ? parseInt(duracao) : null
      },
      include: {
        cliente: { select: { id: true, nome: true } },
        prospecto: { select: { id: true, nomeEmpresa: true } }
      }
    })

    // Update ultimoContacto on cliente
    if (clienteId) {
      await prisma.cliente.update({
        where: { id: clienteId },
        data: { ultimoContacto: new Date() }
      })
    }

    return NextResponse.json(comunicacao, { status: 201 })
  } catch (error) {
    console.error("Error creating comunicacao:", error)
    return NextResponse.json({ error: "Erro ao criar comunicacao" }, { status: 500 })
  }
}
