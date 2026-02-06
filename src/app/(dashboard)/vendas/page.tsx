import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { userScopedWhere, isAdminOrHigher } from "@/lib/permissions"

export const dynamic = 'force-dynamic'
import VendasView from "./VendasView"
import SellerTabs from "@/components/SellerTabs"

const meses = [
  "", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
]

// Helper to convert Decimal to number for serialization
function serializeDecimal(value: unknown): number | null {
  if (value === null || value === undefined) return null
  return Number(value)
}

// Serialize venda data for client component
function serializeVendas(vendas: Awaited<ReturnType<typeof fetchVendas>>) {
  return vendas.map(v => ({
    ...v,
    valor1: serializeDecimal(v.valor1),
    valor2: serializeDecimal(v.valor2),
    total: serializeDecimal(v.total),
    cobranca: v.cobranca ? {
      ...v.cobranca,
      valor: serializeDecimal(v.cobranca.valor),
      valorSemIva: serializeDecimal(v.cobranca.valorSemIva),
      comissao: serializeDecimal(v.cobranca.comissao),
    } : null,
    itens: v.itens?.map(item => ({
      ...item,
      quantidade: serializeDecimal(item.quantidade),
      precoUnit: serializeDecimal(item.precoUnit),
      subtotal: serializeDecimal(item.subtotal),
      devolucoes: item.devolucoes?.map(d => ({
        ...d,
        quantidade: serializeDecimal(d.quantidade),
      }))
    })),
    devolucoes: v.devolucoes?.map(d => ({
      ...d,
      totalDevolvido: serializeDecimal(d.totalDevolvido),
      totalSubstituido: serializeDecimal(d.totalSubstituido),
      venda: d.venda ? {
        ...d.venda,
        valor1: serializeDecimal(d.venda.valor1),
        valor2: serializeDecimal(d.venda.valor2),
        total: serializeDecimal(d.venda.total),
      } : null,
      itens: d.itens?.map(item => ({
        ...item,
        quantidade: serializeDecimal(item.quantidade),
        valorUnitario: serializeDecimal(item.valorUnitario),
        subtotal: serializeDecimal(item.subtotal),
        qtdSubstituicao: serializeDecimal(item.qtdSubstituicao),
        precoSubstituicao: serializeDecimal(item.precoSubstituicao),
        subtotalSubstituicao: serializeDecimal(item.subtotalSubstituicao),
        itemVenda: item.itemVenda ? {
          ...item.itemVenda,
          quantidade: serializeDecimal(item.itemVenda.quantidade),
          precoUnit: serializeDecimal(item.itemVenda.precoUnit),
          subtotal: serializeDecimal(item.itemVenda.subtotal),
        } : null,
        substituicao: item.substituicao ? {
          ...item.substituicao,
          preco: serializeDecimal(item.substituicao.preco),
        } : null,
      }))
    })),
    incidencias: v.incidencias?.map(inc => ({
      ...inc,
      valor: serializeDecimal(inc.valor),
    }))
  }))
}

async function fetchVendas(mes: number, ano: number, userFilter: { userId?: string }) {
  return prisma.venda.findMany({
    where: { mes, ano, ...(userFilter.userId ? { cliente: { userId: userFilter.userId } } : {}) },
    include: {
      cobranca: true,
      cliente: true,
      objetivoVario: true,
      campanhas: {
        include: {
          campanha: true
        }
      },
      itens: {
        include: {
          produto: true,
          devolucoes: true
        },
        orderBy: { createdAt: "asc" }
      },
      incidencias: true,
      devolucoes: {
        include: {
          venda: {
            include: { cliente: true }
          },
          imagens: true,
          itens: {
            include: {
              itemVenda: {
                include: { produto: true }
              },
              substituicao: true
            }
          }
        }
      }
    },
    orderBy: { cliente: { nome: "asc" } }
  })
}

async function getVendasData(mes: number, ano: number, userFilter: { userId?: string }) {
  const [vendas, clientes, objetivo, produtos, objetivosVarios, campanhas] = await Promise.all([
    fetchVendas(mes, ano, userFilter),
    prisma.cliente.findMany({
      where: { ativo: true, ...userFilter },
      orderBy: { nome: "asc" }
    }),
    prisma.objetivoMensal.findUnique({
      where: { mes_ano: { mes, ano } }
    }),
    prisma.produto.findMany({
      where: { ativo: true },
      select: {
        id: true,
        nome: true,
        codigo: true,
        categoria: true,
        preco: true
      },
      orderBy: { nome: "asc" }
    }),
    prisma.objetivoVario.findMany({
      where: { ativo: true, mes, ano, ...userFilter },
      include: {
        produtos: true
      },
      orderBy: { titulo: "asc" }
    }),
    prisma.campanha.findMany({
      where: { ativo: true, mes, ano, ...userFilter },
      select: {
        id: true,
        titulo: true,
        mes: true,
        ano: true
      },
      orderBy: { titulo: "asc" }
    })
  ])

  const total = vendas.reduce((sum, v) => sum + Number(v.total), 0)
  const serializedVendas = serializeVendas(vendas)

  return { vendas: serializedVendas, clientes, objetivo, total, produtos, objetivosVarios, campanhas }
}

export default async function VendasPage({
  searchParams
}: {
  searchParams: Promise<{ mes?: string; ano?: string; seller?: string }>
}) {
  const session = await auth()
  
  if (!session?.user) {
    redirect("/login")
  }

  const params = await searchParams
  const currentDate = new Date()
  const mes = params.mes ? parseInt(params.mes) : currentDate.getMonth() + 1
  const ano = params.ano ? parseInt(params.ano) : currentDate.getFullYear()
  const selectedSeller = params.seller || null
  const showSellerTabs = isAdminOrHigher(session.user.role)

  const userFilter = userScopedWhere(session, selectedSeller)
  const data = await getVendasData(mes, ano, userFilter)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Vendas</h1>
        <p className="text-gray-500">{meses[mes]} {ano}</p>
      </div>

      {showSellerTabs && <SellerTabs />}

      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <VendasView
        vendas={data.vendas as any}
        clientes={data.clientes}
        produtos={data.produtos.map(p => ({
          ...p,
          preco: p.preco ? String(p.preco) : null
        }))}
        objetivosVarios={data.objetivosVarios.map(o => ({
          id: o.id,
          titulo: o.titulo,
          mes: o.mes,
          ano: o.ano
        }))}
        campanhas={data.campanhas}
        objetivo={data.objetivo ? Number(data.objetivo.objetivo) : null}
        total={data.total}
        mes={mes}
        ano={ano}
        meses={meses}
      />
    </div>
  )
}
