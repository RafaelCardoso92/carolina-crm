import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { isAdminOrHigher } from "@/lib/permissions"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!isAdminOrHigher(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const mes = parseInt(searchParams.get("mes") || (new Date().getMonth() + 1).toString())
    const ano = parseInt(searchParams.get("ano") || new Date().getFullYear().toString())
    const sellerId = searchParams.get("sellerId")

    // Get all active sellers
    const sellers = await prisma.user.findMany({
      where: { 
        status: "ACTIVE",
        role: "SELLER",
        ...(sellerId ? { id: sellerId } : {})
      },
      select: { id: true, name: true, email: true, createdAt: true }
    })

    // Calculate metrics for each seller
    const metricsPromises = sellers.map(async (seller) => {
      const trimestre = Math.ceil(mes / 3)
      const trimestreStart = (trimestre - 1) * 3 + 1
      const trimestreEnd = trimestre * 3

      // Get all data in parallel
      const [
        clientesTotal,
        clientesAtivos,
        clientesNovosMes,
        prospectosTotal,
        prospectosConvertidos,
        vendasMes,
        vendasTrimestre,
        vendasAno,
        tarefasPendentes,
        tarefasConcluidas,
        cobrancasPendentes,
        cobrancasPagas,
        objetivoMensal,
        objetivoTrimestral,
        objetivoAnual
      ] = await Promise.all([
        // Clientes
        prisma.cliente.count({ where: { userId: seller.id } }),
        prisma.cliente.count({ where: { userId: seller.id, ativo: true } }),
        prisma.cliente.count({ 
          where: { 
            userId: seller.id, 
            createdAt: { 
              gte: new Date(ano, mes - 1, 1), 
              lt: new Date(ano, mes, 1) 
            } 
          } 
        }),
        // Prospectos
        prisma.prospecto.count({ where: { userId: seller.id } }),
        prisma.prospecto.count({ where: { userId: seller.id, estado: "GANHO" } }),
        // Vendas
        prisma.venda.aggregate({
          where: { cliente: { userId: seller.id }, mes, ano },
          _sum: { total: true },
          _count: true
        }),
        prisma.venda.aggregate({
          where: { 
            cliente: { userId: seller.id }, 
            ano, 
            mes: { gte: trimestreStart, lte: trimestreEnd } 
          },
          _sum: { total: true }
        }),
        prisma.venda.aggregate({
          where: { cliente: { userId: seller.id }, ano },
          _sum: { total: true }
        }),
        // Tarefas
        prisma.tarefa.count({ where: { userId: seller.id, estado: { not: "CONCLUIDA" } } }),
        prisma.tarefa.count({ 
          where: { 
            userId: seller.id, 
            estado: "CONCLUIDA",
            updatedAt: { gte: new Date(ano, mes - 1, 1), lt: new Date(ano, mes, 1) }
          } 
        }),
        // Cobrancas
        prisma.cobranca.aggregate({
          where: { cliente: { userId: seller.id }, pago: false },
          _sum: { valor: true },
          _count: true
        }),
        prisma.cobranca.aggregate({
          where: { 
            cliente: { userId: seller.id }, 
            pago: true,
            dataPago: { gte: new Date(ano, mes - 1, 1), lt: new Date(ano, mes, 1) }
          },
          _sum: { valor: true },
          _count: true
        }),
        // Objetivos
        prisma.objetivoMensal.findUnique({ where: { mes_ano: { mes, ano } } }),
        prisma.objetivoTrimestral.findUnique({ where: { trimestre_ano: { trimestre, ano } } }),
        prisma.objetivoAnual.findUnique({ where: { ano } })
      ])

      const vendasMesTotal = Number(vendasMes._sum.total || 0)
      const vendasTrimestreTotal = Number(vendasTrimestre._sum.total || 0)
      const vendasAnoTotal = Number(vendasAno._sum.total || 0)
      
      const objMensal = objetivoMensal ? Number(objetivoMensal.objetivo) : 0
      const objTrimestral = objetivoTrimestral ? Number(objetivoTrimestral.objetivo) : 0
      const objAnual = objetivoAnual ? Number(objetivoAnual.objetivo) : 0

      return {
        seller: {
          id: seller.id,
          name: seller.name,
          email: seller.email,
          since: seller.createdAt
        },
        clientes: {
          total: clientesTotal,
          ativos: clientesAtivos,
          novosMes: clientesNovosMes
        },
        prospectos: {
          total: prospectosTotal,
          convertidos: prospectosConvertidos,
          taxaConversao: prospectosTotal > 0 ? Math.round((prospectosConvertidos / prospectosTotal) * 100) : 0
        },
        vendas: {
          mes: {
            total: vendasMesTotal,
            count: vendasMes._count,
            objetivo: objMensal,
            progresso: objMensal > 0 ? Math.round((vendasMesTotal / objMensal) * 100) : 0
          },
          trimestre: {
            total: vendasTrimestreTotal,
            objetivo: objTrimestral,
            progresso: objTrimestral > 0 ? Math.round((vendasTrimestreTotal / objTrimestral) * 100) : 0
          },
          ano: {
            total: vendasAnoTotal,
            objetivo: objAnual,
            progresso: objAnual > 0 ? Math.round((vendasAnoTotal / objAnual) * 100) : 0
          },
          ticketMedio: vendasMes._count > 0 ? vendasMesTotal / vendasMes._count : 0
        },
        tarefas: {
          pendentes: tarefasPendentes,
          concluidasMes: tarefasConcluidas
        },
        cobrancas: {
          pendentes: {
            count: cobrancasPendentes._count,
            valor: Number(cobrancasPendentes._sum.valor || 0)
          },
          recebidoMes: {
            count: cobrancasPagas._count,
            valor: Number(cobrancasPagas._sum.valor || 0)
          }
        }
      }
    })

    const metrics = await Promise.all(metricsPromises)

    return NextResponse.json({
      mes,
      ano,
      sellers: metrics
    })
  } catch (error) {
    console.error("Error fetching seller metrics:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
