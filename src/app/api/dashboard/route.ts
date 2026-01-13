import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const ano = parseInt(searchParams.get("ano") || new Date().getFullYear().toString())
    const mes = parseInt(searchParams.get("mes") || (new Date().getMonth() + 1).toString())
    const trimestre = Math.ceil(mes / 3)

    const [
      totalClientes,
      clientesAtivos,
      vendasMes,
      vendasTrimestre,
      vendasAno,
      cobrancasPendentes,
      objetivoMensal,
      objetivoTrimestral,
      objetivoAnual,
      premiosMensais,
      premiosTrimestrais
    ] = await Promise.all([
      prisma.cliente.count(),
      prisma.cliente.count({ where: { ativo: true } }),
      prisma.venda.aggregate({
        where: { mes, ano },
        _sum: { total: true }
      }),
      prisma.venda.aggregate({
        where: {
          ano,
          mes: {
            gte: (trimestre - 1) * 3 + 1,
            lte: trimestre * 3
          }
        },
        _sum: { total: true }
      }),
      prisma.venda.aggregate({
        where: { ano },
        _sum: { total: true }
      }),
      prisma.cobranca.aggregate({
        where: { pago: false },
        _sum: { valor: true }
      }),
      prisma.objetivoMensal.findUnique({
        where: { mes_ano: { mes, ano } }
      }),
      prisma.objetivoTrimestral.findUnique({
        where: { trimestre_ano: { trimestre, ano } }
      }),
      prisma.objetivoAnual.findUnique({
        where: { ano }
      }),
      prisma.premioMensal.findMany({ orderBy: { minimo: "asc" } }),
      prisma.premioTrimestral.findMany({ orderBy: { minimo: "asc" } })
    ])

    const vendasMesTotal = Number(vendasMes._sum.total) || 0
    const vendasTrimestreTotal = Number(vendasTrimestre._sum.total) || 0
    const vendasAnoTotal = Number(vendasAno._sum.total) || 0
    const pendentesTotal = Number(cobrancasPendentes._sum.valor) || 0
    const objMensal = Number(objetivoMensal?.objetivo) || 0
    const objTrimestral = Number(objetivoTrimestral?.objetivo) || 0
    const objAnual = Number(objetivoAnual?.objetivo) || 0

    // Calculate prize progress
    const premiosMensaisData = premiosMensais.map(p => ({
      minimo: Number(p.minimo),
      premio: Number(p.premio)
    }))
    const premiosTrimestraisData = premiosTrimestrais.map(p => ({
      minimo: Number(p.minimo),
      premio: Number(p.premio)
    }))

    // Find current and next prize for monthly
    let premioMensalAtual = null
    let proximoPremioMensal = null
    for (let i = 0; i < premiosMensaisData.length; i++) {
      if (vendasMesTotal >= premiosMensaisData[i].minimo) {
        premioMensalAtual = premiosMensaisData[i]
      } else {
        proximoPremioMensal = premiosMensaisData[i]
        break
      }
    }
    if (premiosMensaisData.length > 0 && vendasMesTotal >= premiosMensaisData[premiosMensaisData.length - 1].minimo) {
      proximoPremioMensal = null
    }

    // Find current and next prize for quarterly
    let premioTrimestralAtual = null
    let proximoPremioTrimestral = null
    for (let i = 0; i < premiosTrimestraisData.length; i++) {
      if (vendasTrimestreTotal >= premiosTrimestraisData[i].minimo) {
        premioTrimestralAtual = premiosTrimestraisData[i]
      } else {
        proximoPremioTrimestral = premiosTrimestraisData[i]
        break
      }
    }
    if (premiosTrimestraisData.length > 0 && vendasTrimestreTotal >= premiosTrimestraisData[premiosTrimestraisData.length - 1].minimo) {
      proximoPremioTrimestral = null
    }

    // Get available years from sales data
    const anosDisponiveis = await prisma.venda.findMany({
      select: { ano: true },
      distinct: ["ano"],
      orderBy: { ano: "desc" }
    })

    return NextResponse.json({
      totalClientes,
      clientesAtivos,
      vendasMes: vendasMesTotal,
      vendasTrimestre: vendasTrimestreTotal,
      vendasAno: vendasAnoTotal,
      pendentes: pendentesTotal,
      objetivoMensal: objMensal,
      objetivoTrimestral: objTrimestral,
      objetivoAnual: objAnual,
      progressoMensal: objMensal > 0 ? (vendasMesTotal / objMensal) * 100 : 0,
      progressoTrimestral: objTrimestral > 0 ? (vendasTrimestreTotal / objTrimestral) * 100 : 0,
      progressoAnual: objAnual > 0 ? (vendasAnoTotal / objAnual) * 100 : 0,
      currentMonth: mes,
      currentYear: ano,
      currentTrimestre: trimestre,
      premioMensalAtual,
      proximoPremioMensal,
      premioTrimestralAtual,
      proximoPremioTrimestral,
      anosDisponiveis: anosDisponiveis.map(a => a.ano)
    })
  } catch (error) {
    console.error("Error fetching dashboard data:", error)
    return NextResponse.json({ error: "Erro ao carregar dados" }, { status: 500 })
  }
}
