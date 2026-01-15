import { prisma } from "@/lib/prisma"
import { formatCurrency } from "@/lib/utils"

export const dynamic = 'force-dynamic'
import Link from "next/link"
import { notFound } from "next/navigation"
import ClientAnalytics from "./ClientAnalytics"

async function getCliente(id: string) {
  return prisma.cliente.findUnique({
    where: { id },
    include: {
      vendas: {
        orderBy: [{ ano: "desc" }, { mes: "desc" }],
        take: 10,
        include: {
          itens: {
            include: { produto: true }
          }
        }
      },
      cobrancas: {
        orderBy: { createdAt: "desc" },
        take: 10
      }
    }
  })
}

const meses = [
  "", "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez"
]

export default async function ClienteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cliente = await getCliente(id)

  if (!cliente) {
    notFound()
  }

  const totalVendas = cliente.vendas.reduce((sum, v) => sum + Number(v.total), 0)
  const totalCobrancas = cliente.cobrancas.reduce((sum, c) => sum + Number(c.valor), 0)
  const pendentes = cliente.cobrancas.filter(c => !c.pago).reduce((sum, c) => sum + Number(c.valor), 0)

  return (
    <div>
      <div className="mb-8">
        <Link href="/clientes" className="text-primary hover:text-primary-hover flex items-center gap-1 mb-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Voltar
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{cliente.nome}</h1>
            {cliente.codigo && <p className="text-muted-foreground">Código: {cliente.codigo}</p>}
          </div>
          <Link
            href={`/clientes/${id}/editar`}
            className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-hover transition"
          >
            Editar
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-card rounded-xl shadow-sm p-6">
          <h3 className="text-sm font-medium text-muted-foreground">Total Vendas</h3>
          <p className="text-2xl font-bold text-foreground mt-2">{formatCurrency(totalVendas)} EUR</p>
        </div>
        <div className="bg-card rounded-xl shadow-sm p-6">
          <h3 className="text-sm font-medium text-muted-foreground">Total Faturado</h3>
          <p className="text-2xl font-bold text-foreground mt-2">{formatCurrency(totalCobrancas)} EUR</p>
        </div>
        <div className="bg-card rounded-xl shadow-sm p-6">
          <h3 className="text-sm font-medium text-muted-foreground">Por Receber</h3>
          <p className="text-2xl font-bold text-orange-600 mt-2">{formatCurrency(pendentes)} EUR</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-card rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Informações</h3>
          <dl className="space-y-3">
            {cliente.telefone && (
              <div>
                <dt className="text-sm text-muted-foreground">Telefone</dt>
                <dd className="text-foreground">{cliente.telefone}</dd>
              </div>
            )}
            {cliente.email && (
              <div>
                <dt className="text-sm text-muted-foreground">Email</dt>
                <dd className="text-foreground">{cliente.email}</dd>
              </div>
            )}
            {cliente.morada && (
              <div>
                <dt className="text-sm text-muted-foreground">Morada</dt>
                <dd className="text-foreground">{cliente.morada}</dd>
              </div>
            )}
            {cliente.notas && (
              <div>
                <dt className="text-sm text-muted-foreground">Notas</dt>
                <dd className="text-foreground">{cliente.notas}</dd>
              </div>
            )}
          </dl>
        </div>

        <div className="bg-card rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Últimas Vendas</h3>
          {cliente.vendas.length > 0 ? (
            <ul className="space-y-2">
              {cliente.vendas.map((venda) => (
                <li key={venda.id} className="py-2 border-b border-border last:border-0">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">{meses[venda.mes]} {venda.ano}</span>
                    <span className="font-medium text-foreground">{formatCurrency(Number(venda.total))} €</span>
                  </div>
                  {venda.itens && venda.itens.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {venda.itens.map((item, idx) => (
                        <span key={idx} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          {item.produto.nome} ({Number(item.quantidade)})
                        </span>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-sm">Sem vendas registadas</p>
          )}
        </div>
      </div>

      {/* Product Analytics Section */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-foreground mb-4">Análise de Produtos</h2>
        <ClientAnalytics clienteId={id} />
      </div>

      <div className="bg-card rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Cobranças</h3>
        {cliente.cobrancas.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2 text-left text-sm font-medium text-muted-foreground">Fatura</th>
                <th className="py-2 text-left text-sm font-medium text-muted-foreground">Valor</th>
                <th className="py-2 text-left text-sm font-medium text-muted-foreground">Comissão</th>
                <th className="py-2 text-center text-sm font-medium text-muted-foreground">Estado</th>
              </tr>
            </thead>
            <tbody>
              {cliente.cobrancas.map((cobranca) => (
                <tr key={cobranca.id} className="border-b border-border last:border-0">
                  <td className="py-3 text-foreground">{cobranca.fatura || "-"}</td>
                  <td className="py-3 text-foreground">{formatCurrency(Number(cobranca.valor))} EUR</td>
                  <td className="py-3 text-muted-foreground">{cobranca.comissao ? `${formatCurrency(Number(cobranca.comissao))} EUR` : "-"}</td>
                  <td className="py-3 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      cobranca.pago ? "bg-green-500/20 text-green-600 dark:text-green-400" : "bg-orange-500/20 text-orange-600 dark:text-orange-400"
                    }`}>
                      {cobranca.pago ? "Pago" : "Pendente"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-muted-foreground text-sm">Sem cobranças registadas</p>
        )}
      </div>
    </div>
  )
}
