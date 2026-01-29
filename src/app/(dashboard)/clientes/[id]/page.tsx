import { prisma } from "@/lib/prisma"
import { formatCurrency } from "@/lib/utils"

export const dynamic = "force-dynamic"
import Link from "next/link"
import { notFound } from "next/navigation"
import ClientAnalytics from "./ClientAnalytics"
import ClienteAIInsights from "@/components/ClienteAIInsights"
import CommunicationLog from "@/components/CommunicationLog"
import SampleTracking from "@/components/SampleTracking"
import CustomerSegmentation from "@/components/CustomerSegmentation"
import WhatsAppButton from "@/components/WhatsAppButton"
import QuickReorder from "./QuickReorder"

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

async function getProdutos() {
  return prisma.produto.findMany({
    where: { ativo: true },
    select: { id: true, nome: true }
  })
}

const meses = [
  "", "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez"
]

export default async function ClienteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [cliente, produtos] = await Promise.all([
    getCliente(id),
    getProdutos()
  ])

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
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-foreground">{cliente.nome}</h1>
              <WhatsAppButton telefone={cliente.telefone} nome={cliente.nome} size="lg" />
            </div>
            {cliente.codigo && <p className="text-muted-foreground">Código: {cliente.codigo}</p>}
          </div>
          <div className="flex gap-2">
            <Link
              href={`/clientes/${id}/editar`}
              className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-hover transition"
            >
              Editar
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
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

      {/* Contact Info and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-card rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Informacoes</h3>
          <dl className="space-y-3">
            {cliente.telefone && (
              <div className="flex items-center justify-between">
                <div>
                  <dt className="text-sm text-muted-foreground">Telefone</dt>
                  <dd className="text-foreground">{cliente.telefone}</dd>
                </div>
                <WhatsAppButton telefone={cliente.telefone} nome={cliente.nome} />
              </div>
            )}
            {cliente.email && (
              <div>
                <dt className="text-sm text-muted-foreground">Email</dt>
                <dd className="text-foreground">
                  <a href={`mailto:${cliente.email}`} className="text-primary hover:underline">{cliente.email}</a>
                </dd>
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

        {/* Customer Segmentation */}
        <CustomerSegmentation clienteId={id} />

        {/* Quick Actions */}
        <div className="bg-card rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Acoes Rapidas</h3>
          <div className="space-y-3">
            <Link
              href={`/vendas?clienteId=${id}`}
              className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg hover:bg-primary/20 transition"
            >
              <span className="p-2 bg-primary rounded-lg text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </span>
              <span className="font-medium text-foreground">Nova Venda</span>
            </Link>
            {cliente.vendas.length > 0 && (
              <QuickReorder vendaId={cliente.vendas[0].id} clienteNome={cliente.nome} />
            )}
            <Link
              href={`/cobrancas?clienteId=${id}`}
              className="flex items-center gap-3 p-3 bg-secondary rounded-lg hover:bg-secondary/80 transition"
            >
              <span className="p-2 bg-orange-500 rounded-lg text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </span>
              <span className="font-medium text-foreground">Nova Cobranca</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Communication Log and Samples */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <CommunicationLog clienteId={id} />
        <SampleTracking clienteId={id} produtos={produtos} />
      </div>

      {/* Sales History */}
      <div className="bg-card rounded-xl shadow-sm p-6 mb-8">
        <h3 className="text-lg font-semibold text-foreground mb-4">Ultimas Vendas</h3>
        {cliente.vendas.length > 0 ? (
          <ul className="space-y-2">
            {cliente.vendas.map((venda) => (
              <li key={venda.id} className="py-3 border-b border-border last:border-0">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{meses[venda.mes]} {venda.ano}</span>
                  <span className="font-medium text-foreground">{formatCurrency(Number(venda.total))} EUR</span>
                </div>
                {venda.itens && venda.itens.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
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

      {/* Product Analytics Section */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-foreground mb-4">Analise de Produtos</h2>
        <ClientAnalytics clienteId={id} />
      </div>

      {/* AI Insights */}
      <div className="mb-8">
        <ClienteAIInsights clienteId={id} />
      </div>

      {/* Cobrancas */}
      <div className="bg-card rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Cobrancas</h3>
        {cliente.cobrancas.length > 0 ? (
          <>
            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {cliente.cobrancas.map((cobranca) => (
                <div key={cobranca.id} className={`bg-secondary/30 rounded-lg p-3 border-l-4 ${
                  cobranca.pago ? "border-green-500" : "border-orange-500"
                }`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium text-foreground">{cobranca.fatura || "Sem fatura"}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      cobranca.pago ? "bg-green-500/20 text-green-600 dark:text-green-400" : "bg-orange-500/20 text-orange-600 dark:text-orange-400"
                    }`}>
                      {cobranca.pago ? "Pago" : "Pendente"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Valor: </span>
                      <span className="font-semibold text-foreground">{formatCurrency(Number(cobranca.valor))} EUR</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Comissao: </span>
                      <span className="text-foreground">{cobranca.comissao ? `${formatCurrency(Number(cobranca.comissao))} EUR` : "-"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-2 text-left text-sm font-medium text-muted-foreground">Fatura</th>
                    <th className="py-2 text-left text-sm font-medium text-muted-foreground">Valor</th>
                    <th className="py-2 text-left text-sm font-medium text-muted-foreground">Comissao</th>
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
            </div>
          </>
        ) : (
          <p className="text-muted-foreground text-sm">Sem cobrancas registadas</p>
        )}
      </div>
    </div>
  )
}
