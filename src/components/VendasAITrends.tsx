"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Swal from "sweetalert2"

type InsightData = {
  resumo: string
  tendenciaGeral: string
  produtosDestaque: Array<{ nome: string; motivo: string; tendencia: string }>
  produtosAtencao: Array<{ nome: string; motivo: string; sugestao: string }>
  clientesChave: Array<{ nome: string; valor: number; oportunidade: string }>
  previsoes: Array<{ periodo: string; previsao: string; confianca: string }>
  recomendacoes: string[]
}

type Insight = { id: string; data: InsightData; summary: string; createdAt: string; updatedAt: string }
type TokenBalance = { remaining: number; formatted: string; isNegative: boolean }

export default function VendasAITrends() {
  const [insight, setInsight] = useState<Insight | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [tokens, setTokens] = useState<TokenBalance | null>(null)

  useEffect(() => { fetchInsight(); fetchTokens() }, [])

  async function fetchTokens() {
    try {
      const res = await fetch("/api/tokens/balance")
      if (res.ok) setTokens(await res.json())
    } catch (e) { console.error(e) }
  }

  async function fetchInsight() {
    try {
      const res = await fetch("/api/ai/vendas-trends")
      if (res.ok) setInsight((await res.json()).insight)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  async function generateInsight() {
    if (tokens?.isNegative) {
      Swal.fire({
        icon: "warning", title: "Tokens esgotados",
        html: "O seu saldo esta negativo.<br/>Adicione mais tokens.",
        confirmButtonText: "Comprar Tokens", confirmButtonColor: "#b8860b",
        showCancelButton: true, cancelButtonText: "Cancelar"
      }).then((r) => { if (r.isConfirmed) window.location.href = "/definicoes?tab=tokens" })
      return
    }
    setGenerating(true)
    try {
      const res = await fetch("/api/ai/vendas-trends", { method: "POST" })
      if (res.status === 402) {
        Swal.fire({ icon: "warning", title: "Tokens insuficientes", confirmButtonText: "Comprar", confirmButtonColor: "#b8860b" })
          .then(() => { window.location.href = "/definicoes?tab=tokens" })
        return
      }
      if (res.ok) { setInsight((await res.json()).insight); setExpanded(true); fetchTokens() }
    } catch (e) { console.error(e); Swal.fire({ icon: "error", title: "Erro", confirmButtonColor: "#b8860b" }) }
    finally { setGenerating(false) }
  }

  async function deleteInsight() {
    const r = await Swal.fire({ icon: "question", title: "Eliminar?", showCancelButton: true, confirmButtonText: "Eliminar", confirmButtonColor: "#dc2626" })
    if (r.isConfirmed) { await fetch("/api/ai/vendas-trends", { method: "DELETE" }); setInsight(null); setExpanded(false) }
  }

  const data = insight?.data as InsightData | undefined

  if (loading) return (
    <div className="bg-white dark:bg-card rounded-2xl p-4 border border-emerald-500/20 shadow-sm">
      <div className="animate-pulse flex items-center gap-2"><div className="w-5 h-5 bg-emerald-500/20 rounded" /><div className="h-4 bg-emerald-500/20 rounded w-36" /></div>
    </div>
  )

  return (
    <div className="bg-white dark:bg-card rounded-2xl border border-emerald-500/20 overflow-hidden shadow-sm">
      <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-500/5 transition" onClick={() => insight && setExpanded(!expanded)}>
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
          <h3 className="font-bold text-foreground">Tendencias de Vendas AI</h3>
          {insight && <span className="text-xs text-muted-foreground">{new Date(insight.updatedAt).toLocaleDateString("pt-PT")}</span>}
        </div>
        <div className="flex items-center gap-2">
          {tokens && (
            <Link href="/definicoes?tab=tokens" onClick={(e) => e.stopPropagation()}
              className={`text-xs px-2 py-1 rounded-full font-medium ${tokens.isNegative ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"}`}>
              {tokens.formatted} tokens
            </Link>
          )}
          {insight && data?.tendenciaGeral && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${data.tendenciaGeral === "SUBIDA" ? "bg-green-500 text-white" : data.tendenciaGeral === "DESCIDA" ? "bg-red-500 text-white" : "bg-yellow-500 text-black"}`}>{data.tendenciaGeral}</span>
          )}
          {insight && (
            <>
              <button onClick={(e) => { e.stopPropagation(); deleteInsight() }} className="p-1 text-muted-foreground hover:text-red-500 transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
              <svg className={`w-4 h-4 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </>
          )}
        </div>
      </div>

      {!insight ? (
        <div className="px-4 pb-4">
          <p className="text-sm text-muted-foreground mb-3">Analise tendencias de vendas e obtenha recomendacoes</p>
          <button onClick={generateInsight} disabled={generating}
            className={`w-full py-2 rounded-xl font-medium transition disabled:opacity-50 flex items-center justify-center gap-2 ${tokens?.isNegative ? "bg-red-500 text-white hover:bg-red-600" : "bg-emerald-500 text-white hover:bg-emerald-600"}`}>
            {generating ? (<><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> A analisar...</>) : 
             tokens?.isNegative ? "Comprar Tokens" : (<><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> Analisar Tendencias</>)}
          </button>
        </div>
      ) : (
        <>
          <div className="px-4 pb-2"><p className="text-sm text-foreground">{data?.resumo}</p></div>
          {expanded && data && (
            <div className="px-4 pb-4 space-y-4">
              {data.produtosDestaque?.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-emerald-600 mb-2 flex items-center gap-1"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg> Produtos em Destaque</h4>
                  <div className="space-y-2">
                    {data.produtosDestaque.map((p, i) => (
                      <div key={i} className="bg-emerald-50 dark:bg-emerald-950/20 p-2 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-foreground">{p.nome}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${p.tendencia === "SUBIDA" ? "bg-green-500 text-white" : "bg-yellow-500 text-black"}`}>{p.tendencia}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground">{p.motivo}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {data.produtosAtencao?.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-orange-600 mb-2 flex items-center gap-1"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg> Produtos que Precisam Atencao</h4>
                  <div className="space-y-2">
                    {data.produtosAtencao.map((p, i) => (
                      <div key={i} className="bg-orange-50 dark:bg-orange-950/20 p-2 rounded-lg">
                        <span className="text-xs font-medium text-foreground">{p.nome}</span>
                        <p className="text-[10px] text-muted-foreground">{p.motivo}</p>
                        <p className="text-[10px] text-orange-600 mt-1">{p.sugestao}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {data.clientesChave?.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-blue-600 mb-2 flex items-center gap-1"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg> Clientes Chave</h4>
                  <div className="space-y-2">
                    {data.clientesChave.slice(0, 5).map((c, i) => (
                      <div key={i} className="bg-blue-50 dark:bg-blue-950/20 p-2 rounded-lg flex items-center justify-between">
                        <div><span className="text-xs font-medium text-foreground">{c.nome}</span><p className="text-[10px] text-muted-foreground">{c.oportunidade}</p></div>
                        <span className="text-xs font-bold text-blue-600">{c.valor.toFixed(2)}€</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {data.recomendacoes?.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-purple-600 mb-2 flex items-center gap-1"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg> Recomendacoes</h4>
                  <ul className="space-y-1">
                    {data.recomendacoes.map((r, i) => (<li key={i} className="text-xs text-foreground bg-purple-50 dark:bg-purple-950/20 px-2 py-1 rounded flex items-start gap-2"><span className="text-purple-500 mt-0.5">•</span>{r}</li>))}
                  </ul>
                </div>
              )}
              <button onClick={generateInsight} disabled={generating}
                className={`w-full py-2 rounded-xl text-sm font-medium transition disabled:opacity-50 flex items-center justify-center gap-2 ${tokens?.isNegative ? "bg-red-100 text-red-700 hover:bg-red-200" : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"}`}>
                {generating ? (<><div className="w-3 h-3 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /> A reanalisar...</>) : 
                 tokens?.isNegative ? "Comprar Tokens" : (<><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg> Reanalisar</>)}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
