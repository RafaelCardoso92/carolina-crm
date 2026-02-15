import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Calculate health score for a client
function calculateHealthScore(data: {
  totalVendas: number
  totalPago: number
  totalPendente: number
  parcelasAtrasadas: number
  diasDesdeUltimaVenda: number | null
  diasDesdeUltimoContacto: number | null
  totalComunicacoes: number
}) {
  let scorePagamento = 100
  let scoreEngajamento = 50
  let scoreCompras = 50

  // Payment score (0-100)
  if (data.totalVendas > 0) {
    const totalPayments = data.totalPago + data.totalPendente
    if (totalPayments > 0) {
      const taxaPagamento = (data.totalPago / totalPayments) * 100
      scorePagamento = Math.round(taxaPagamento)
    }
    // Penalize for overdue payments
    if (data.parcelasAtrasadas > 0) {
      scorePagamento = Math.max(0, scorePagamento - (data.parcelasAtrasadas * 10))
    }
  }

  // Engagement score (0-100)
  if (data.diasDesdeUltimoContacto !== null) {
    if (data.diasDesdeUltimoContacto <= 7) scoreEngajamento = 100
    else if (data.diasDesdeUltimoContacto <= 14) scoreEngajamento = 80
    else if (data.diasDesdeUltimoContacto <= 30) scoreEngajamento = 60
    else if (data.diasDesdeUltimoContacto <= 60) scoreEngajamento = 40
    else scoreEngajamento = 20
  }
  // Bonus for communication frequency
  if (data.totalComunicacoes > 10) scoreEngajamento = Math.min(100, scoreEngajamento + 10)

  // Purchase score (0-100)
  if (data.diasDesdeUltimaVenda !== null) {
    if (data.diasDesdeUltimaVenda <= 30) scoreCompras = 100
    else if (data.diasDesdeUltimaVenda <= 60) scoreCompras = 80
    else if (data.diasDesdeUltimaVenda <= 90) scoreCompras = 60
    else if (data.diasDesdeUltimaVenda <= 180) scoreCompras = 40
    else scoreCompras = 20
  }
  // Bonus for high value
  if (data.totalVendas > 5000) scoreCompras = Math.min(100, scoreCompras + 10)
  if (data.totalVendas > 10000) scoreCompras = Math.min(100, scoreCompras + 10)

  // Ensure all scores are valid numbers
  scorePagamento = isNaN(scorePagamento) ? 100 : Math.max(0, Math.min(100, scorePagamento))
  scoreEngajamento = isNaN(scoreEngajamento) ? 50 : Math.max(0, Math.min(100, scoreEngajamento))
  scoreCompras = isNaN(scoreCompras) ? 50 : Math.max(0, Math.min(100, scoreCompras))

  // Overall score (weighted average)
  const scoreGeral = Math.round(
    (scorePagamento * 0.4) + (scoreEngajamento * 0.3) + (scoreCompras * 0.3)
  )

  // Risk level
  let risco = "MEDIO"
  if (scoreGeral >= 70) risco = "BAIXO"
  else if (scoreGeral < 40) risco = "ALTO"

  return { scoreGeral, scorePagamento, scoreEngajamento, scoreCompras, risco }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const clienteId = searchParams.get("clienteId")
    const recalculate = searchParams.get("recalculate") === "true"

    if (clienteId) {
      // Get single client health
      let health = await prisma.clienteHealth.findUnique({
        where: { clienteId }
      })

      if (!health || recalculate) {
        // Calculate health score
        const now = new Date()
        const cliente = await prisma.cliente.findUnique({
          where: { id: clienteId },
          include: {
            vendas: true,
            cobrancas: {
              include: { parcelas: true }
            },
            comunicacoes: true
          }
        })

        if (!cliente) {
          return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 })
        }

        const totalVendas = cliente.vendas.reduce((sum, v) => sum + Number(v.total), 0)
        const totalPago = cliente.cobrancas
          .filter(c => c.pago)
          .reduce((sum, c) => sum + Number(c.valor), 0)
        const totalPendente = cliente.cobrancas
          .filter(c => !c.pago)
          .reduce((sum, c) => sum + Number(c.valor), 0)
        const parcelasAtrasadas = cliente.cobrancas
          .flatMap(c => c.parcelas)
          .filter(p => !p.pago && new Date(p.dataVencimento) < now).length

        const ultimaVenda = cliente.vendas.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0]
        const diasDesdeUltimaVenda = ultimaVenda
          ? Math.floor((now.getTime() - new Date(ultimaVenda.createdAt).getTime()) / (1000 * 60 * 60 * 24))
          : null

        const diasDesdeUltimoContacto = cliente.ultimoContacto
          ? Math.floor((now.getTime() - new Date(cliente.ultimoContacto).getTime()) / (1000 * 60 * 60 * 24))
          : null

        const scores = calculateHealthScore({
          totalVendas,
          totalPago,
          totalPendente,
          parcelasAtrasadas,
          diasDesdeUltimaVenda,
          diasDesdeUltimoContacto,
          totalComunicacoes: cliente.comunicacoes.length
        })

        // Get previous score for trend
        const previousHealth = await prisma.clienteHealth.findUnique({
          where: { clienteId }
        })
        let tendencia = "ESTAVEL"
        if (previousHealth) {
          const diff = scores.scoreGeral - previousHealth.scoreGeral
          if (diff >= 5) tendencia = "SUBINDO"
          else if (diff <= -5) tendencia = "DESCENDO"
        }

        health = await prisma.clienteHealth.upsert({
          where: { clienteId },
          update: {
            ...scores,
            tendencia,
            ultimaAtualizacao: now
          },
          create: {
            clienteId,
            ...scores,
            tendencia
          }
        })
      }

      return NextResponse.json(health)
    }

    // Get all clients health scores
    const allHealth = await prisma.clienteHealth.findMany({
      orderBy: { scoreGeral: "asc" }
    })

    // Get clients with low scores
    const atRisk = allHealth.filter(h => h.risco === "ALTO")
    const declining = allHealth.filter(h => h.tendencia === "DESCENDO")

    return NextResponse.json({
      total: allHealth.length,
      atRisk: atRisk.length,
      declining: declining.length,
      scores: allHealth
    })
  } catch (error) {
    console.error("Error fetching health scores:", error)
    return NextResponse.json({ error: "Erro ao carregar health scores" }, { status: 500 })
  }
}

// Recalculate all health scores
export async function POST() {
  try {
    const clientes = await prisma.cliente.findMany({
      where: { ativo: true },
      include: {
        vendas: true,
        cobrancas: {
          include: { parcelas: true }
        },
        comunicacoes: true
      }
    })

    const now = new Date()
    let updated = 0

    for (const cliente of clientes) {
      const totalVendas = cliente.vendas.reduce((sum, v) => sum + Number(v.total), 0)
      const totalPago = cliente.cobrancas
        .filter(c => c.pago)
        .reduce((sum, c) => sum + Number(c.valor), 0)
      const totalPendente = cliente.cobrancas
        .filter(c => !c.pago)
        .reduce((sum, c) => sum + Number(c.valor), 0)
      const parcelasAtrasadas = cliente.cobrancas
        .flatMap(c => c.parcelas)
        .filter(p => !p.pago && new Date(p.dataVencimento) < now).length

      const ultimaVenda = cliente.vendas.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0]
      const diasDesdeUltimaVenda = ultimaVenda
        ? Math.floor((now.getTime() - new Date(ultimaVenda.createdAt).getTime()) / (1000 * 60 * 60 * 24))
        : null

      const diasDesdeUltimoContacto = cliente.ultimoContacto
        ? Math.floor((now.getTime() - new Date(cliente.ultimoContacto).getTime()) / (1000 * 60 * 60 * 24))
        : null

      const scores = calculateHealthScore({
        totalVendas,
        totalPago,
        totalPendente,
        parcelasAtrasadas,
        diasDesdeUltimaVenda,
        diasDesdeUltimoContacto,
        totalComunicacoes: cliente.comunicacoes.length
      })

      // Get previous score for trend
      const previousHealth = await prisma.clienteHealth.findUnique({
        where: { clienteId: cliente.id }
      })
      let tendencia = "ESTAVEL"
      if (previousHealth) {
        const diff = scores.scoreGeral - previousHealth.scoreGeral
        if (diff >= 5) tendencia = "SUBINDO"
        else if (diff <= -5) tendencia = "DESCENDO"
      }

      await prisma.clienteHealth.upsert({
        where: { clienteId: cliente.id },
        update: {
          ...scores,
          tendencia,
          ultimaAtualizacao: now
        },
        create: {
          clienteId: cliente.id,
          ...scores,
          tendencia
        }
      })
      updated++
    }

    return NextResponse.json({ success: true, updated })
  } catch (error) {
    console.error("Error recalculating health scores:", error)
    return NextResponse.json({ error: "Erro ao recalcular health scores" }, { status: 500 })
  }
}
