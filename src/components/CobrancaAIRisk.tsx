"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Swal from "sweetalert2"

type CobrancaRiskItem = {
  cobrancaId: string
  cliente: string
  valor: number
  risco: string
  score: number
  fatores: string[]
  acao: string
}

type InsightData = {
  resumo: string
  cobrancasRisco: CobrancaRiskItem[]
  estatisticas: { alto: number; medio: number; baixo: number }
  acaoPrioritaria?: string
}

type Insight = {
  id: string
  data: InsightData
  summary: string
  createdAt: string
  updatedAt: string
}

type TokenBalance = {
  remaining: number
  formatted: string
  isNegative: boolean
}

export default function CobrancaAIRisk() {
  const [insight, setInsight] = useState<Insight | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [tokens, setTokens] = useState<TokenBalance | null>(null)

  useEffect(() => {
    fetchInsight()
    fetchTokens()
  }, [])

  async function fetchTokens() {
    try {
      const res = await fetch("/api/tokens/balance")
      if (res.ok) setTokens(await res.json())
    } catch (error) {
      console.error("Error fetching tokens:", error)
    }
  }

  async function fetchInsight() {
    try {
      const res = await fetch("/api/ai/cobranca-risk")
      if (res.ok) {
        const data = await res.json()
        setInsight(data.insight)
      }
    } catch (error) {
      console.error("Error fetching insight:", error)
    } finally {
      setLoading(false)
    }
  }

  async function generateInsight() {
    if (tokens?.isNegative) {
      Swal.fire({
        icon: "warning",
        title: "Tokens esgotados",
        html: "O seu saldo de tokens esta negativo.<br/>Adicione mais tokens para continuar.",
        confirmButtonText: "Comprar Tokens",
        confirmButtonColor: "#b8860b",
        showCancelButton: true,
        cancelButtonText: "Cancelar"
      }).then((result) => {
        if (result.isConfirmed) window.location.href = "/definicoes?tab=tokens"
      })
      return
    }

    setGenerating(true)
    try {
      const res = await fetch("/api/ai/cobranca-risk", { method: "POST" })
      const data = await res.json()

      if (res.status === 402) {
        Swal.fire({
          icon: "warning",
          title: "Tokens insuficientes",
          confirmButtonText: "Comprar Tokens",
          confirmButtonColor: "#b8860b"
        }).then(() => { window.location.href = "/definicoes?tab=tokens" })
        return
      }

      if (res.ok) {
        setInsight(data.insight)
        setExpanded(true)
        fetchTokens()
      }
    } catch (error) {
      console.error("Error generating insight:", error)
      Swal.fire({ icon: "error", title: "Erro", text: "Erro ao gerar analise", confirmButtonColor: "#b8860b" })
    } finally {
      setGenerating(false)
    }
  }

  async function deleteInsight() {
    const result = await Swal.fire({
      icon: "question",
      title: "Eliminar analise?",
      showCancelButton: true,
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc2626"
    })
    if (result.isConfirmed) {
      await fetch("/api/ai/cobranca-risk", { method: "DELETE" })
      setInsight(null)
      setExpanded(false)
    }
  }

  const data = insight?.data as InsightData | undefined

  if (loading) {
    return (
      <div className="bg-white dark:bg-card rounded-2xl p-4 border border-orange-500/20 shadow-sm">
        <div className="animate-pulse flex items-center gap-2">
          <div className="w-5 h-5 bg-orange-500/20 rounded" />
          <div className="h-4 bg-orange-500/20 rounded w-40" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-card rounded-2xl border border-orange-500/20 overflow-hidden shadow-sm">
      <div 
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-orange-50 dark:hover:bg-orange-500/5 transition"
        onClick={() => insight && setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="font-bold text-foreground">Analise de Risco AI</h3>
          {insight && <span className="text-xs text-muted-foreground">{new Date(insight.updatedAt).toLocaleDateString("pt-PT")}</span>}
        </div>
        <div className="flex items-center gap-2">
          {tokens && (
            <Link href="/definicoes?tab=tokens" onClick={(e) => e.stopPropagation()}
              className={`text-xs px-2 py-1 rounded-full font-medium ${
                tokens.isNegative ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
              }`}>
              {tokens.formatted} tokens
            </Link>
          )}
          {insight && data?.estatisticas && (
            <div className="flex gap-1">
              {data.estatisticas.alto > 0 && <span className="text-[10px] px-1.5 py-0.5 bg-red-500 text-white rounded-full font-medium">{data.estatisticas.alto} alto</span>}
              {data.estatisticas.medio > 0 && <span className="text-[10px] px-1.5 py-0.5 bg-yellow-500 text-black rounded-full font-medium">{data.estatisticas.medio} medio</span>}
            </div>
          )}
          {insight && (
            <>
              <button onClick={(e) => { e.stopPropagation(); deleteInsight() }} className="p-1 text-muted-foreground hover:text-red-500 transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
              <svg className={`w-4 h-4 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </>
          )}
        </div>
      </div>

      {!insight ? (
        <div className="px-4 pb-4">
          <p className="text-sm text-muted-foreground mb-3">Analise o risco de cobranca das suas faturas pendentes</p>
          <button onClick={generateInsight} disabled={generating}
            className={`w-full py-2 rounded-xl font-medium transition disabled:opacity-50 flex items-center justify-center gap-2 ${
              tokens?.isNegative ? "bg-red-500 text-white hover:bg-red-600" : "bg-orange-500 text-white hover:bg-orange-600"
            }`}>
            {generating ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> A analisar...</>
            ) : tokens?.isNegative ? "Comprar Tokens" : (
              <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> Analisar Risco</>
            )}
          </button>
        </div>
      ) : (
        <>
          <div className="px-4 pb-2"><p className="text-sm text-foreground">{data?.resumo}</p></div>
          {expanded && data && (
            <div className="px-4 pb-4 space-y-3">
              {data.acaoPrioritaria && (
                <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl">
                  <p className="text-xs font-medium text-red-600 mb-1">Acao Prioritaria:</p>
                  <p className="text-xs text-foreground">{data.acaoPrioritaria}</p>
                </div>
              )}
              {data.cobrancasRisco?.length > 0 && (
                <div className="space-y-2">
                  {data.cobrancasRisco.slice(0, 5).map((item, i) => (
                    <div key={i} className={`p-2 rounded-lg border ${
                      item.risco === "ALTO" ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800" :
                      item.risco === "MEDIO" ? "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800" :
                      "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                    }`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-foreground">{item.cliente}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{item.valor.toFixed(2)}€</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                            item.risco === "ALTO" ? "bg-red-500 text-white" : item.risco === "MEDIO" ? "bg-yellow-500 text-black" : "bg-green-500 text-white"
                          }`}>{item.risco}</span>
                        </div>
                      </div>
                      {item.fatores?.length > 0 && <p className="text-[10px] text-muted-foreground mb-1">{item.fatores.join(" • ")}</p>}
                      <p className="text-[10px] text-orange-600 font-medium">{item.acao}</p>
                    </div>
                  ))}
                </div>
              )}
              <button onClick={generateInsight} disabled={generating}
                className={`w-full py-2 rounded-xl text-sm font-medium transition disabled:opacity-50 flex items-center justify-center gap-2 ${
                  tokens?.isNegative ? "bg-red-100 text-red-700 hover:bg-red-200" : "bg-orange-100 text-orange-700 hover:bg-orange-200"
                }`}>
                {generating ? (
                  <><div className="w-3 h-3 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /> A reanalisar...</>
                ) : tokens?.isNegative ? "Comprar Tokens" : (
                  <><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg> Reanalisar</>
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
