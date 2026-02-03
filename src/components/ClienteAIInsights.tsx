"use client"

import { useState, useEffect } from "react"
import type { ClienteInsights, AISettingsResponse, ClienteInsightsResponse } from "@/types/ai"

interface Props {
  clienteId: string
}

export default function ClienteAIInsights({ clienteId }: Props) {
  const [loading, setLoading] = useState(false)
  const [loadingSaved, setLoadingSaved] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [insights, setInsights] = useState<ClienteInsights | null>(null)
  const [usedProvider, setUsedProvider] = useState<string | null>(null)
  const [generatedAt, setGeneratedAt] = useState<string | null>(null)
  const [insightId, setInsightId] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(true)

  // AI Settings state
  const [currentProvider, setCurrentProvider] = useState<"openai">("openai")
  const [availableProviders, setAvailableProviders] = useState({ openai: false })
  const [switchingProvider, setSwitchingProvider] = useState(false)

  // Fetch AI settings and saved insights on mount
  useEffect(() => {
    async function fetchInitialData() {
      try {
        // Fetch settings
        const settingsRes = await fetch("/api/ai/settings")
        if (settingsRes.ok) {
          const data: AISettingsResponse = await settingsRes.json()
          setCurrentProvider(data.currentProvider)
          setAvailableProviders(data.availableProviders || { openai: true })
        }

        // Fetch saved insights
        const insightsRes = await fetch(`/api/ai/cliente-insights?clienteId=${clienteId}`)
        if (insightsRes.ok) {
          const data: ClienteInsightsResponse = await insightsRes.json()
          if (data.success && data.insights) {
            setInsights(data.insights)
            setUsedProvider(data.provider || null)
            setGeneratedAt(data.generatedAt || null)
            setInsightId(data.insightId || null)
          }
        }
      } catch {
        // Silently fail
      } finally {
        setLoadingSaved(false)
      }
    }
    fetchInitialData()
  }, [clienteId])

  async function switchProvider(provider: "openai") {
    setSwitchingProvider(true)
    try {
      const res = await fetch("/api/ai/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      })
      if (res.ok) {
        setCurrentProvider(provider)
      }
    } catch {
      // Silently fail
    } finally {
      setSwitchingProvider(false)
    }
  }

  async function generateInsights() {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/ai/cliente-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clienteId, provider: currentProvider }),
      })

      const data: ClienteInsightsResponse = await res.json()

      if (!data.success) {
        throw new Error(data.error || "Erro desconhecido")
      }

      setInsights(data.insights || null)
      setUsedProvider(data.provider || null)
      setGeneratedAt(data.generatedAt || null)
      setInsightId(data.insightId || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao gerar insights")
    } finally {
      setLoading(false)
    }
  }

  async function deleteInsights() {
    if (!insightId) {
      // Just clear local state if no saved insight
      setInsights(null)
      setUsedProvider(null)
      setGeneratedAt(null)
      setInsightId(null)
      setError(null)
      return
    }

    setDeleting(true)
    try {
      const res = await fetch(`/api/ai/cliente-insights?insightId=${insightId}`, {
        method: "DELETE",
      })

      if (res.ok) {
        setInsights(null)
        setUsedProvider(null)
        setGeneratedAt(null)
        setInsightId(null)
        setError(null)
      }
    } catch {
      // Silently fail
    } finally {
      setDeleting(false)
    }
  }

  const providerLabel = (p: string) => "ChatGPT"
  const providerColor = (p: string) => p === "openai" ? "text-green-600" : "text-blue-600"
  const providerBg = (p: string) => p === "openai" ? "bg-green-500/10" : "bg-blue-500/10"

  if (loadingSaved) {
    return (
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-xl p-4 mt-4 border border-purple-200 dark:border-purple-800">
        <div className="flex items-center gap-3 py-4 justify-center">
          <svg className="w-5 h-5 animate-spin text-purple-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-muted-foreground text-sm">A carregar...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-xl p-4 mt-4 border border-purple-200 dark:border-purple-800">
      {/* Header with Model Toggle */}
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm md:text-base font-bold text-foreground flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Analise IA
          </h2>

          {insights && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-muted-foreground hover:text-foreground p-1"
            >
              <svg
                className={`w-5 h-5 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
        </div>

        {/* Model Toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">Modelo:</span>
          <div className="flex rounded-lg overflow-hidden border border-border">
            <button
              onClick={() => switchProvider("openai")}
              disabled={!availableProviders.openai || switchingProvider}
              className={`px-3 py-1 text-xs font-medium transition ${
                currentProvider === "openai"
                  ? "bg-green-600 text-white"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              } ${!availableProviders.openai ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              GPT-5.1
            </button>
          </div>
          <span className={`text-xs font-medium ${providerColor(currentProvider)}`}>
            {providerLabel(currentProvider)} selecionado
          </span>
        </div>
      </div>

      {/* Generated info badge */}
      {insights && usedProvider && (
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg mb-4 ${providerBg(usedProvider)}`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className={`text-xs font-medium ${providerColor(usedProvider)}`}>
            Gerado com {providerLabel(usedProvider)}
          </span>
          {generatedAt && (
            <span className="text-xs text-muted-foreground">
              {new Date(generatedAt).toLocaleString("pt-PT", {
                day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit"
              })}
            </span>
          )}
        </div>
      )}

      {/* Action button */}
      {!insights && !loading && (
        <button
          onClick={generateInsights}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Gerar Insights com {providerLabel(currentProvider)}
        </button>
      )}

      {loading && (
        <div className="flex items-center gap-3 py-8 justify-center">
          <svg className="w-5 h-5 animate-spin text-purple-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-muted-foreground text-sm">
            A analisar historico do cliente com {providerLabel(currentProvider)}...
          </span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-950/70 text-red-700 dark:text-red-100 p-3 rounded-lg text-sm flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="flex-1">{error}</span>
          <button
            onClick={generateInsights}
            className="text-red-600 dark:text-red-200 hover:text-red-800 dark:hover:text-red-50 font-medium whitespace-nowrap"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {insights && isExpanded && (
        <div className="space-y-4">
          {/* Resumo do Comportamento */}
          <div className="bg-white/60 dark:bg-gray-900/40 rounded-lg p-3">
            <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-1.5">
              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Perfil do Cliente
            </h3>
            <p className="text-sm text-foreground leading-relaxed">{insights.resumoComportamento.texto}</p>
            <p className="text-xs text-purple-800 dark:text-purple-200 mt-2 italic">
              <strong>Porque e importante:</strong> {insights.resumoComportamento.explicacao}
            </p>
          </div>

          {/* Padrao de Compras */}
          <div className="bg-white/60 dark:bg-gray-900/40 rounded-lg p-3">
            <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-1.5">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Padrao de Compras
            </h3>
            <p className="text-sm text-foreground leading-relaxed">{insights.padraoCompras.texto}</p>
            <p className="text-xs text-blue-800 dark:text-blue-200 mt-2 italic">
              <strong>Porque e importante:</strong> {insights.padraoCompras.explicacao}
            </p>
          </div>

          {/* Recomendacoes de Upsell */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              Oportunidades de Upsell
            </h3>
            <div className="space-y-2">
              {insights.recomendacoesUpsell.map((rec, i) => (
                <div key={i} className="bg-green-50 dark:bg-green-950/30 rounded-lg p-3 border border-green-200 dark:border-green-800">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">{rec.produto}</p>
                  <p className="text-xs text-green-700 dark:text-green-200 mt-0.5">{rec.razao}</p>
                  <p className="text-xs text-green-800 dark:text-green-100 mt-1 italic border-t border-green-200 dark:border-green-700 pt-1">
                    <strong>Porque faz sentido:</strong> {rec.explicacao}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Sugestoes de Engagement */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
              <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
              </svg>
              Sugestoes de Engagement
            </h3>
            <div className="space-y-2">
              {insights.sugestoesEngagement.map((item, i) => (
                <div key={i} className="bg-orange-50 dark:bg-orange-950/30 rounded-lg p-3 border border-orange-200 dark:border-orange-800">
                  <p className="text-sm text-foreground">{item.texto}</p>
                  <p className="text-xs text-orange-800 dark:text-orange-200 mt-1 italic">
                    {item.explicacao}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Tendencia Sazonal */}
          <div className="bg-white/60 dark:bg-gray-900/40 rounded-lg p-3">
            <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-1.5">
              <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Tendencia Sazonal
            </h3>
            <p className="text-sm text-foreground leading-relaxed">{insights.tendenciaSazonal.texto}</p>
            <p className="text-xs text-yellow-800 dark:text-yellow-200 mt-2 italic">
              <strong>Porque e importante:</strong> {insights.tendenciaSazonal.explicacao}
            </p>
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-purple-200 dark:border-purple-800 flex items-center gap-3">
            <button
              onClick={generateInsights}
              disabled={loading}
              className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Gerar nova analise
            </button>
            <button
              onClick={deleteInsights}
              disabled={deleting}
              className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
            >
              {deleting ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              )}
              Apagar analise
            </button>
          </div>
        </div>
      )}

      {!insights && !loading && !error && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Clique no botao acima para gerar uma analise personalizada do comportamento deste cliente.
        </p>
      )}
    </div>
  )
}
