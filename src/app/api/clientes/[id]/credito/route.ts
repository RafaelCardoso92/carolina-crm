import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { Prisma } from "@prisma/client"

// GET - Fetch client credit balance and history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: clienteId } = await params

    // Fetch client with credit balance
    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
      select: {
        id: true,
        nome: true,
        codigo: true,
        saldoCredito: true
      }
    })

    if (!cliente) {
      return NextResponse.json({ error: "Cliente not found" }, { status: 404 })
    }

    // Fetch credit movement history
    const movimentos = await prisma.movimentoCredito.findMany({
      where: { clienteId },
      orderBy: { createdAt: "desc" },
      take: 100
    })

    // Fetch related cobrancas for context (fatura numbers)
    const cobrancaIds = [...new Set(movimentos.map(m => m.cobrancaId).filter(Boolean))] as string[]
    const cobrancas = cobrancaIds.length > 0
      ? await prisma.cobranca.findMany({
          where: { id: { in: cobrancaIds } },
          select: { id: true, fatura: true, valor: true }
        })
      : []
    const cobrancaMap = Object.fromEntries(cobrancas.map(c => [c.id, { fatura: c.fatura, valor: c.valor.toNumber() }]))

    // Fetch related incidencias for context
    const incidenciaIds = [...new Set(movimentos.map(m => m.incidenciaId).filter(Boolean))] as string[]
    const incidencias = incidenciaIds.length > 0
      ? await prisma.incidencia.findMany({
          where: { id: { in: incidenciaIds } },
          select: { id: true, motivo: true, cobranca: { select: { fatura: true } } }
        })
      : []
    const incidenciaMap = Object.fromEntries(incidencias.map(i => [i.id, { motivo: i.motivo, fatura: i.cobranca?.fatura }]))

    return NextResponse.json({
      cliente: {
        id: cliente.id,
        nome: cliente.nome,
        codigo: cliente.codigo,
        saldoCredito: cliente.saldoCredito?.toNumber() || 0
      },
      movimentos: movimentos.map(m => ({
        id: m.id,
        tipo: m.tipo,
        valor: m.valor.toNumber(),
        saldoAnterior: m.saldoAnterior.toNumber(),
        saldoNovo: m.saldoNovo.toNumber(),
        descricao: m.descricao,
        createdAt: m.createdAt,
        incidenciaId: m.incidenciaId,
        cobrancaId: m.cobrancaId,
        parcelaId: m.parcelaId,
        cobranca: m.cobrancaId ? cobrancaMap[m.cobrancaId] || null : null,
        incidencia: m.incidenciaId ? incidenciaMap[m.incidenciaId] || null : null
      }))
    })
  } catch (error) {
    console.error("Error fetching client credit:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Remove credit from client balance
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: clienteId } = await params
    const body = await request.json()
    const { valor, descricao } = body as { valor: number; descricao?: string }

    if (!valor || valor <= 0) {
      return NextResponse.json({ error: "Valor deve ser maior que zero" }, { status: 400 })
    }

    const result = await prisma.$transaction(async (tx) => {
      const cliente = await tx.cliente.findUnique({
        where: { id: clienteId },
        select: { id: true, saldoCredito: true }
      })

      if (!cliente) {
        throw new Error("NOT_FOUND")
      }

      const saldoAtual = Number(cliente.saldoCredito || 0)

      if (valor > saldoAtual) {
        throw new Error("INSUFFICIENT_CREDIT")
      }

      const novoSaldo = saldoAtual - valor

      await tx.cliente.update({
        where: { id: clienteId },
        data: { saldoCredito: new Prisma.Decimal(novoSaldo.toFixed(2)) }
      })

      const movimento = await tx.movimentoCredito.create({
        data: {
          clienteId,
          tipo: "CREDITO_REMOVIDO",
          valor: new Prisma.Decimal(valor.toFixed(2)),
          saldoAnterior: new Prisma.Decimal(saldoAtual.toFixed(2)),
          saldoNovo: new Prisma.Decimal(novoSaldo.toFixed(2)),
          descricao: descricao || "Credito removido manualmente"
        }
      })

      return { novoSaldo, movimento }
    })

    return NextResponse.json({
      saldoCredito: result.novoSaldo,
      movimento: {
        id: result.movimento.id,
        tipo: result.movimento.tipo,
        valor: result.movimento.valor.toNumber(),
        saldoAnterior: result.movimento.saldoAnterior.toNumber(),
        saldoNovo: result.movimento.saldoNovo.toNumber(),
        descricao: result.movimento.descricao,
        createdAt: result.movimento.createdAt
      }
    })
  } catch (error: any) {
    if (error?.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Cliente nao encontrado" }, { status: 404 })
    }
    if (error?.message === "INSUFFICIENT_CREDIT") {
      return NextResponse.json({ error: "Valor excede o credito disponivel" }, { status: 400 })
    }
    console.error("Error removing client credit:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
