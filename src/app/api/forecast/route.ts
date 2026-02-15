import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }
  try {
    const { searchParams } = new URL(request.url)
    const ano = parseInt(searchParams.get("ano") || new Date().getFullYear().toString())
    const mes = parseInt(searchParams.get("mes") || (new Date().getMonth() + 1).toString())

    // Get historical data for the same month in previous years
    const historicalSales = await prisma.venda.groupBy({
      by: ["ano"],
      where: { mes },
      _sum: { total: true }
    })

    // Get pipeline data (prospects in negotiation/proposal stages)
    const pipeline = await prisma.prospecto.findMany({
      where: {
        ativo: true,
        estado: { in: ["PROPOSTA", "NEGOCIACAO"] }
      },
      include: {
        orcamentos: {
          where: { estado: { in: ["ENVIADO", "RASCUNHO"] } },
          orderBy: { createdAt: "desc" },
          take: 1
        }
      }
    })

    // Calculate historical average
    const totalYears = historicalSales.length
    const totalHistorical = historicalSales.reduce((sum, s) => sum + Number(s._sum.total || 0), 0)
    const historicalAverage = totalYears > 0 ? totalHistorical / totalYears : 0

    // Calculate pipeline value with probability weights
    const pipelineWeights = {
      PROPOSTA: 0.3,     // 30% chance
      NEGOCIACAO: 0.6    // 60% chance
    }

    let pipelineValue = 0
    for (const prospect of pipeline) {
      const weight = pipelineWeights[prospect.estado as keyof typeof pipelineWeights] || 0.2
      if (prospect.orcamentos.length > 0) {
        pipelineValue += Number(prospect.orcamentos[0].total) * weight
      } else {
        // Estimate based on average sale if no quote
        pipelineValue += historicalAverage * 0.1 * weight
      }
    }

    // Get current month sales so far
    const currentSales = await prisma.venda.aggregate({
      where: { mes, ano },
      _sum: { total: true }
    })
    const currentTotal = Number(currentSales._sum.total) || 0

    // Calculate trend based on year-over-year growth
    let growthRate = 0
    if (historicalSales.length >= 2) {
      const sortedYears = historicalSales.sort((a, b) => b.ano - a.ano)
      if (sortedYears.length >= 2) {
        const recent = Number(sortedYears[0]._sum.total) || 0
        const previous = Number(sortedYears[1]._sum.total) || 1
        growthRate = (recent - previous) / previous
      }
    }

    // Apply growth trend to historical average
    const trendAdjustedBase = historicalAverage * (1 + growthRate)

    // Combine forecasts
    const previsaoBase = Math.round(trendAdjustedBase * 100) / 100
    const previsaoPipeline = Math.round(pipelineValue * 100) / 100
    const previsaoTotal = Math.round((previsaoBase * 0.6 + previsaoPipeline * 0.4 + currentTotal * 0.2) * 100) / 100

    // Calculate confidence based on data quality
    let confianca = 50
    if (totalYears >= 3) confianca += 20
    if (totalYears >= 5) confianca += 10
    if (pipeline.length > 5) confianca += 10
    if (currentTotal > 0) confianca += 10
    confianca = Math.min(95, confianca)

    // Get/update forecast in database
    const forecast = await prisma.previsaoVendas.upsert({
      where: { mes_ano: { mes, ano } },
      update: {
        previsaoBase,
        previsaoPipeline,
        previsaoTotal,
        confianca
      },
      create: {
        mes,
        ano,
        previsaoBase,
        previsaoPipeline,
        previsaoTotal,
        confianca
      }
    })

    // Get monthly forecasts for the year
    const yearForecasts = await prisma.previsaoVendas.findMany({
      where: { ano },
      orderBy: { mes: "asc" }
    })

    // Get actual sales for comparison
    const actualSales = await prisma.venda.groupBy({
      by: ["mes"],
      where: { ano },
      _sum: { total: true }
    })

    const monthlyData = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1
      const forecast = yearForecasts.find(f => f.mes === month)
      const actual = actualSales.find(s => s.mes === month)
      return {
        mes: month,
        previsao: forecast ? Number(forecast.previsaoTotal) : null,
        real: actual ? Number(actual._sum.total) : null
      }
    })

    return NextResponse.json({
      current: {
        mes,
        ano,
        previsaoBase,
        previsaoPipeline,
        previsaoTotal,
        confianca,
        vendidoAteMomento: currentTotal,
        faltaParaPrevisao: Math.max(0, previsaoTotal - currentTotal)
      },
      pipeline: {
        total: pipeline.length,
        valor: pipelineValue,
        prospects: pipeline.map(p => ({
          id: p.id,
          nome: p.nomeEmpresa,
          estado: p.estado,
          valorEstimado: p.orcamentos[0] ? Number(p.orcamentos[0].total) : null
        }))
      },
      historical: {
        average: historicalAverage,
        growthRate: Math.round(growthRate * 100),
        years: historicalSales.map(s => ({
          ano: s.ano,
          total: Number(s._sum.total)
        }))
      },
      monthlyData
    })
  } catch (error) {
    console.error("Error fetching forecast:", error)
    return NextResponse.json({ error: "Erro ao carregar previsao" }, { status: 500 })
  }
}
