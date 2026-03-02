import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

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
      take: 50
    })

    // Fetch related incidencias for context
    const incidencias = await prisma.incidencia.findMany({
      where: {
        clienteId,
        aplicadoACredito: true
      },
      orderBy: { dataRegisto: "desc" },
      take: 20,
      select: {
        id: true,
        valor: true,
        motivo: true,
        dataRegisto: true,
        cobranca: {
          select: {
            id: true,
            fatura: true,
            valor: true
          }
        }
      }
    })

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
        parcelaId: m.parcelaId
      })),
      incidencias: incidencias.map(i => ({
        id: i.id,
        valor: i.valor.toNumber(),
        motivo: i.motivo,
        dataRegisto: i.dataRegisto,
        cobranca: i.cobranca ? {
          id: i.cobranca.id,
          fatura: i.cobranca.fatura,
          valor: i.cobranca.valor.toNumber()
        } : null
      }))
    })
  } catch (error) {
    console.error("Error fetching client credit:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
