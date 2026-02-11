export const dynamic = "force-dynamic"

import { prisma } from "@/lib/prisma"
import ComissoesView from "./ComissoesView"

const meses = [
  "", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
]

export default async function ComissoesPage() {
  const reconciliacoes = await prisma.reconciliacaoComissoes.findMany({
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
      <ComissoesView
        reconciliacoes={reconciliacoesTyped}
        meses={meses}
        anosDisponiveis={Array.from(years).sort((a, b) => b - a)}
      />
    </div>
  )
}
