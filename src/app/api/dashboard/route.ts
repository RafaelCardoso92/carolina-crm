import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logger, createTimer } from "@/lib/logger"
import { requirePermission } from "@/lib/api-auth"
import { PERMISSIONS, userScopedWhere } from "@/lib/permissions"
import { valorPendenteCobranca, emAtraso, comissaoGanha, pagoNoMes } from "@/lib/cobranca-valores"

export async function GET(request: Request) {
  const timer = createTimer()

  try {
    const session = await requirePermission(PERMISSIONS.DASHBOARD_READ)
    const userId = session.user?.id || "anonymous"

    const { searchParams } = new URL(request.url)
    const ano = parseInt(searchParams.get("ano") || new Date().getFullYear().toString())
    const mes = parseInt(searchParams.get("mes") || (new Date().getMonth() + 1).toString())
    const seller = searchParams.get("seller")
    const trimestre = Math.ceil(mes / 3)

    const userFilter = userScopedWhere(session, seller)
    // No response cache: it was keyed on the real user (not the impersonated one) and went stale after every payment

    const now = new Date()
    const hoje = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const daquiA7Dias = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const proximasWhere = { pago: false, dataVencimento: { gte: hoje, lte: daquiA7Dias }, cobranca: { cliente: userFilter } }
    const inicioMes = new Date(ano, mes - 1, 1)
    const fimMes = new Date(ano, mes, 1)

    const [
      totalClientes,
      clientesAtivos,
      vendasMes,
      vendasTrimestre,
      vendasAno,
      devolucoesMes,
      devolucoesTrimestre,
      devolucoesAno,
      cobrancasPorPagar,
      objetivoMensal,
      objetivoTrimestral,
      objetivoAnual,
      premiosMensais,
      premiosTrimestrais,
      proximasParcelas,
      proximasParcelasAgg,
      cobrancasPendentesCount,
      cobrancasPagasCount,
      cobrancasPagasValor,
      parcelasPagasMes,
      cobrancasSemParcelasPagasMes,
      objetivosVarios,
      vendasPorObjetivo,
      variosMetas
    ] = await Promise.all([
      prisma.cliente.count({ where: userFilter }),
      prisma.cliente.count({ where: { ativo: true, ...userFilter } }),
      prisma.venda.aggregate({
        where: { mes, ano, cliente: userFilter },
        _sum: { total: true }
      }),
      prisma.venda.aggregate({
        where: {
          ano,
          mes: { gte: (trimestre - 1) * 3 + 1, lte: trimestre * 3 },
          cliente: userFilter
        },
        _sum: { total: true }
      }),
      prisma.venda.aggregate({
        where: { ano, cliente: userFilter },
        _sum: { total: true }
      }),
      prisma.devolucao.aggregate({
        where: { venda: { mes, ano, cliente: userFilter } },
        _sum: { totalDevolvido: true, totalSubstituido: true }
      }),
      prisma.devolucao.aggregate({
        where: {
          venda: { ano, mes: { gte: (trimestre - 1) * 3 + 1, lte: trimestre * 3 }, cliente: userFilter }
        },
        _sum: { totalDevolvido: true, totalSubstituido: true }
      }),
      prisma.devolucao.aggregate({
        where: { venda: { ano, cliente: userFilter } },
        _sum: { totalDevolvido: true, totalSubstituido: true }
      }),
      // Unpaid cobranças with their parcelas: "A Receber" and overdue are computed from what was actually paid
      prisma.cobranca.findMany({
        where: { pago: false, cliente: userFilter },
        select: {
          valor: true, pago: true, valorPago: true, dataVencimento: true,
          parcelas: { select: { valor: true, pago: true, valorPago: true, dataVencimento: true } }
        }
      }),
      prisma.objetivoMensal.findUnique({ where: { mes_ano: { mes, ano } } }),
      prisma.objetivoTrimestral.findUnique({ where: { trimestre_ano: { trimestre, ano } } }),
      prisma.objetivoAnual.findUnique({ where: { ano } }),
      prisma.premioMensal.findMany({ orderBy: { minimo: "asc" } }),
      prisma.premioTrimestral.findMany({ orderBy: { minimo: "asc" } }),
      prisma.parcela.findMany({
        where: proximasWhere,
        include: { cobranca: { include: { cliente: true } } },
        orderBy: { dataVencimento: "asc" },
        take: 5
      }),
      prisma.parcela.aggregate({ where: proximasWhere, _count: true, _sum: { valor: true } }),
      prisma.cobranca.count({ where: { pago: false, cliente: userFilter } }),
      prisma.cobranca.count({ where: { pago: true, cliente: userFilter } }),
      prisma.cobranca.aggregate({
        where: { pago: true, cliente: userFilter },
        _sum: { valor: true }
      }),
      // Commission earned in the month = share of each cobrança's commission paid in the month
      prisma.parcela.findMany({
        where: { pago: true, dataPago: { gte: inicioMes, lt: fimMes }, cobranca: { cliente: userFilter } },
        select: { valor: true, pago: true, valorPago: true, cobranca: { select: { valor: true, comissao: true, tipoDocumento: true } } }
      }),
      prisma.cobranca.findMany({
        where: { dataPago: { gte: inicioMes, lt: fimMes }, parcelas: { none: {} }, cliente: userFilter },
        select: { valor: true, pago: true, valorPago: true, dataPago: true, comissao: true, tipoDocumento: true }
      }),
      // Objetivos Vários by activity in the period (same rule as the vendas page VariosCard)
      prisma.objetivoVario.findMany({
        where: { ativo: true, ...userFilter },
        include: { produtos: true },
        orderBy: { titulo: "asc" }
      }),
      prisma.venda.groupBy({
        by: ["objetivoVarioId"],
        where: { mes, ano, objetivoVarioId: { not: null }, cliente: userFilter },
        _sum: { objetivoVarioValor: true },
        _count: true
      }),
      prisma.objetivoVarioMeta.findMany({ where: { mes, ano }, select: { objetivoVarioId: true, objetivo: true } })
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

    const pendentesTotal = Math.round(cobrancasPorPagar.reduce((s, c) => s + valorPendenteCobranca(c), 0) * 100) / 100
    const atrasos = cobrancasPorPagar.map(c => emAtraso(c, now))
    const parcelasAtrasadas = atrasos.reduce((s, a) => s + a.count, 0)
    const valorAtrasado = Math.round(atrasos.reduce((s, a) => s + a.valor, 0) * 100) / 100
    // Commission counts in the month the invoice/parcela was paid. C.I. is paid apart (Christmas/holiday pay):
    // never added to comissaoMensal, summed on its own.
    const comissaoDe = (ci: boolean) => Math.round((
      parcelasPagasMes.filter(p => (p.cobranca.tipoDocumento === "CONSUMO_INTERNO") === ci).reduce((s, p) => s + comissaoGanha(p.cobranca, Number(p.valor)), 0) +
      cobrancasSemParcelasPagasMes.filter(c => (c.tipoDocumento === "CONSUMO_INTERNO") === ci).reduce((s, c) => s + comissaoGanha(c, pagoNoMes(c, ano, mes - 1)), 0)
    ) * 100) / 100
    const comissaoMensal = comissaoDe(false)
    const comissaoMensalCI = comissaoDe(true)
    const objMensal = Number(objetivoMensal?.objetivo) || 0
    const objTrimestral = Number(objetivoTrimestral?.objetivo) || 0
    const objAnual = Number(objetivoAnual?.objetivo) || 0

    const premiosMensaisData = premiosMensais.map(p => ({ minimo: Number(p.minimo), premio: Number(p.premio) }))
    const premiosTrimestraisData = premiosTrimestrais.map(p => ({ minimo: Number(p.minimo), premio: Number(p.premio) }))

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
      where: { cliente: userFilter },
      select: { ano: true },
      distinct: ["ano"],
      orderBy: { ano: "desc" }
    })

    // Shown when a venda of this period links to it or a meta exists for this period (not by creation month)
    const metaPorObjetivo = new Map(variosMetas.map(m => [m.objetivoVarioId, Number(m.objetivo)]))
    const vendasPorObjetivoId = new Map(vendasPorObjetivo.map(v => [v.objetivoVarioId, v]))
    const objetivosVariosData = objetivosVarios
      .filter(o => vendasPorObjetivoId.has(o.id) || metaPorObjetivo.has(o.id))
      .map(o => {
        const agg = vendasPorObjetivoId.get(o.id)
        const totalObjetivo = metaPorObjetivo.get(o.id) ?? o.produtos.reduce((sum, p) => sum + Number(p.precoSemIva) * p.quantidade, 0)
        const totalVendido = Number(agg?._sum.objetivoVarioValor ?? 0)
        const progresso = totalObjetivo > 0 ? (totalVendido / totalObjetivo) * 100 : 0
        return {
          id: o.id, titulo: o.titulo, descricao: o.descricao, totalObjetivo, totalVendido, progresso,
          vendasCount: agg?._count ?? 0, produtosCount: o.produtos.length, atingido: progresso >= 100
        }
      })

    const responseData = {
      totalClientes, clientesAtivos,
      vendasMes: vendasMesTotal, vendasTrimestre: vendasTrimestreTotal, vendasAno: vendasAnoTotal,
      vendasMesBruto, vendasTrimestreBruto, vendasAnoBruto,
      devolucoesMes: { devolvido: devolvidoMes, substituido: substituidoMes, liquido: devolvidoMes - substituidoMes },
      devolucoesTrimestre: { devolvido: devolvidoTrimestre, substituido: substituidoTrimestre, liquido: devolvidoTrimestre - substituidoTrimestre },
      devolucoesAno: { devolvido: devolvidoAno, substituido: substituidoAno, liquido: devolvidoAno - substituidoAno },
      pendentes: pendentesTotal, objetivoMensal: objMensal, objetivoTrimestral: objTrimestral, objetivoAnual: objAnual,
      progressoMensal: objMensal > 0 ? (vendasMesTotal / objMensal) * 100 : 0,
      progressoTrimestral: objTrimestral > 0 ? (vendasTrimestreTotal / objTrimestral) * 100 : 0,
      progressoAnual: objAnual > 0 ? (vendasAnoTotal / objAnual) * 100 : 0,
      currentMonth: mes, currentYear: ano, currentTrimestre: trimestre,
      premioMensalAtual, proximoPremioMensal, premioTrimestralAtual, proximoPremioTrimestral,
      anosDisponiveis: anosDisponiveis.map(a => a.ano),
      parcelasAtrasadas, valorAtrasado,
      proximasParcelasCount: proximasParcelasAgg._count,
      proximasParcelasValor: Number(proximasParcelasAgg._sum.valor) || 0,
      proximasParcelas: proximasParcelas.map(p => ({
        id: p.id, numero: p.numero, valor: Number(p.valor), dataVencimento: p.dataVencimento,
        clienteNome: p.cobranca.cliente.nome, cobrancaId: p.cobrancaId, fatura: p.cobranca.fatura
      })),
      cobrancasStats: {
        pendentesCount: cobrancasPendentesCount, pendentesValor: pendentesTotal,
        pagasCount: cobrancasPagasCount, pagasValor: Number(cobrancasPagasValor._sum.valor) || 0,
        comissaoMensal,
        comissaoMensalCI
      },
      objetivosVarios: objetivosVariosData
    }

    logger.info("Dashboard loaded", { userId, duration: timer.elapsed() })

    return NextResponse.json(responseData)
  } catch (error) {
    if (error instanceof NextResponse) return error
    logger.error("Error fetching dashboard data", { error: String(error), duration: timer.elapsed() })
    return NextResponse.json({ error: "Erro ao carregar dados" }, { status: 500 })
  }
}
