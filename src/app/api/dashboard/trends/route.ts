import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const meses = [
  "", "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez"
]

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const ano = parseInt(searchParams.get("ano") || new Date().getFullYear().toString())

    // Get monthly sales for the selected year
    const vendasMensais = await prisma.venda.groupBy({
      by: ["mes"],
      where: { ano },
      _sum: { total: true },
      orderBy: { mes: "asc" }
    })

    // Get monthly sales for previous year for comparison
    const vendasAnoAnterior = await prisma.venda.groupBy({
      by: ["mes"],
      where: { ano: ano - 1 },
      _sum: { total: true },
      orderBy: { mes: "asc" }
    })

    // Get quarterly totals
    const vendasTrimestrais = await prisma.$queryRaw<Array<{ trimestre: number; total: number }>>`
      SELECT
        CEIL(mes::float / 3)::int as trimestre,
        SUM(total::numeric) as total
      FROM "Venda"
      WHERE ano = ${ano}
      GROUP BY CEIL(mes::float / 3)::int
      ORDER BY trimestre
    `

    // Get objectives for the year
    const objetivosMensais = await prisma.objetivoMensal.findMany({
      where: { ano },
      orderBy: { mes: "asc" }
    })

    const objetivosTrimestrais = await prisma.objetivoTrimestral.findMany({
      where: { ano },
      orderBy: { trimestre: "asc" }
    })

    // Build monthly data with all 12 months
    const dadosMensais = Array.from({ length: 12 }, (_, i) => {
      const mes = i + 1
      const vendaAtual = vendasMensais.find(v => v.mes === mes)
      const vendaAnterior = vendasAnoAnterior.find(v => v.mes === mes)
      const objetivo = objetivosMensais.find(o => o.mes === mes)

      return {
        mes: meses[mes],
        mesNum: mes,
        vendas: Number(vendaAtual?._sum.total) || 0,
        vendasAnoAnterior: Number(vendaAnterior?._sum.total) || 0,
        objetivo: Number(objetivo?.objetivo) || 0
      }
    })

    // Build quarterly data
    const dadosTrimestrais = Array.from({ length: 4 }, (_, i) => {
      const trimestre = i + 1
      const venda = vendasTrimestrais.find(v => Number(v.trimestre) === trimestre)
      const objetivo = objetivosTrimestrais.find(o => o.trimestre === trimestre)

      return {
        trimestre: `Q${trimestre}`,
        trimestreNum: trimestre,
        vendas: Number(venda?.total) || 0,
        objetivo: Number(objetivo?.objetivo) || 0
      }
    })

    // Calculate cumulative sales
    let acumulado = 0
    const dadosAcumulados = dadosMensais.map(d => {
      acumulado += d.vendas
      return {
        mes: d.mes,
        acumulado
      }
    })

    // Get top clients for the year
    const topClientes = await prisma.venda.groupBy({
      by: ["clienteId"],
      where: { ano },
      _sum: { total: true },
      orderBy: { _sum: { total: "desc" } },
      take: 5
    })

    // Get client names
    const clienteIds = topClientes.map(c => c.clienteId)
    const clientes = await prisma.cliente.findMany({
      where: { id: { in: clienteIds } },
      select: { id: true, nome: true }
    })

    const topClientesData = topClientes.map(tc => {
      const cliente = clientes.find(c => c.id === tc.clienteId)
      return {
        nome: cliente?.nome || "Desconhecido",
        vendas: Number(tc._sum.total) || 0
      }
    })

    return NextResponse.json({
      ano,
      dadosMensais,
      dadosTrimestrais,
      dadosAcumulados,
      topClientes: topClientesData
    })
  } catch (error) {
    console.error("Error fetching trends:", error)
    return NextResponse.json({ error: "Erro ao carregar tendencias" }, { status: 500 })
  }
}
