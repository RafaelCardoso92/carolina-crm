import { prisma } from "@/lib/prisma"
import { formatCurrency } from "@/lib/utils"
import { auth } from "@/lib/auth"
import { userScopedWhere } from "@/lib/permissions"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"
import Link from "next/link"
import { notFound } from "next/navigation"
import ClientAnalytics from "./ClientAnalytics"
import CommunicationLog from "@/components/CommunicationLog"
import SampleTracking from "@/components/SampleTracking"
import CustomerSegmentation from "@/components/CustomerSegmentation"
import AcordoParceria from "@/components/AcordoParceria"
import WhatsAppButton from "@/components/WhatsAppButton"

import QuickReorder from "./QuickReorder"
import ClienteActions from "./ClienteActions"
import CreditoCliente from "@/components/CreditoCliente"
import StatCard from "@/components/ui/StatCard"

async function getCliente(id: string, session: any) {
  return prisma.cliente.findFirst({
    where: {
      id,
      ...userScopedWhere(session)
    },
    include: {
      vendas: {
        orderBy: [{ ano: "desc" }, { mes: "desc" }],
        include: {
          itens: {
            include: { produto: true }
          }
        }
      },
      cobrancas: {
        orderBy: { createdAt: "desc" }
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
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const { id } = await params
  const [cliente, produtos] = await Promise.all([
    getCliente(id, session),
    getProdutos()
  ])

  if (!cliente) {
    notFound()
  }

  const anoAtual = new Date().getFullYear()
  const totalAno = (ano: number) => cliente.vendas.filter(v => v.ano === ano).reduce((sum, v) => sum + Number(v.total), 0)
  const totalVendas = totalAno(anoAtual)
  const totalVendasAnterior = totalAno(anoAtual - 1)
  const anosVendas = [...new Set(cliente.vendas.map(v => v.ano))]
  const totalCobrancas = cliente.cobrancas.filter(c => (c.dataEmissao ?? c.createdAt).getFullYear() === anoAtual).reduce((sum, c) => sum + Number(c.valor), 0)
  const pendentes = cliente.cobrancas.filter(c => !c.pago).reduce((sum, c) => sum + Number(c.valor) - Number(c.valorPago ?? 0), 0)
  const ultimasCobrancas = cliente.cobrancas.slice(0, 10)
  const saldoCredito = Number(cliente.saldoCredito || 0)

  return (
    <div>
      <div className="mb-8">
        <Link href="/clientes" className="text-primary hover:text-primary-hover inline-flex items-center gap-1 min-h-11 mb-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Voltar
        </Link>
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground break-words">{cliente.nome}</h1>
              <WhatsAppButton telefone={cliente.telefone} nome={cliente.nome} size="lg" />
            </div>
            {cliente.codigo && <p className="text-muted-foreground">Código: {cliente.codigo}</p>}
          </div>
          <ClienteActions 
            clienteId={id} 
            clienteNome={cliente.nome} 
            currentSellerId={cliente.userId || ""} 
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-8">
        <StatCard
          label={`Total Vendas ${anoAtual}`}
          value={`${formatCurrency(totalVendas)} €`}
          sub={totalVendasAnterior > 0 ? `${anoAtual - 1}: ${formatCurrency(totalVendasAnterior)} €` : undefined}
          tone="good"
        />
        <StatCard label={`Total Faturado ${anoAtual}`} value={`${formatCurrency(totalCobrancas)} €`} />
        <StatCard label="Por Receber" value={`${formatCurrency(pendentes)} €`} tone={pendentes > 0 ? "pending" : "none"} />
        <StatCard label="Crédito Disponível" value={`${formatCurrency(saldoCredito)} €`} tone={saldoCredito > 0 ? "primary" : "none"} />
      </div>

      {/* Credit History */}
      <div className="mb-8">
        <CreditoCliente clienteId={id} />
      </div>

      {/* Contact Info and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-card rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Informações</h3>
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
            {(cliente.morada || cliente.cidade || cliente.codigoPostal) && (
              <div>
                <dt className="text-sm text-muted-foreground">Morada</dt>
                <dd className="text-foreground">
                  {cliente.morada && <span>{cliente.morada}</span>}
                  {(cliente.cidade || cliente.codigoPostal) && (
                    <span className={cliente.morada ? " block text-muted-foreground text-sm mt-0.5" : ""}>
                      {[cliente.cidade, cliente.codigoPostal].filter(Boolean).join(", ")}
                    </span>
                  )}
                </dd>
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
          <h3 className="text-lg font-semibold text-foreground mb-4">Ações Rápidas</h3>
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
              <span className="font-medium text-foreground">Nova Cobrança</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Partnership Agreement */}
      <div className="mb-8">
        <AcordoParceria clienteId={id} />
      </div>

      {/* Communication Log and Samples */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <CommunicationLog clienteId={id} />
        <SampleTracking clienteId={id} produtos={produtos} />
      </div>

      {/* Sales History */}
      <div className="bg-card rounded-xl shadow-sm p-6 mb-8">
        <h3 className="text-lg font-semibold text-foreground mb-4">Vendas</h3>
        {cliente.vendas.length > 0 ? (
          <div className="space-y-6">
          {anosVendas.map((ano) => (
          <div key={ano}>
          <div className="flex justify-between items-baseline mb-2">
            <h4 className="font-semibold text-foreground">{ano}</h4>
            <span className="text-sm text-muted-foreground tabular-nums">Total {formatCurrency(totalAno(ano))} €</span>
          </div>
          <ul className="space-y-2">
            {cliente.vendas.filter(v => v.ano === ano).map((venda) => (
              <li key={venda.id} className="py-3 border-b border-border last:border-0">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{meses[venda.mes]} {venda.ano}</span>
                  <span className="font-medium text-foreground tabular-nums">{formatCurrency(Number(venda.total))} €</span>
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
          </div>
          ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">Sem vendas registadas</p>
        )}
      </div>

      {/* Product Analytics Section */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-foreground mb-4">Análise de Produtos</h2>
        <ClientAnalytics clienteId={id} />
      </div>

      {/* Cobrancas */}
      <div className="bg-card rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Cobranças</h3>
        {cliente.cobrancas.length > 0 ? (
          <div className="overflow-x-auto">
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
                {ultimasCobrancas.map((cobranca) => (
                  <tr key={cobranca.id} className="border-b border-border last:border-0">
                    <td className="py-3 text-foreground">{cobranca.fatura || "-"}</td>
                    <td className="py-3 text-foreground tabular-nums">{formatCurrency(Number(cobranca.valor))} €</td>
                    <td className="py-3 text-muted-foreground tabular-nums">{cobranca.comissao ? `${formatCurrency(Number(cobranca.comissao))} €` : "-"}</td>
                    <td className="py-3 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        cobranca.pago ? "bg-green-500/15 text-green-800 dark:text-green-300" : "bg-amber-500/15 text-amber-800 dark:text-amber-300"
                      }`}>
                        {cobranca.pago ? "Pago" : "Pendente"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">Sem cobranças registadas</p>
        )}
      </div>
    </div>
  )
}
