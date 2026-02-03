"use client"

import { useState, useEffect } from "react"
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
  estatisticas: {
    alto: number
    medio: number
    baixo: number
  }
  acaoPrioritaria?: string
}

type Insight = {
  id: string
  data: InsightData
  summary: string
  createdAt: string
  updatedAt: string
}

export default function CobrancaAIRisk() {
  const [insight, setInsight] = useState<Insight | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    fetchInsight()
  }, [])

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
    setGenerating(true)
    try {
      const res = await fetch("/api/ai/cobranca-risk", { method: "POST" })
      const data = await res.json()

      if (res.status === 402) {
        Swal.fire({
          icon: "warning",
          title: "Tokens insuficientes",
          text: "Precisa de mais tokens para gerar analise. Va a Definicoes > Tokens.",
          confirmButtonColor: "#b8860b"
        })
        return
      }

      if (res.ok) {
        setInsight(data.insight)
        setExpanded(true)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error("Error generating insight:", error)
      Swal.fire({
        icon: "error",
        title: "Erro",
        text: "Erro ao gerar analise de risco",
        confirmButtonColor: "#b8860b"
      })
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
      try {
        await fetch("/api/ai/cobranca-risk", { method: "DELETE" })
        setInsight(null)
        setExpanded(false)
      } catch (error) {
        console.error("Error deleting insight:", error)
      }
    }
  }

  const data = insight?.data as InsightData | undefined

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-2xl p-4 border border-orange-500/20">
        <div className="animate-pulse flex items-center gap-2">
          <div className="w-5 h-5 bg-orange-500/20 rounded" />
          <div className="h-4 bg-orange-500/20 rounded w-40" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-2xl border border-orange-500/20 overflow-hidden">
      {/* Header */}
      <div 
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-orange-500/5 transition"
        onClick={() => insight && setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="font-bold text-foreground">Analise de Risco AI</h3>
          {insight && (
            <span className="text-xs text-muted-foreground">
              {new Date(insight.updatedAt).toLocaleDateString("pt-PT")}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {insight && data?.estatisticas && (
            <div className="flex gap-1">
              {data.estatisticas.alto > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 bg-red-500 text-white rounded-full font-medium">
                  {data.estatisticas.alto} alto
                </span>
              )}
              {data.estatisticas.medio > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 bg-yellow-500 text-black rounded-full font-medium">
                  {data.estatisticas.medio} medio
                </span>
              )}
            </div>
          )}
          {insight && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); deleteInsight() }}
                className="p-1 text-muted-foreground hover:text-red-500 transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
              <svg 
                className={`w-4 h-4 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      {!insight ? (
        <div className="px-4 pb-4">
          <p className="text-sm text-muted-foreground mb-3">
            Analise o risco de cobranca das suas faturas pendentes
          </p>
          <button
            onClick={generateInsight}
            disabled={generating}
            className="w-full py-2 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {generating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                A analisar...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Analisar Risco
              </>
            )}
          </button>
        </div>
      ) : (
        <>
          <div className="px-4 pb-2">
            <p className="text-sm text-foreground">{data?.resumo}</p>
          </div>

          {expanded && data && (
            <div className="px-4 pb-4 space-y-3">
              {/* Priority Action */}
              {data.acaoPrioritaria && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <p className="text-xs font-medium text-red-600 mb-1">Acao Prioritaria:</p>
                  <p className="text-xs text-foreground">{data.acaoPrioritaria}</p>
                </div>
              )}

              {/* Risk Items */}
              {data.cobrancasRisco?.length > 0 && (
                <div className="space-y-2">
                  {data.cobrancasRisco.slice(0, 5).map((item, i) => (
                    <div 
                      key={i} 
                      className={`p-2 rounded-lg border ${
                        item.risco === "ALTO" 
                          ? "bg-red-500/5 border-red-500/20" 
                          : item.risco === "MEDIO"
                          ? "bg-yellow-500/5 border-yellow-500/20"
                          : "bg-green-500/5 border-green-500/20"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-foreground">{item.cliente}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{item.valor.toFixed(2)}€</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                            item.risco === "ALTO" ? "bg-red-500 text-white" :
                            item.risco === "MEDIO" ? "bg-yellow-500 text-black" :
                            "bg-green-500 text-white"
                          }`}>
                            {item.risco}
                          </span>
                        </div>
                      </div>
                      {item.fatores?.length > 0 && (
                        <p className="text-[10px] text-muted-foreground mb-1">
                          {item.fatores.join(" • ")}
                        </p>
                      )}
                      <p className="text-[10px] text-orange-600 font-medium">{item.acao}</p>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={generateInsight}
                disabled={generating}
                className="w-full py-2 bg-orange-500/20 text-orange-600 rounded-xl text-sm font-medium hover:bg-orange-500/30 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {generating ? (
                  <>
                    <div className="w-3 h-3 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                    A reanalisar...
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Reanalisar
                  </>
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
