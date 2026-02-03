import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'
import CobrancasView from "./CobrancasView"

// Helper to serialize Decimal to number
function serializeDecimal(value: unknown): number | null {
  if (value === null || value === undefined) return null
  return Number(value)
}

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
      include: {
        cliente: true,
        parcelas: {
          orderBy: { numero: "asc" }
        }
      },
      orderBy: [{ pago: "asc" }, { dataEmissao: "desc" }]
    }),
    prisma.cliente.findMany({
      where: { ativo: true },
      orderBy: { nome: "asc" }
    })
  ])

  // Serialize Decimal values for client component
  const serializedCobrancas = cobrancas.map(c => ({
    ...c,
    valor: serializeDecimal(c.valor),
    valorSemIva: serializeDecimal(c.valorSemIva),
    comissao: serializeDecimal(c.comissao),
    parcelas: c.parcelas.map(p => ({
      ...p,
      valor: serializeDecimal(p.valor)
    }))
  }))

  const pendentes = cobrancas.filter(c => !c.pago)
  const pagas = cobrancas.filter(c => c.pago)
  const totalPendente = pendentes.reduce((sum, c) => sum + Number(c.valor), 0)
  const totalComissao = pagas.reduce((sum, c) => sum + Number(c.comissao || 0), 0)

  return { cobrancas: serializedCobrancas, clientes, totalPendente, totalComissao }
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
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Cobranças</h1>
        <p className="text-muted-foreground flex items-center gap-2 mt-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          Gestão de faturas e pagamentos
        </p>
      </div>

      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <CobrancasView
        cobrancas={data.cobrancas as any}
        clientes={data.clientes}
        totalPendente={data.totalPendente}
        totalComissao={data.totalComissao}
        ano={ano}
      />
    </div>
  )
}
