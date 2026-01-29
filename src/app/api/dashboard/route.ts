import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const ano = parseInt(searchParams.get("ano") || new Date().getFullYear().toString())
    const mes = parseInt(searchParams.get("mes") || (new Date().getMonth() + 1).toString())
    const trimestre = Math.ceil(mes / 3)

    const now = new Date()

    const [
      totalClientes,
      clientesAtivos,
      vendasMes,
      vendasTrimestre,
      vendasAno,
      // Returns for this month
      devolucoesMes,
      // Returns for this quarter
      devolucoesTrimestre,
      // Returns for this year
      devolucoesAno,
      cobrancasPendentes,
      objetivoMensal,
      objetivoTrimestral,
      objetivoAnual,
      premiosMensais,
      premiosTrimestrais,
      parcelasAtrasadas,
      parcelasAtrasadasValor,
      proximasParcelas,
      // Varios items to exclude from objectives
      variosMes,
      variosTrimestre,
      variosAno
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
      // Returns for this month (based on the original sale's month, not return date)
      prisma.devolucao.aggregate({
        where: {
          venda: { mes, ano }
        },
        _sum: {
          totalDevolvido: true,
          totalSubstituido: true
        }
      }),
      // Returns for this quarter
      prisma.devolucao.aggregate({
        where: {
          venda: {
            ano,
            mes: {
              gte: (trimestre - 1) * 3 + 1,
              lte: trimestre * 3
            }
          }
        },
        _sum: {
          totalDevolvido: true,
          totalSubstituido: true
        }
      }),
      // Returns for this year
      prisma.devolucao.aggregate({
        where: {
          venda: { ano }
        },
        _sum: {
          totalDevolvido: true,
          totalSubstituido: true
        }
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
      prisma.premioTrimestral.findMany({ orderBy: { minimo: "asc" } }),
      // Count overdue parcelas
      prisma.parcela.count({
        where: {
          pago: false,
          dataVencimento: { lt: now }
        }
      }),
      // Sum of overdue parcelas values
      prisma.parcela.aggregate({
        where: {
          pago: false,
          dataVencimento: { lt: now }
        },
        _sum: { valor: true }
      }),
      // Upcoming parcelas (next 7 days)
      prisma.parcela.findMany({
        where: {
          pago: false,
          dataVencimento: {
            gte: now,
            lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
          }
        },
        include: {
          cobranca: {
            include: { cliente: true }
          }
        },
        orderBy: { dataVencimento: "asc" },
        take: 5
      }),
      // Varios items (tipo="Varios") - exclude from objectives calculations
      // Monthly varios
      prisma.itemVenda.aggregate({
        where: {
          venda: { mes, ano },
          produto: { tipo: "Varios" }
        },
        _sum: { subtotal: true }
      }),
      // Quarterly varios
      prisma.itemVenda.aggregate({
        where: {
          venda: {
            ano,
            mes: {
              gte: (trimestre - 1) * 3 + 1,
              lte: trimestre * 3
            }
          },
          produto: { tipo: "Varios" }
        },
        _sum: { subtotal: true }
      }),
      // Yearly varios
      prisma.itemVenda.aggregate({
        where: {
          venda: { ano },
          produto: { tipo: "Varios" }
        },
        _sum: { subtotal: true }
      })
    ])

    // Calculate gross totals
    const vendasMesBruto = Number(vendasMes._sum.total) || 0
    const vendasTrimestreBruto = Number(vendasTrimestre._sum.total) || 0
    const vendasAnoBruto = Number(vendasAno._sum.total) || 0

    // Calculate returns adjustments
    const devolvidoMes = Number(devolucoesMes._sum.totalDevolvido) || 0
    const substituidoMes = Number(devolucoesMes._sum.totalSubstituido) || 0
    const devolvidoTrimestre = Number(devolucoesTrimestre._sum.totalDevolvido) || 0
    const substituidoTrimestre = Number(devolucoesTrimestre._sum.totalSubstituido) || 0
    const devolvidoAno = Number(devolucoesAno._sum.totalDevolvido) || 0
    const substituidoAno = Number(devolucoesAno._sum.totalSubstituido) || 0

    // Calculate Varios totals to exclude from objectives
    const variosMesTotal = Number(variosMes._sum.subtotal) || 0
    const variosTrimestreTotal = Number(variosTrimestre._sum.subtotal) || 0
    const variosAnoTotal = Number(variosAno._sum.subtotal) || 0

    // Calculate net totals (Original - Returns + Substitutions - Varios)
    // Varios items are excluded because they don't count towards objectives/prizes
    const vendasMesTotal = vendasMesBruto - devolvidoMes + substituidoMes - variosMesTotal
    const vendasTrimestreTotal = vendasTrimestreBruto - devolvidoTrimestre + substituidoTrimestre - variosTrimestreTotal
    const vendasAnoTotal = vendasAnoBruto - devolvidoAno + substituidoAno - variosAnoTotal

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
      // Net sales (after returns)
      vendasMes: vendasMesTotal,
      vendasTrimestre: vendasTrimestreTotal,
      vendasAno: vendasAnoTotal,
      // Gross sales (before returns) - for reference
      vendasMesBruto,
      vendasTrimestreBruto,
      vendasAnoBruto,
      // Returns breakdown
      devolucoesMes: {
        devolvido: devolvidoMes,
        substituido: substituidoMes,
        liquido: devolvidoMes - substituidoMes
      },
      devolucoesTrimestre: {
        devolvido: devolvidoTrimestre,
        substituido: substituidoTrimestre,
        liquido: devolvidoTrimestre - substituidoTrimestre
      },
      devolucoesAno: {
        devolvido: devolvidoAno,
        substituido: substituidoAno,
        liquido: devolvidoAno - substituidoAno
      },
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
      anosDisponiveis: anosDisponiveis.map(a => a.ano),
      // Overdue parcelas data
      parcelasAtrasadas,
      valorAtrasado: Number(parcelasAtrasadasValor._sum.valor) || 0,
      proximasParcelas: proximasParcelas.map(p => ({
        id: p.id,
        numero: p.numero,
        valor: Number(p.valor),
        dataVencimento: p.dataVencimento,
        clienteNome: p.cobranca.cliente.nome,
        cobrancaId: p.cobrancaId,
        fatura: p.cobranca.fatura
      }))
    })
  } catch (error) {
    console.error("Error fetching dashboard data:", error)
    return NextResponse.json({ error: "Erro ao carregar dados" }, { status: 500 })
  }
}
