import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'
import VendasView from "./VendasView"

const meses = [
  "", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
]

async function getVendasData(mes: number, ano: number) {
  const [vendas, clientes, objetivo, produtos] = await Promise.all([
    prisma.venda.findMany({
      where: { mes, ano },
      include: {
        cliente: true,
        itens: {
          include: {
            produto: true,
            devolucoes: true
          },
          orderBy: { createdAt: "asc" }
        },
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
    }),
    prisma.cliente.findMany({
      where: { ativo: true },
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
    })
  ])

  const total = vendas.reduce((sum, v) => sum + Number(v.total), 0)

  return { vendas, clientes, objetivo, total, produtos }
}

export default async function VendasPage({
  searchParams
}: {
  searchParams: Promise<{ mes?: string; ano?: string }>
}) {
  const params = await searchParams
  const currentDate = new Date()
  const mes = params.mes ? parseInt(params.mes) : currentDate.getMonth() + 1
  const ano = params.ano ? parseInt(params.ano) : currentDate.getFullYear()

  const data = await getVendasData(mes, ano)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Vendas</h1>
        <p className="text-gray-500">{meses[mes]} {ano}</p>
      </div>

      <VendasView
        vendas={data.vendas}
        clientes={data.clientes}
        produtos={data.produtos.map(p => ({
          ...p,
          preco: p.preco ? String(p.preco) : null
        }))}
        objetivo={data.objetivo ? Number(data.objetivo.objetivo) : null}
        total={data.total}
        mes={mes}
        ano={ano}
        meses={meses}
      />
    </div>
  )
}
