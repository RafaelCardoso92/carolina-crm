"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { formatCurrency } from "@/lib/utils"

type Produto = {
  id: string
  nome: string
  precoUnit: string
  quantidade: number
  produto: { id: string; nome: string; codigo: string | null } | null
}

type CampanhaVenda = {
  id: string
  quantidade: number
  venda: {
    id: string
    total: string
    cliente: { id: string; nome: string }
  }
}

type Campanha = {
  id: string
  titulo: string
  descricao: string | null
  mes: number
  ano: number
  ativo: boolean
  recorrente: boolean
  totalVendido: number
  totalVendas: number
  totalSemIva: number
  produtos: Produto[]
  vendas: CampanhaVenda[]
}

const meses = [
  "", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
]

function CampanhasContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentDate = new Date()
  const [mes, setMes] = useState(searchParams.get("mes") ? parseInt(searchParams.get("mes")!) : currentDate.getMonth() + 1)
  const [ano, setAno] = useState(searchParams.get("ano") ? parseInt(searchParams.get("ano")!) : currentDate.getFullYear())

  const [campanhas, setCampanhas] = useState<Campanha[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [showRenewModal, setShowRenewModal] = useState(false)
  const [renewLoading, setRenewLoading] = useState(false)
  const [renewResult, setRenewResult] = useState<{ created: number; skipped: number } | null>(null)

  useEffect(() => {
    fetchCampanhas()
  }, [mes, ano])

  async function fetchCampanhas() {
    setLoading(true)
    try {
      const res = await fetch(`/api/campanhas?mes=${mes}&ano=${ano}`)
      if (res.ok) {
        const data = await res.json()
        setCampanhas(data)
      }
    } catch (error) {
      console.error("Error fetching campanhas:", error)
    } finally {
      setLoading(false)
    }
  }

  async function toggleRecorrente(id: string, currentValue: boolean) {
    setTogglingId(id)
    try {
      const res = await fetch(`/api/campanhas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recorrente: !currentValue }),
      })
      if (res.ok) {
        setCampanhas(campanhas.map(c =>
          c.id === id ? { ...c, recorrente: !currentValue } : c
        ))
      }
    } catch (error) {
      console.error("Error toggling recorrente:", error)
    } finally {
      setTogglingId(null)
    }
  }

  async function toggleAtivo(id: string, currentValue: boolean) {
    setTogglingId(id)
    try {
      const res = await fetch(`/api/campanhas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ativo: !currentValue }),
      })
      if (res.ok) {
        setCampanhas(campanhas.map(c =>
          c.id === id ? { ...c, ativo: !currentValue } : c
        ))
      }
    } catch (error) {
      console.error("Error toggling ativo:", error)
    } finally {
      setTogglingId(null)
    }
  }

  async function renewCampanhas() {
    setRenewLoading(true)
    setRenewResult(null)
    try {
      const res = await fetch("/api/campanhas/renovar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mes, ano }),
      })
      if (res.ok) {
        const data = await res.json()
        setRenewResult({ created: data.created, skipped: data.skipped })
        // If we created any, offer to navigate to next month
      }
    } catch (error) {
      console.error("Error renewing campanhas:", error)
    } finally {
      setRenewLoading(false)
    }
  }

  function changeMonth(delta: number) {
    let newMes = mes + delta
    let newAno = ano

    if (newMes > 12) {
      newMes = 1
      newAno++
    } else if (newMes < 1) {
      newMes = 12
      newAno--
    }

    setMes(newMes)
    setAno(newAno)
    router.push(`/campanhas?mes=${newMes}&ano=${newAno}`)
  }

  function getNextMonth() {
    let nextMes = mes + 1
    let nextAno = ano
    if (nextMes > 12) {
      nextMes = 1
      nextAno++
    }
    return { mes: nextMes, ano: nextAno }
  }

  const recorrenteCount = campanhas.filter(c => c.recorrente && c.ativo).length
  const next = getNextMonth()

  return (
    <div>
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Campanhas</h1>
        <p className="text-muted-foreground flex items-center gap-2 mt-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
          </svg>
          Gerir campanhas de vendas
        </p>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-center gap-4 mb-6 bg-card rounded-2xl p-4 border border-border">
        <button
          onClick={() => changeMonth(-1)}
          className="p-2.5 rounded-xl bg-secondary hover:bg-muted transition border border-border"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-lg md:text-xl font-bold text-foreground min-w-[180px] md:min-w-[200px] text-center tracking-tight">
          {meses[mes]} {ano}
        </h2>
        <button
          onClick={() => changeMonth(1)}
          className="p-2.5 rounded-xl bg-secondary hover:bg-muted transition border border-border"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mb-6">
        <div className="bg-card rounded-2xl p-4 border border-border">
          <p className="text-xs md:text-sm font-semibold text-muted-foreground uppercase tracking-wide">Total Campanhas</p>
          <p className="text-xl md:text-2xl font-bold text-foreground mt-1">{campanhas.length}</p>
        </div>
        <div className="bg-white dark:bg-card rounded-2xl p-4 border border-border">
          <p className="text-xs md:text-sm font-semibold text-success uppercase tracking-wide">Ativas</p>
          <p className="text-xl md:text-2xl font-bold text-success mt-1">{campanhas.filter(c => c.ativo).length}</p>
        </div>
        <div className="bg-white dark:bg-card rounded-2xl p-4 border border-border">
          <p className="text-xs md:text-sm font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wide">Recorrentes</p>
          <p className="text-xl md:text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{recorrenteCount}</p>
        </div>
        <div className="bg-white dark:bg-card rounded-2xl p-4 border border-border">
          <p className="text-xs md:text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">Unidades</p>
          <p className="text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{campanhas.reduce((sum, c) => sum + c.totalVendido, 0)}</p>
        </div>
        <div className="bg-white dark:bg-card rounded-2xl p-4 border border-border col-span-2 md:col-span-1">
          <p className="text-xs md:text-sm font-semibold text-primary uppercase tracking-wide">Valor Total</p>
          <p className="text-xl md:text-2xl font-bold text-primary mt-1">
            {formatCurrency(campanhas.reduce((sum, c) => sum + c.totalSemIva, 0))} €
          </p>
        </div>
      </div>

      {/* Renew Button */}
      {recorrenteCount > 0 && (
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-2xl p-4 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-800 rounded-xl shrink-0">
                <svg className="w-5 h-5 text-purple-600 dark:text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-purple-900 dark:text-purple-100">
                  {recorrenteCount} campanha{recorrenteCount > 1 ? "s" : ""} recorrente{recorrenteCount > 1 ? "s" : ""}
                </p>
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  Clique para renovar para {meses[next.mes]} {next.ano}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowRenewModal(true)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition shrink-0"
            >
              Renovar Campanhas
            </button>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="bg-white dark:bg-card border border-border rounded-2xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary/10 rounded-xl shrink-0">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm text-foreground">
            <strong>Nota:</strong> As campanhas são geridas em{" "}
            <a href="/definicoes" className="underline hover:no-underline font-semibold">Definições</a>.
            Campanhas <span className="text-purple-600 font-semibold">recorrentes</span> podem ser renovadas automaticamente para o próximo mês.
          </p>
        </div>
      </div>

      {/* Campanhas List */}
      {loading ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border">
          <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-muted-foreground mt-4 font-medium">A carregar...</p>
        </div>
      ) : campanhas.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border">
          <svg className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
          </svg>
          <p className="text-muted-foreground text-lg font-medium">Nenhuma campanha em {meses[mes]} {ano}</p>
          <p className="text-muted-foreground/70 mt-1 text-sm">Crie campanhas em Definições</p>
        </div>
      ) : (
        <div className="space-y-4">
          {campanhas.map((campanha) => (
            <div key={campanha.id} className="bg-card rounded-2xl border border-border/50 overflow-hidden hover:shadow-md transition-shadow">
              <div
                className="p-4 cursor-pointer hover:bg-muted/50 transition"
                onClick={() => setExpandedId(expandedId === campanha.id ? null : campanha.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground">{campanha.titulo}</h3>
                      {campanha.ativo ? (
                        <span className="px-2 py-0.5 text-xs font-medium bg-success/10 text-success rounded-full">
                          Ativa
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 rounded-full">
                          Inativa
                        </span>
                      )}
                      {campanha.recorrente && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400 rounded-full flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Recorrente
                        </span>
                      )}
                    </div>
                    {campanha.descricao && (
                      <p className="text-sm text-muted-foreground mt-1">{campanha.descricao}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-4 md:gap-6">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm text-muted-foreground">Unidades</p>
                      <p className="font-semibold text-foreground">{campanha.totalVendido}</p>
                    </div>
                    <div className="text-right hidden md:block">
                      <p className="text-sm text-muted-foreground">Vendas</p>
                      <p className="font-semibold text-muted-foreground">{campanha.totalVendas}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Valor</p>
                      <p className="font-semibold text-primary">{formatCurrency(campanha.totalSemIva)} €</p>
                    </div>
                    <svg
                      className={`w-5 h-5 text-muted-foreground transition-transform ${expandedId === campanha.id ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedId === campanha.id && (
                <div className="border-t border-border p-4 bg-muted/30">
                  {/* Quick Actions */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleAtivo(campanha.id, campanha.ativo); }}
                      disabled={togglingId === campanha.id}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition flex items-center gap-1.5 ${
                        campanha.ativo
                          ? "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
                          : "bg-success/10 text-success hover:bg-success/20"
                      }`}
                    >
                      {campanha.ativo ? (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Desativar
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Ativar
                        </>
                      )}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleRecorrente(campanha.id, campanha.recorrente); }}
                      disabled={togglingId === campanha.id}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition flex items-center gap-1.5 ${
                        campanha.recorrente
                          ? "bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/50 dark:text-purple-300"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      {campanha.recorrente ? "Recorrente" : "Marcar Recorrente"}
                    </button>
                  </div>

                  {/* Products */}
                  {campanha.produtos.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-muted-foreground mb-2">Produtos da Campanha</h4>
                      <div className="space-y-2">
                        {campanha.produtos.map((p) => (
                          <div key={p.id} className="flex justify-between items-center text-sm bg-background rounded-lg p-2">
                            <span className="text-foreground">{p.nome}</span>
                            <span className="text-muted-foreground">
                              {p.quantidade}x @ {formatCurrency(Number(p.precoUnit))} €
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sales */}
                  {campanha.vendas.length > 0 ? (
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                        Vendas Associadas ({campanha.vendas.reduce((sum, v) => sum + v.quantidade, 0)} unidades)
                      </h4>
                      <div className="space-y-2">
                        {campanha.vendas.map((v) => (
                          <div key={v.id} className="flex justify-between items-center text-sm bg-background rounded-lg p-2">
                            <div className="flex items-center gap-2">
                              <span className="text-foreground">{v.venda.cliente.nome}</span>
                              {v.quantidade > 1 && (
                                <span className="px-1.5 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded">
                                  ×{v.quantidade}
                                </span>
                              )}
                            </div>
                            <span className="text-primary font-medium">
                              {formatCurrency(Number(v.venda.total))} €
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhuma venda associada a esta campanha
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Renew Modal */}
      {showRenewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !renewLoading && setShowRenewModal(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Renovar Campanhas</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Isto irá copiar {recorrenteCount} campanha{recorrenteCount > 1 ? "s" : ""} recorrente{recorrenteCount > 1 ? "s" : ""} para {meses[next.mes]} {next.ano}.
            </p>

            {renewResult && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 mb-4">
                <p className="text-green-800 dark:text-green-200 font-medium">
                  {renewResult.created > 0 ? (
                    <>{renewResult.created} campanha{renewResult.created > 1 ? "s" : ""} criada{renewResult.created > 1 ? "s" : ""}</>
                  ) : (
                    <>Nenhuma campanha criada</>
                  )}
                  {renewResult.skipped > 0 && (
                    <span className="text-gray-600 dark:text-gray-400 font-normal">
                      {" "}({renewResult.skipped} já existia{renewResult.skipped > 1 ? "m" : ""})
                    </span>
                  )}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowRenewModal(false)}
                disabled={renewLoading}
                className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                {renewResult ? "Fechar" : "Cancelar"}
              </button>
              {!renewResult && (
                <button
                  onClick={renewCampanhas}
                  disabled={renewLoading}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {renewLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      A renovar...
                    </>
                  ) : (
                    "Renovar"
                  )}
                </button>
              )}
              {renewResult && renewResult.created > 0 && (
                <button
                  onClick={() => {
                    setShowRenewModal(false)
                    setRenewResult(null)
                    changeMonth(1)
                  }}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl flex items-center justify-center gap-2"
                >
                  Ver {meses[next.mes]}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function CampanhasPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
      <CampanhasContent />
    </Suspense>
  )
}
