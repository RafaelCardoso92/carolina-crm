import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'
import CobrancasView from "./CobrancasView"

async function getCobrancasData(ano: number | null) {
  const whereClause = ano ? {
    dataEmissao: {
      gte: new Date(`${ano}-01-01`),
      lt: new Date(`${ano + 1}-01-01`)
    }
  } : {}

  const [cobrancas, clientes] = await Promise.all([
    prisma.cobranca.findMany({
      where: whereClause,
      include: { cliente: true },
      orderBy: [{ pago: "asc" }, { dataEmissao: "desc" }]
    }),
    prisma.cliente.findMany({
      where: { ativo: true },
      orderBy: { nome: "asc" }
    })
  ])

  const pendentes = cobrancas.filter(c => !c.pago)
  const totalPendente = pendentes.reduce((sum, c) => sum + Number(c.valor), 0)
  const totalComissao = pendentes.reduce((sum, c) => sum + Number(c.comissao || 0), 0)

  return { cobrancas, clientes, totalPendente, totalComissao }
}

export default async function CobrancasPage({
  searchParams
}: {
  searchParams: Promise<{ ano?: string }>
}) {
  const params = await searchParams
  const ano = params.ano ? parseInt(params.ano) : null
  const data = await getCobrancasData(ano)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Cobrancas</h1>
        <p className="text-gray-500">Gestao de faturas e pagamentos</p>
      </div>

      <CobrancasView
        cobrancas={data.cobrancas}
        clientes={data.clientes}
        totalPendente={data.totalPendente}
        totalComissao={data.totalComissao}
        ano={ano}
      />
    </div>
  )
}
