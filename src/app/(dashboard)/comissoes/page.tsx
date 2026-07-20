export const dynamic = "force-dynamic"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { userScopedWhere, getEffectiveUserId } from "@/lib/api-auth"
import { getComissaoVendedorForDate } from "@/lib/comissao"
import ComissoesView from "./ComissoesView"

const meses = [
  "", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
]

export default async function ComissoesPage() {
  const session = await auth()
  if (!session?.user) return null

  // Current effective commission rate + per-seller history (so the seller can
  // verify the rate actually applied to their cobranças)
  const effectiveUserId = getEffectiveUserId(session)
  const taxaAtual = await getComissaoVendedorForDate(effectiveUserId, new Date())
  const historicoTaxas = await prisma.historicoComissaoVendedor.findMany({
    where: { userId: effectiveUserId },
    orderBy: { dataInicio: "desc" },
    take: 5
  })

  const reconciliacoes = await prisma.reconciliacaoComissoes.findMany({
    where: { ...userScopedWhere(session) },
    include: {
      itens: {
        include: {
          cliente: {
            select: { id: true, nome: true, codigo: true }
          },
          cobranca: {
            select: { id: true, fatura: true, valor: true, comissao: true }
          },
          parcela: {
            select: { id: true, numero: true, valor: true, dataPago: true }
          }
        }
      }
    },
    orderBy: [{ ano: "desc" }, { mes: "desc" }]
  })

  // Get available years from existing data
  const years = new Set<number>()
  reconciliacoes.forEach(r => years.add(r.ano))
  years.add(new Date().getFullYear())

  // Ensure types are properly converted
  const reconciliacoesTyped = reconciliacoes.map(r => ({
    ...r,
    totalLiquidoPdf: Number(r.totalLiquidoPdf),
    totalComissaoPdf: Number(r.totalComissaoPdf),
    totalSistema: Number(r.totalSistema),
    totalComissaoSistema: Number(r.totalComissaoSistema),
    diferenca: Number(r.diferenca),
    diferencaComissao: Number(r.diferencaComissao),
    itens: r.itens.map(i => ({
      ...i,
      valorLiquidoPdf: Number(i.valorLiquidoPdf),
      valorComissaoPdf: Number(i.valorComissaoPdf),
      valorSistema: i.valorSistema ? Number(i.valorSistema) : null,
      comissaoSistema: i.comissaoSistema ? Number(i.comissaoSistema) : null,
      diferencaValor: i.diferencaValor ? Number(i.diferencaValor) : null,
      diferencaComissao: i.diferencaComissao ? Number(i.diferencaComissao) : null,
      cobranca: i.cobranca ? {
        ...i.cobranca,
        valor: Number(i.cobranca.valor),
        comissao: i.cobranca.comissao ? Number(i.cobranca.comissao) : null
      } : null,
      parcela: i.parcela ? {
        ...i.parcela,
        valor: Number(i.parcela.valor)
      } : null
    }))
  }))

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Reconciliação de Comissões</h1>
        <p className="text-muted-foreground mt-1">Compare os pagamentos do mapa de comissões com o sistema</p>
      </div>

      {/* Current commission rate card */}
      <div className="mb-6 rounded-lg border border-border bg-card p-4">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-sm text-muted-foreground">A tua taxa de comissão atual:</span>
          <span className="text-2xl font-bold text-foreground">{taxaAtual}%</span>
          {historicoTaxas[0]?.dataFim === null && historicoTaxas[0] && (
            <span className="text-sm text-muted-foreground">
              desde {new Date(historicoTaxas[0].dataInicio).toLocaleDateString("pt-PT")}
            </span>
          )}
        </div>
        {historicoTaxas.length > 1 && (
          <div className="mt-2 text-xs text-muted-foreground">
            Histórico: {historicoTaxas.map(h =>
              `${Number(h.percentagem)}% (${new Date(h.dataInicio).toLocaleDateString("pt-PT")}${h.dataFim ? ` – ${new Date(h.dataFim).toLocaleDateString("pt-PT")}` : " – atual"})`
            ).join(" · ")}
          </div>
        )}
      </div>

      <ComissoesView
        reconciliacoes={reconciliacoesTyped}
        meses={meses}
        anosDisponiveis={Array.from(years).sort((a, b) => b - a)}
      />
    </div>
  )
}
