"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { formatCurrency } from "@/lib/utils"

const MESES = [
  "", "Janeiro", "Fevereiro", "Marco", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
]

type VendaRow = {
  id: string
  mes: number
  ano: number
  total: number
  objetivoVarioValor: number
  notas: string | null
  createdAt: string
  cliente: { id: string; nome: string; codigo: string | null }
  cobranca: {
    id: string
    fatura: string | null
    estado: string
    valor: number
    pago: boolean
  } | null
  objetivoVarioId: string
  objetivoVarioTitulo: string
}

type ObjetivoGroup = {
  objetivo: {
    id: string
    titulo: string
    descricao: string | null
    mes: number
    ano: number
    produtos: { nome: string; precoSemIva: number; quantidade: number }[]
    metaValor: number
  }
  vendas: VendaRow[]
  totalVendido: number
  totalObjetivoValor: number
  count: number
}

type Summary = {
  totalVendas: number
  totalVendido: number
  totalObjetivoValor: number
  totalObjetivos: number
}

export default function ObjetivosVariosPage() {
  const { data: session } = useSession()
  const [mes, setMes] = useState(new Date().getMonth() + 1)
  const [ano, setAno] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(true)
  const [objetivos, setObjetivos] = useState<ObjetivoGroup[]>([])
  const [summary, setSummary] = useState<Summary>({ totalVendas: 0, totalVendido: 0, totalObjetivoValor: 0, totalObjetivos: 0 })

  const anosDisponiveis = [ano - 1, ano, ano + 1]

  useEffect(() => {
    fetchData()
  }, [mes, ano])

  async function fetchData() {
    setLoading(true)
    try {
      const res = await fetch(`/api/objetivos-varios/vendas?mes=${mes}&ano=${ano}`)
      if (res.ok) {
        const data = await res.json()
        setObjetivos(data.objetivos || [])
        setSummary(data.summary || { totalVendas: 0, totalVendido: 0, totalObjetivoValor: 0, totalObjetivos: 0 })
      }
    } catch (error) {
      console.error("Error fetching objetivos varios:", error)
    } finally {
      setLoading(false)
    }
  }

  const estadoBadge = (estado: string) => {
    switch (estado) {
      case "PAGO":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
      case "PARCIAL":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
      case "ATRASADO":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-xl">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            Objetivos Varios
          </h1>
          <p className="text-muted-foreground mt-1">Vendas associadas a objetivos varios, agrupadas por objetivo</p>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-2">
          <select
            value={mes}
            onChange={(e) => setMes(parseInt(e.target.value))}
            className="px-4 py-2.5 border border-border rounded-xl bg-card text-foreground font-medium"
          >
            {MESES.slice(1).map((m, i) => (
              <option key={i + 1} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            value={ano}
            onChange={(e) => setAno(parseInt(e.target.value))}
            className="px-4 py-2.5 border border-border rounded-xl bg-card text-foreground font-medium"
          >
            {anosDisponiveis.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-card rounded-xl p-4 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <span className="text-xs text-muted-foreground font-medium">Objetivos</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{summary.totalObjetivos}</p>
            </div>
            <div className="bg-card rounded-xl p-4 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <span className="text-xs text-muted-foreground font-medium">Total Vendas</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{summary.totalVendas}</p>
            </div>
            <div className="bg-card rounded-xl p-4 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-xs text-muted-foreground font-medium">Total Vendido</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(summary.totalVendido)}€</p>
            </div>
            <div className="bg-card rounded-xl p-4 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <span className="text-xs text-muted-foreground font-medium">Valor Obj. Varios</span>
              </div>
              <p className="text-2xl font-bold text-purple-600">{formatCurrency(summary.totalObjetivoValor)}€</p>
            </div>
          </div>

          {/* Per-Objective Sections */}
          {objetivos.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-lg font-medium">Nenhuma venda com objetivo vario</p>
              <p className="text-sm mt-1">em {MESES[mes]} {ano}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {objetivos.map((group) => {
                const metaValor = group.objetivo.metaValor
                const progresso = metaValor > 0 ? Math.round((group.totalObjetivoValor / metaValor) * 100) : 0
                const produtosTotal = group.objetivo.produtos.reduce((s, p) => s + p.precoSemIva * p.quantidade, 0)

                return (
                  <div key={group.objetivo.id} className="bg-card rounded-xl border border-border overflow-hidden">
                    {/* Objective Header */}
                    <div className="p-5 border-b border-border bg-purple-500/5">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-500/10 rounded-lg">
                            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-foreground">{group.objetivo.titulo}</h3>
                            {group.objetivo.descricao && (
                              <p className="text-sm text-muted-foreground">{group.objetivo.descricao}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">{group.count} venda{group.count !== 1 ? "s" : ""}</p>
                            <p className="text-lg font-bold text-purple-600">{formatCurrency(group.totalObjetivoValor)}€</p>
                          </div>
                          {metaValor > 0 && (
                            <div className={`text-2xl font-bold ${progresso >= 100 ? "text-green-600" : progresso >= 75 ? "text-purple-600" : "text-amber-600"}`}>
                              {progresso}%
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Products in this objective */}
                      {group.objetivo.produtos.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {group.objetivo.produtos.map((p, i) => (
                            <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-500/10 text-purple-600 rounded-lg text-xs font-medium">
                              {p.nome} ({p.quantidade}x {formatCurrency(p.precoSemIva)}€)
                            </span>
                          ))}
                          {produtosTotal > 0 && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-500/20 text-purple-700 dark:text-purple-400 rounded-lg text-xs font-bold">
                              Total: {formatCurrency(produtosTotal)}€
                            </span>
                          )}
                        </div>
                      )}

                      {/* Progress Bar */}
                      {metaValor > 0 && (
                        <div className="mt-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium text-foreground">{formatCurrency(group.totalObjetivoValor)}€ vendido</span>
                            <span className="text-muted-foreground">Meta: {formatCurrency(metaValor)}€</span>
                          </div>
                          <div className="w-full bg-purple-200/30 dark:bg-purple-900/20 rounded-full h-2.5">
                            <div
                              className={`h-2.5 rounded-full transition-all ${progresso >= 100 ? "bg-green-500" : "bg-purple-500"}`}
                              style={{ width: Math.min(100, progresso) + "%" }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Vendas Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border bg-muted/30">
                            <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cliente</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Periodo</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Venda Total</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Obj. Vario</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fatura</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Estado</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Valor Cob.</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {group.vendas.map((v) => (
                            <tr key={v.id} className="hover:bg-muted/20 transition">
                              <td className="px-4 py-3">
                                <div>
                                  <p className="font-medium text-foreground text-sm">{v.cliente.nome}</p>
                                  {v.cliente.codigo && (
                                    <p className="text-xs text-muted-foreground">{v.cliente.codigo}</p>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-muted-foreground">
                                {MESES[v.mes]} {v.ano}
                              </td>
                              <td className="px-4 py-3 text-right text-sm font-medium text-foreground">
                                {formatCurrency(v.total)}€
                              </td>
                              <td className="px-4 py-3 text-right">
                                <span className="inline-flex px-2 py-0.5 bg-purple-500/10 text-purple-600 rounded text-sm font-semibold">
                                  {formatCurrency(v.objetivoVarioValor)}€
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-muted-foreground">
                                {v.cobranca?.fatura || "—"}
                              </td>
                              <td className="px-4 py-3">
                                {v.cobranca ? (
                                  <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${estadoBadge(v.cobranca.estado)}`}>
                                    {v.cobranca.estado}
                                  </span>
                                ) : (
                                  <span className="text-xs text-muted-foreground">Sem cobranca</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right text-sm text-foreground">
                                {v.cobranca ? `${formatCurrency(v.cobranca.valor)}€` : "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t-2 border-border bg-muted/20">
                            <td className="px-4 py-3 font-bold text-sm text-foreground" colSpan={2}>
                              Total ({group.count} venda{group.count !== 1 ? "s" : ""})
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-sm text-foreground">
                              {formatCurrency(group.totalVendido)}€
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-sm text-purple-600">
                              {formatCurrency(group.totalObjetivoValor)}€
                            </td>
                            <td colSpan={3}></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
