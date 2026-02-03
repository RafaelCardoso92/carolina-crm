import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { cache, cacheKeys, cacheTags } from "@/lib/cache"
import { logger, createTimer } from "@/lib/logger"
import { requirePermission } from "@/lib/api-auth"
import { PERMISSIONS } from "@/lib/permissions"

export async function GET(request: Request) {
  const timer = createTimer()

  try {
    const session = await requirePermission(PERMISSIONS.DASHBOARD_READ)
    const userId = session.user?.id || "anonymous"

    const { searchParams } = new URL(request.url)
    const ano = parseInt(searchParams.get("ano") || new Date().getFullYear().toString())
    const mes = parseInt(searchParams.get("mes") || (new Date().getMonth() + 1).toString())
    const trimestre = Math.ceil(mes / 3)

    // Check cache first
    const cacheKey = cacheKeys.dashboard(userId) + `:${ano}:${mes}`
    const cached = cache.get(cacheKey)
    if (cached) {
      logger.debug("Dashboard cache hit", { userId, duration: timer.elapsed() })
      return NextResponse.json(cached)
    }

    const now = new Date()

    const [
      totalClientes,
      clientesAtivos,
      vendasMes,
      vendasTrimestre,
      vendasAno,
      devolucoesMes,
      devolucoesTrimestre,
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
      cobrancasPendentesCount,
      cobrancasPagasCount,
      cobrancasPagasValor,
      comissaoMensal,
      objetivosVarios
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
      prisma.devolucao.aggregate({
        where: {
          venda: { mes, ano }
        },
        _sum: {
          totalDevolvido: true,
          totalSubstituido: true
        }
      }),
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
      prisma.parcela.count({
        where: {
          pago: false,
          dataVencimento: { lt: now }
        }
      }),
      prisma.parcela.aggregate({
        where: {
          pago: false,
          dataVencimento: { lt: now }
        },
        _sum: { valor: true }
      }),
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
      prisma.cobranca.count({
        where: { pago: false }
      }),
      prisma.cobranca.count({
        where: { pago: true }
      }),
      prisma.cobranca.aggregate({
        where: { pago: true },
        _sum: { valor: true }
      }),
      prisma.cobranca.aggregate({
        where: {
          pago: true,
          dataPago: {
            gte: new Date(ano, mes - 1, 1),
            lt: new Date(ano, mes, 1)
          }
        },
        _sum: { comissao: true }
      }),
      // Objetivos Varios for current month/year
      prisma.objetivoVario.findMany({
        where: {
          mes,
          ano,
          ativo: true
        },
        include: {
          produtos: {
            include: { produto: true }
          },
          vendas: {
            where: { mes, ano },
            select: {
              id: true,
              objetivoVarioValor: true,
              total: true,
              cliente: {
                select: { nome: true }
              }
            }
          }
        },
        orderBy: { titulo: "asc" }
      })
    ])

    const vendasMesBruto = Number(vendasMes._sum.total) || 0
    const vendasTrimestreBruto = Number(vendasTrimestre._sum.total) || 0
    const vendasAnoBruto = Number(vendasAno._sum.total) || 0

    const devolvidoMes = Number(devolucoesMes._sum.totalDevolvido) || 0
    const substituidoMes = Number(devolucoesMes._sum.totalSubstituido) || 0
    const devolvidoTrimestre = Number(devolucoesTrimestre._sum.totalDevolvido) || 0
    const substituidoTrimestre = Number(devolucoesTrimestre._sum.totalSubstituido) || 0
    const devolvidoAno = Number(devolucoesAno._sum.totalDevolvido) || 0
    const substituidoAno = Number(devolucoesAno._sum.totalSubstituido) || 0

    const vendasMesTotal = vendasMesBruto - devolvidoMes + substituidoMes
    const vendasTrimestreTotal = vendasTrimestreBruto - devolvidoTrimestre + substituidoTrimestre
    const vendasAnoTotal = vendasAnoBruto - devolvidoAno + substituidoAno

    const pendentesTotal = Number(cobrancasPendentes._sum.valor) || 0
    const objMensal = Number(objetivoMensal?.objetivo) || 0
    const objTrimestral = Number(objetivoTrimestral?.objetivo) || 0
    const objAnual = Number(objetivoAnual?.objetivo) || 0

    const premiosMensaisData = premiosMensais.map(p => ({
      minimo: Number(p.minimo),
      premio: Number(p.premio)
    }))
    const premiosTrimestraisData = premiosTrimestrais.map(p => ({
      minimo: Number(p.minimo),
      premio: Number(p.premio)
    }))

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

    const anosDisponiveis = await prisma.venda.findMany({
      select: { ano: true },
      distinct: ["ano"],
      orderBy: { ano: "desc" }
    })

    // Process objetivos varios data
    const objetivosVariosData = objetivosVarios.map(o => {
      const totalObjetivo = o.produtos.reduce((sum, p) => sum + Number(p.precoSemIva) * p.quantidade, 0)
      const totalVendido = o.vendas.reduce((sum, v) => sum + Number(v.objetivoVarioValor || 0), 0)
      const progresso = totalObjetivo > 0 ? (totalVendido / totalObjetivo) * 100 : 0
      
      return {
        id: o.id,
        titulo: o.titulo,
        descricao: o.descricao,
        totalObjetivo,
        totalVendido,
        progresso,
        vendasCount: o.vendas.length,
        produtosCount: o.produtos.length,
        atingido: progresso >= 100
      }
    })

    const responseData = {
      totalClientes,
      clientesAtivos,
      vendasMes: vendasMesTotal,
      vendasTrimestre: vendasTrimestreTotal,
      vendasAno: vendasAnoTotal,
      vendasMesBruto,
      vendasTrimestreBruto,
      vendasAnoBruto,
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
      })),
      cobrancasStats: {
        pendentesCount: cobrancasPendentesCount,
        pendentesValor: pendentesTotal,
        pagasCount: cobrancasPagasCount,
        pagasValor: Number(cobrancasPagasValor._sum.valor) || 0,
        comissaoMensal: Number(comissaoMensal._sum.comissao) || 0
      },
      objetivosVarios: objetivosVariosData
    }

    cache.set(cacheKey, responseData, { ttl: 60, tags: [cacheTags.dashboard] })

    logger.info("Dashboard loaded", { userId, duration: timer.elapsed() })

    return NextResponse.json(responseData)
  } catch (error) {
    if (error instanceof NextResponse) {
      return error
    }
    logger.error("Error fetching dashboard data", { error: String(error), duration: timer.elapsed() })
    return NextResponse.json({ error: "Erro ao carregar dados" }, { status: 500 })
  }
}
