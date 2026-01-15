"use client"

import { useState, useEffect } from "react"
import type { ProspectoTactics, AISettingsResponse } from "@/types/ai"

interface Props {
  prospectoId: string
}

export default function ProspectoAITactics({ prospectoId }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tactics, setTactics] = useState<ProspectoTactics | null>(null)
  const [usedProvider, setUsedProvider] = useState<string | null>(null)
  const [generatedAt, setGeneratedAt] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(true)

  // AI Settings state
  const [currentProvider, setCurrentProvider] = useState<"gemini" | "openai">("openai")
  const [availableProviders, setAvailableProviders] = useState({ gemini: false, openai: false })
  const [switchingProvider, setSwitchingProvider] = useState(false)

  // Fetch AI settings on mount
  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/ai/settings")
        if (res.ok) {
          const data: AISettingsResponse = await res.json()
          setCurrentProvider(data.currentProvider)
          setAvailableProviders(data.availableProviders)
        }
      } catch {
        // Silently fail, use defaults
      }
    }
    fetchSettings()
  }, [])

  async function switchProvider(provider: "gemini" | "openai") {
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

      const data = await res.json()

      if (!data.success) {
        throw new Error(data.error || "Erro desconhecido")
      }

      setTactics(data.tactics)
      setUsedProvider(data.provider)
      setGeneratedAt(data.generatedAt)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao gerar tacticas")
    } finally {
      setLoading(false)
    }
  }

  function clearTactics() {
    setTactics(null)
    setUsedProvider(null)
    setGeneratedAt(null)
    setError(null)
  }

  const providerLabel = (p: string) => p === "openai" ? "GPT-5.1" : "Gemini"
  const providerColor = (p: string) => p === "openai" ? "text-green-600" : "text-blue-600"
  const providerBg = (p: string) => p === "openai" ? "bg-green-100 dark:bg-green-900/30" : "bg-blue-100 dark:bg-blue-900/30"

  return (
    <div className="bg-card rounded-xl shadow-sm p-4 mt-4">
      {/* Header with Model Toggle */}
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm md:text-base font-bold text-foreground flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Sugestoes IA
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
            <button
              onClick={() => switchProvider("gemini")}
              disabled={!availableProviders.gemini || switchingProvider}
              className={`px-3 py-1 text-xs font-medium transition ${
                currentProvider === "gemini"
                  ? "bg-blue-600 text-white"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              } ${!availableProviders.gemini ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              Gemini
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

      {/* Action buttons */}
      {!tactics && !loading && (
        <button
          onClick={generateTactics}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Gerar Tacticas com {providerLabel(currentProvider)}
        </button>
      )}

      {loading && (
        <div className="flex items-center gap-3 py-8 justify-center">
          <svg className="w-5 h-5 animate-spin text-purple-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-muted-foreground text-sm">
            A gerar tacticas com {providerLabel(currentProvider)}...
          </span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-3 rounded-lg text-sm flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="flex-1">{error}</span>
          <button
            onClick={generateTactics}
            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium whitespace-nowrap"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {tactics && isExpanded && (
        <div className="space-y-4">
          {/* Abordagem */}
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
            <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-1.5">
              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
              Estrategia de Abordagem
            </h3>
            <p className="text-sm text-foreground leading-relaxed">{tactics.abordagem.texto}</p>
            <div className="mt-2 pt-2 border-t border-purple-200 dark:border-purple-800">
              <p className="text-xs text-purple-700 dark:text-purple-400 italic">
                <strong>Porque funciona:</strong> {tactics.abordagem.explicacao}
              </p>
            </div>
          </div>

          {/* Iniciadores de Conversa */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              Iniciadores de Conversa
            </h3>
            <div className="space-y-2">
              {tactics.iniciadoresConversa.map((item, i) => (
                <div key={i} className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                  <p className="text-sm text-foreground">&ldquo;{item.texto}&rdquo;</p>
                  <p className="text-xs text-blue-700 dark:text-blue-400 mt-1 italic">
                    {item.explicacao}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Pontos de Dor */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
              <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
              Pontos de Dor a Abordar
            </h3>
            <div className="space-y-2">
              {tactics.pontosDor.map((item, i) => (
                <div key={i} className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3">
                  <p className="text-sm text-foreground font-medium">{item.texto}</p>
                  <p className="text-xs text-orange-700 dark:text-orange-400 mt-1 italic">
                    {item.explicacao}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Dicas de Sucesso */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Dicas de Sucesso
            </h3>
            <div className="space-y-2">
              {tactics.dicasSucesso.map((item, i) => (
                <div key={i} className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                  <p className="text-sm text-foreground font-medium">{item.texto}</p>
                  <p className="text-xs text-green-700 dark:text-green-400 mt-1 italic">
                    {item.explicacao}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Probabilidade */}
          <div className={`rounded-lg p-4 ${
            tactics.probabilidadeConversao.nivel === "Alta"
              ? "bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700"
              : tactics.probabilidadeConversao.nivel === "Media"
              ? "bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700"
              : "bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700"
          }`}>
            <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
              Probabilidade de Conversao
              <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                tactics.probabilidadeConversao.nivel === "Alta"
                  ? "bg-green-600 text-white"
                  : tactics.probabilidadeConversao.nivel === "Media"
                  ? "bg-yellow-600 text-white"
                  : "bg-red-600 text-white"
              }`}>
                {tactics.probabilidadeConversao.nivel}
              </span>
            </h3>
            <p className="text-sm text-muted-foreground">{tactics.probabilidadeConversao.justificacao}</p>
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-border flex items-center gap-3">
            <button
              onClick={generateTactics}
              disabled={loading}
              className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Gerar novas sugestoes
            </button>
            <button
              onClick={clearTactics}
              className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Apagar sugestao
            </button>
          </div>
        </div>
      )}

      {!tactics && !loading && !error && (
        <p className="text-sm text-muted-foreground text-center py-4 mt-4">
          Clique no botao acima para gerar sugestoes personalizadas de abordagem usando IA.
        </p>
      )}
    </div>
  )
}
