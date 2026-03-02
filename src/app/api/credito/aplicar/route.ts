import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { Decimal } from "@prisma/client/runtime/library"

// POST - Apply credit to a cobranca or parcela
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { clienteId, cobrancaId, parcelaId, valorAplicar } = body

    if (!clienteId || valorAplicar === undefined || valorAplicar <= 0) {
      return NextResponse.json(
        { error: "clienteId and valorAplicar (positive) are required" },
        { status: 400 }
      )
    }

    if (!cobrancaId && !parcelaId) {
      return NextResponse.json(
        { error: "Either cobrancaId or parcelaId is required" },
        { status: 400 }
      )
    }

    // Verify client exists and has sufficient credit
    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId }
    })

    if (!cliente) {
      return NextResponse.json({ error: "Cliente not found" }, { status: 404 })
    }

    const saldoAtual = cliente.saldoCredito || new Decimal(0)
    const valorDecimal = new Decimal(valorAplicar)

    if (saldoAtual.lessThan(valorDecimal)) {
      return NextResponse.json(
        { error: "Saldo de crédito insuficiente", saldoDisponivel: saldoAtual.toNumber() },
        { status: 400 }
      )
    }

    // Apply to parcela if specified
    if (parcelaId) {
      const parcela = await prisma.parcela.findUnique({
        where: { id: parcelaId },
        include: { cobranca: true }
      })

      if (!parcela) {
        return NextResponse.json({ error: "Parcela not found" }, { status: 404 })
      }

      if (parcela.pago) {
        return NextResponse.json({ error: "Parcela já está paga" }, { status: 400 })
      }

      const valorPagoAtual = parcela.valorPago || new Decimal(0)
      const valorRestante = parcela.valor.minus(valorPagoAtual)

      // Don't allow applying more than what's owed
      const valorEfetivo = valorDecimal.greaterThan(valorRestante)
        ? valorRestante
        : valorDecimal

      const novoValorPago = valorPagoAtual.plus(valorEfetivo)
      const parcelaPaga = novoValorPago.greaterThanOrEqualTo(parcela.valor)
      const saldoNovo = saldoAtual.minus(valorEfetivo)

      await prisma.$transaction(async (tx) => {
        // Update parcela
        await tx.parcela.update({
          where: { id: parcelaId },
          data: {
            valorPago: novoValorPago,
            pago: parcelaPaga,
            dataPago: parcelaPaga ? new Date() : null
          }
        })

        // Update client credit balance
        await tx.cliente.update({
          where: { id: clienteId },
          data: { saldoCredito: saldoNovo }
        })

        // Create credit movement record
        await tx.movimentoCredito.create({
          data: {
            clienteId,
            tipo: "CREDITO_APLICADO",
            valor: valorEfetivo,
            saldoAnterior: saldoAtual,
            saldoNovo,
            cobrancaId: parcela.cobrancaId,
            parcelaId,
            descricao: `Crédito aplicado à parcela ${parcela.numero}`
          }
        })

        // Check and update cobranca status
        const todasParcelas = await tx.parcela.findMany({
          where: { cobrancaId: parcela.cobrancaId }
        })

        const todasPagas = todasParcelas.every(p =>
          p.id === parcelaId ? parcelaPaga : p.pago
        )
        const algumaPaga = todasParcelas.some(p =>
          p.id === parcelaId ? parcelaPaga : p.pago
        )

        let novoEstado = "PENDENTE"
        if (todasPagas) {
          novoEstado = "PAGO"
        } else if (algumaPaga) {
          novoEstado = "PARCIAL"
        }

        // Calculate total paid for cobranca
        const totalPagoCobranca = todasParcelas.reduce((acc, p) => {
          const pago = p.id === parcelaId ? novoValorPago : (p.valorPago || new Decimal(0))
          return acc.plus(pago)
        }, new Decimal(0))

        await tx.cobranca.update({
          where: { id: parcela.cobrancaId },
          data: {
            estado: novoEstado as "PENDENTE" | "PAGO" | "PARCIAL" | "ATRASADO",
            valorPago: totalPagoCobranca,
            pago: todasPagas,
            dataPago: todasPagas ? new Date() : null,
            creditoAplicado: (parcela.cobranca.creditoAplicado || new Decimal(0)).plus(valorEfetivo)
          }
        })
      })

      return NextResponse.json({
        success: true,
        valorAplicado: valorEfetivo.toNumber(),
        saldoRestante: saldoNovo.toNumber(),
        parcelaPaga
      })
    }

    // Apply to cobranca if no parcela specified
    if (cobrancaId) {
      const cobranca = await prisma.cobranca.findUnique({
        where: { id: cobrancaId },
        include: { parcelas: true }
      })

      if (!cobranca) {
        return NextResponse.json({ error: "Cobranca not found" }, { status: 404 })
      }

      if (cobranca.pago) {
        return NextResponse.json({ error: "Cobranca já está paga" }, { status: 400 })
      }

      // If cobranca has parcelas, apply to the first unpaid one
      if (cobranca.parcelas.length > 0) {
        const parcelasPendentes = cobranca.parcelas
          .filter(p => !p.pago)
          .sort((a, b) => a.numero - b.numero)

        if (parcelasPendentes.length === 0) {
          return NextResponse.json({ error: "Todas as parcelas já estão pagas" }, { status: 400 })
        }

        const proximaParcela = parcelasPendentes[0]
        const valorPagoAtual = proximaParcela.valorPago || new Decimal(0)
        const valorRestante = proximaParcela.valor.minus(valorPagoAtual)
        const valorEfetivo = valorDecimal.greaterThan(valorRestante)
          ? valorRestante
          : valorDecimal

        const novoValorPago = valorPagoAtual.plus(valorEfetivo)
        const parcelaPaga = novoValorPago.greaterThanOrEqualTo(proximaParcela.valor)
        const saldoNovo = saldoAtual.minus(valorEfetivo)

        await prisma.$transaction(async (tx) => {
          await tx.parcela.update({
            where: { id: proximaParcela.id },
            data: {
              valorPago: novoValorPago,
              pago: parcelaPaga,
              dataPago: parcelaPaga ? new Date() : null
            }
          })

          await tx.cliente.update({
            where: { id: clienteId },
            data: { saldoCredito: saldoNovo }
          })

          await tx.movimentoCredito.create({
            data: {
              clienteId,
              tipo: "CREDITO_APLICADO",
              valor: valorEfetivo,
              saldoAnterior: saldoAtual,
              saldoNovo,
              cobrancaId,
              parcelaId: proximaParcela.id,
              descricao: `Crédito aplicado à parcela ${proximaParcela.numero}`
            }
          })

          // Check all parcelas status
          const todasParcelas = await tx.parcela.findMany({
            where: { cobrancaId }
          })

          const todasPagas = todasParcelas.every(p =>
            p.id === proximaParcela.id ? parcelaPaga : p.pago
          )
          const algumaPaga = todasParcelas.some(p =>
            p.id === proximaParcela.id ? parcelaPaga : p.pago
          )

          let novoEstado = "PENDENTE"
          if (todasPagas) {
            novoEstado = "PAGO"
          } else if (algumaPaga) {
            novoEstado = "PARCIAL"
          }

          const totalPagoCobranca = todasParcelas.reduce((acc, p) => {
            const pago = p.id === proximaParcela.id ? novoValorPago : (p.valorPago || new Decimal(0))
            return acc.plus(pago)
          }, new Decimal(0))

          await tx.cobranca.update({
            where: { id: cobrancaId },
            data: {
              estado: novoEstado as "PENDENTE" | "PAGO" | "PARCIAL" | "ATRASADO",
              valorPago: totalPagoCobranca,
              pago: todasPagas,
              dataPago: todasPagas ? new Date() : null,
              creditoAplicado: (cobranca.creditoAplicado || new Decimal(0)).plus(valorEfetivo)
            }
          })
        })

        return NextResponse.json({
          success: true,
          valorAplicado: valorEfetivo.toNumber(),
          saldoRestante: saldoNovo.toNumber(),
          parcelaId: proximaParcela.id,
          parcelaNumero: proximaParcela.numero,
          parcelaPaga
        })
      }

      // Cobranca without parcelas - apply directly
      const valorPagoAtual = cobranca.valorPago || new Decimal(0)
      const valorRestante = cobranca.valor.minus(valorPagoAtual)
      const valorEfetivo = valorDecimal.greaterThan(valorRestante)
        ? valorRestante
        : valorDecimal

      const novoValorPago = valorPagoAtual.plus(valorEfetivo)
      const cobrancaPaga = novoValorPago.greaterThanOrEqualTo(cobranca.valor)
      const saldoNovo = saldoAtual.minus(valorEfetivo)

      await prisma.$transaction(async (tx) => {
        await tx.cobranca.update({
          where: { id: cobrancaId },
          data: {
            valorPago: novoValorPago,
            pago: cobrancaPaga,
            dataPago: cobrancaPaga ? new Date() : null,
            estado: cobrancaPaga ? "PAGO" : (novoValorPago.greaterThan(0) ? "PARCIAL" : "PENDENTE"),
            creditoAplicado: (cobranca.creditoAplicado || new Decimal(0)).plus(valorEfetivo)
          }
        })

        await tx.cliente.update({
          where: { id: clienteId },
          data: { saldoCredito: saldoNovo }
        })

        await tx.movimentoCredito.create({
          data: {
            clienteId,
            tipo: "CREDITO_APLICADO",
            valor: valorEfetivo,
            saldoAnterior: saldoAtual,
            saldoNovo,
            cobrancaId,
            descricao: `Crédito aplicado à cobrança ${cobranca.fatura || cobrancaId}`
          }
        })
      })

      return NextResponse.json({
        success: true,
        valorAplicado: valorEfetivo.toNumber(),
        saldoRestante: saldoNovo.toNumber(),
        cobrancaPaga
      })
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  } catch (error) {
    console.error("Error applying credit:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
