import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { Decimal } from "@prisma/client/runtime/library"

// GET - List incidencias for a venda
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const vendaId = searchParams.get("vendaId")

    if (!vendaId) {
      return NextResponse.json({ error: "vendaId is required" }, { status: 400 })
    }

    const incidencias = await prisma.incidencia.findMany({
      where: { vendaId },
      orderBy: { dataRegisto: "desc" },
      include: {
        cliente: {
          select: { id: true, nome: true, saldoCredito: true }
        },
        cobranca: {
          select: { id: true, fatura: true, valor: true, estado: true }
        }
      }
    })

    return NextResponse.json(incidencias)
  } catch (error) {
    console.error("Error fetching incidencias:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Create new incidencia (credit note)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      vendaId,
      valor,
      motivo,
      notas,
      cobrancaId,
      aplicadoACredito = true,
      ajustarCobranca = false
    } = body

    if (!vendaId || valor === undefined || !motivo) {
      return NextResponse.json({ error: "vendaId, valor, and motivo are required" }, { status: 400 })
    }

    // Verify venda exists and get client info
    const venda = await prisma.venda.findUnique({
      where: { id: vendaId },
      include: { cliente: true }
    })
    if (!venda) {
      return NextResponse.json({ error: "Venda not found" }, { status: 404 })
    }

    // Verify cobranca if provided
    let cobranca = null
    if (cobrancaId) {
      cobranca = await prisma.cobranca.findUnique({ where: { id: cobrancaId } })
      if (!cobranca) {
        return NextResponse.json({ error: "Cobranca not found" }, { status: 404 })
      }
    }

    const valorDecimal = new Decimal(valor)
    const clienteId = venda.clienteId
    const saldoAnterior = venda.cliente.saldoCredito || new Decimal(0)
    const saldoNovo = aplicadoACredito
      ? saldoAnterior.plus(valorDecimal)
      : saldoAnterior

    // Use a transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Create incidencia
      const incidencia = await tx.incidencia.create({
        data: {
          vendaId,
          clienteId,
          cobrancaId: cobrancaId || null,
          valor: valorDecimal,
          motivo,
          notas: notas || null,
          aplicadoACredito
        }
      })

      // Update client credit balance if aplicadoACredito
      if (aplicadoACredito) {
        await tx.cliente.update({
          where: { id: clienteId },
          data: { saldoCredito: saldoNovo }
        })

        // Create credit movement record
        await tx.movimentoCredito.create({
          data: {
            clienteId,
            tipo: "CREDITO_ADICIONADO",
            valor: valorDecimal,
            saldoAnterior,
            saldoNovo,
            incidenciaId: incidencia.id,
            cobrancaId: cobrancaId || null,
            descricao: `Nota de crédito: ${motivo}`
          }
        })
      }

      // Adjust cobranca value if requested
      if (ajustarCobranca && cobranca) {
        const novoValor = cobranca.valor.minus(valorDecimal)
        await tx.cobranca.update({
          where: { id: cobrancaId },
          data: {
            valor: novoValor.greaterThan(0) ? novoValor : new Decimal(0)
          }
        })
      }

      return incidencia
    })

    // Fetch the created incidencia with relations
    const incidenciaComRelacoes = await prisma.incidencia.findUnique({
      where: { id: result.id },
      include: {
        cliente: {
          select: { id: true, nome: true, saldoCredito: true }
        },
        cobranca: {
          select: { id: true, fatura: true, valor: true, estado: true }
        }
      }
    })

    return NextResponse.json(incidenciaComRelacoes)
  } catch (error) {
    console.error("Error creating incidencia:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE - Remove incidencia and revert credit if needed
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }

    // Find the incidencia
    const incidencia = await prisma.incidencia.findUnique({
      where: { id },
      include: { cliente: true }
    })

    if (!incidencia) {
      return NextResponse.json({ error: "Incidencia not found" }, { status: 404 })
    }

    // Use a transaction to revert credit if it was applied
    await prisma.$transaction(async (tx) => {
      if (incidencia.aplicadoACredito) {
        const saldoAnterior = incidencia.cliente.saldoCredito || new Decimal(0)
        const saldoNovo = saldoAnterior.minus(incidencia.valor)

        await tx.cliente.update({
          where: { id: incidencia.clienteId },
          data: { saldoCredito: saldoNovo.greaterThan(0) ? saldoNovo : new Decimal(0) }
        })

        // Create reversal credit movement record
        await tx.movimentoCredito.create({
          data: {
            clienteId: incidencia.clienteId,
            tipo: "CREDITO_ESTORNADO",
            valor: incidencia.valor,
            saldoAnterior,
            saldoNovo: saldoNovo.greaterThan(0) ? saldoNovo : new Decimal(0),
            incidenciaId: incidencia.id,
            descricao: `Estorno de nota de crédito: ${incidencia.motivo}`
          }
        })
      }

      // Delete the incidencia
      await tx.incidencia.delete({ where: { id } })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting incidencia:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
