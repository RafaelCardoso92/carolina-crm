"use client"

import { useState, useEffect } from "react"
import type { ProspectoTactics, AISettingsResponse, ProspectoTacticsResponse } from "@/types/ai"

interface Props {
  prospectoId: string
}

export default function ProspectoAITactics({ prospectoId }: Props) {
  const [loading, setLoading] = useState(false)
  const [loadingSaved, setLoadingSaved] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tactics, setTactics] = useState<ProspectoTactics | null>(null)
  const [usedProvider, setUsedProvider] = useState<string | null>(null)
  const [generatedAt, setGeneratedAt] = useState<string | null>(null)
  const [tacticId, setTacticId] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(true)

  // AI Settings state
  const [currentProvider, setCurrentProvider] = useState<"openai">("openai")
  const [availableProviders, setAvailableProviders] = useState({ openai: false })
  const [switchingProvider, setSwitchingProvider] = useState(false)

  // Fetch AI settings and saved tactics on mount
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

        // Fetch saved tactics
        const tacticsRes = await fetch(`/api/ai/prospecto-tactics?prospectoId=${prospectoId}`)
        if (tacticsRes.ok) {
          const data: ProspectoTacticsResponse = await tacticsRes.json()
          if (data.success && data.tactics) {
            setTactics(data.tactics)
            setUsedProvider(data.provider || null)
            setGeneratedAt(data.generatedAt || null)
            setTacticId(data.tacticId || null)
          }
        }
      } catch {
        // Silently fail
      } finally {
        setLoadingSaved(false)
      }
    }
    fetchInitialData()
  }, [prospectoId])

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

  async function generateTactics() {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/ai/prospecto-tactics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prospectoId, provider: currentProvider }),
      })

      const data: ProspectoTacticsResponse = await res.json()

      if (!data.success) {
        throw new Error(data.error || "Erro desconhecido")
      }

      setTactics(data.tactics || null)
      setUsedProvider(data.provider || null)
      setGeneratedAt(data.generatedAt || null)
      setTacticId(data.tacticId || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao gerar tacticas")
    } finally {
      setLoading(false)
    }
  }

  async function deleteTactics() {
    if (!tacticId) {
      // Just clear local state if no saved tactic
      setTactics(null)
      setUsedProvider(null)
      setGeneratedAt(null)
      setTacticId(null)
      setError(null)
      return
    }

    setDeleting(true)
    try {
      const res = await fetch(`/api/ai/prospecto-tactics?tacticId=${tacticId}`, {
        method: "DELETE",
      })

      if (res.ok) {
        setTactics(null)
        setUsedProvider(null)
        setGeneratedAt(null)
        setTacticId(null)
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

  const probabilidadeColors: Record<string, string> = {
    "Alta": "bg-green-500/10 text-green-600 dark:text-green-400",
    "Media": "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
    "Baixa": "bg-red-500/10 text-red-600 dark:text-red-400",
  }

  if (loadingSaved) {
    return (
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 rounded-xl p-4 mt-6 border border-indigo-200 dark:border-indigo-800">
        <div className="flex items-center gap-3 py-4 justify-center">
          <svg className="w-5 h-5 animate-spin text-indigo-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-muted-foreground text-sm">A carregar...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 rounded-xl p-4 mt-6 border border-indigo-200 dark:border-indigo-800">
      {/* Header with Model Toggle */}
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm md:text-base font-bold text-foreground flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Tacticas de Abordagem IA
          </h2>

          {tactics && (
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
      {tactics && usedProvider && (
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
      {!tactics && !loading && (
        <button
          onClick={generateTactics}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Gerar Tacticas com {providerLabel(currentProvider)}
        </button>
      )}

      {loading && (
        <div className="flex items-center gap-3 py-8 justify-center">
          <svg className="w-5 h-5 animate-spin text-indigo-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-muted-foreground text-sm">
            A analisar prospecto com {providerLabel(currentProvider)}...
          </span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-950/70 text-red-800 dark:text-red-100 p-3 rounded-lg text-sm flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="flex-1">{error}</span>
          <button
            onClick={generateTactics}
            className="text-red-600 dark:text-red-200 hover:text-red-800 dark:hover:text-red-50 font-medium whitespace-nowrap"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {tactics && isExpanded && (
        <div className="space-y-4">
          {/* Probabilidade de Conversao */}
          <div className={`rounded-lg p-3 ${probabilidadeColors[tactics.probabilidadeConversao.nivel] || "bg-gray-100"}`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Probabilidade de Conversao
              </h3>
              <span className="font-bold text-lg">{tactics.probabilidadeConversao.nivel}</span>
            </div>
            <p className="text-sm opacity-90">{tactics.probabilidadeConversao.justificacao}</p>
          </div>

          {/* Estrategia de Abordagem */}
          <div className="bg-white/60 dark:bg-gray-900/40 rounded-lg p-3">
            <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-1.5">
              <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Estrategia de Abordagem
            </h3>
            <p className="text-sm text-foreground leading-relaxed">{tactics.abordagem.texto}</p>
            <p className="text-xs text-indigo-800 dark:text-indigo-200 mt-2 italic">
              <strong>Porque funciona:</strong> {tactics.abordagem.explicacao}
            </p>
          </div>

          {/* Iniciadores de Conversa */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              Iniciadores de Conversa
            </h3>
            <div className="space-y-2">
              {tactics.iniciadoresConversa.map((item, i) => (
                <div key={i} className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-foreground font-medium">"{item.texto}"</p>
                  <p className="text-xs text-blue-800 dark:text-blue-200 mt-1 italic">
                    {item.explicacao}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Pontos de Dor */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Pontos de Dor a Explorar
            </h3>
            <div className="space-y-2">
              {tactics.pontosDor.map((item, i) => (
                <div key={i} className="bg-red-50 dark:bg-red-950/30 rounded-lg p-3 border border-red-200 dark:border-red-800">
                  <p className="text-sm text-foreground">{item.texto}</p>
                  <p className="text-xs text-red-800 dark:text-red-200 mt-1 italic">
                    {item.explicacao}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Dicas de Sucesso */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Dicas para o Sucesso
            </h3>
            <div className="space-y-2">
              {tactics.dicasSucesso.map((item, i) => (
                <div key={i} className="bg-green-50 dark:bg-green-950/30 rounded-lg p-3 border border-green-200 dark:border-green-800">
                  <p className="text-sm text-foreground">{item.texto}</p>
                  <p className="text-xs text-green-800 dark:text-green-200 mt-1 italic">
                    {item.explicacao}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-indigo-200 dark:border-indigo-800 flex items-center gap-3">
            <button
              onClick={generateTactics}
              disabled={loading}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Gerar novas tacticas
            </button>
            <button
              onClick={deleteTactics}
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
              Apagar tacticas
            </button>
          </div>
        </div>
      )}

      {!tactics && !loading && !error && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Clique no botao acima para gerar tacticas personalizadas de abordagem para este prospecto.
        </p>
      )}
    </div>
  )
}
