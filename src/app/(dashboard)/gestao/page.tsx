"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { isAdminOrHigher } from "@/lib/permissions"
import { formatCurrency } from "@/lib/utils"

const MESES = [
  "", "Janeiro", "Fevereiro", "Marco", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
]

type SellerMetrics = {
  seller: {
    id: string
    name: string | null
    email: string
    since: string
  }
  clientes: {
    total: number
    ativos: number
    novosMes: number
  }
  prospectos: {
    total: number
    convertidos: number
    taxaConversao: number
  }
  vendas: {
    mes: { total: number; count: number; objetivo: number; progresso: number }
    trimestre: { total: number; objetivo: number; progresso: number }
    ano: { total: number; objetivo: number; progresso: number }
    ticketMedio: number
    mesAnterior?: number
  }
  tarefas: {
    pendentes: number
    concluidasMes: number
    atrasadas?: number
  }
  cobrancas: {
    pendentes: { count: number; valor: number }
    recebidoMes: { count: number; valor: number }
    atrasadas?: { count: number; valor: number }
  }
}

export default function GestaoPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [sellers, setSellers] = useState<SellerMetrics[]>([])
  const [selectedSeller, setSelectedSeller] = useState<string | null>(null)
  const [mes, setMes] = useState(new Date().getMonth() + 1)
  const [ano, setAno] = useState(new Date().getFullYear())
  const [viewMode, setViewMode] = useState<"cards" | "leaderboard">("cards")

  useEffect(() => {
    if (status === "authenticated") {
      if (!isAdminOrHigher(session?.user?.role)) {
        router.push("/")
        return
      }
      fetchMetrics()
    }
  }, [status, session, mes, ano])

  async function fetchMetrics() {
    setLoading(true)
    try {
      const res = await fetch("/api/sellers/metrics?mes=" + mes + "&ano=" + ano)
      if (res.ok) {
        const data = await res.json()
        setSellers(data.sellers)
      }
    } catch (error) {
      console.error("Error fetching metrics:", error)
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const selectedSellerData = selectedSeller ? sellers.find(s => s.seller.id === selectedSeller) : null

  // Calculate totals
  const totals = sellers.reduce((acc, s) => ({
    vendasMes: acc.vendasMes + s.vendas.mes.total,
    objetivoMes: acc.objetivoMes + s.vendas.mes.objetivo,
    vendasAno: acc.vendasAno + s.vendas.ano.total,
    objetivoAno: acc.objetivoAno + s.vendas.ano.objetivo,
    clientes: acc.clientes + s.clientes.total,
    clientesAtivos: acc.clientesAtivos + s.clientes.ativos,
    novosClientes: acc.novosClientes + s.clientes.novosMes,
    prospectos: acc.prospectos + s.prospectos.total,
    cobrancasPendentes: acc.cobrancasPendentes + s.cobrancas.pendentes.valor,
    tarefasPendentes: acc.tarefasPendentes + s.tarefas.pendentes
  }), { vendasMes: 0, objetivoMes: 0, vendasAno: 0, objetivoAno: 0, clientes: 0, clientesAtivos: 0, novosClientes: 0, prospectos: 0, cobrancasPendentes: 0, tarefasPendentes: 0 })

  const progressoEquipa = totals.objetivoMes > 0 ? Math.round((totals.vendasMes / totals.objetivoMes) * 100) : 0

  // Sort sellers by performance for leaderboard
  const sortedSellers = [...sellers].sort((a, b) => b.vendas.mes.total - a.vendas.mes.total)

  // Alerts - things that need attention
  const alerts: { type: string; seller: string; message: string }[] = []
  sellers.forEach(s => {
    if (s.vendas.mes.progresso < 50 && new Date().getDate() > 15) {
      alerts.push({ type: "warning", seller: s.seller.name || s.seller.email, message: `Esta a ${s.vendas.mes.progresso}% do objetivo mensal` })
    }
    if (s.tarefas.pendentes > 10) {
      alerts.push({ type: "info", seller: s.seller.name || s.seller.email, message: `Tem ${s.tarefas.pendentes} tarefas pendentes` })
    }
    if (s.cobrancas.pendentes.valor > 5000) {
      alerts.push({ type: "alert", seller: s.seller.name || s.seller.email, message: `${formatCurrency(s.cobrancas.pendentes.valor)}€ em cobrancas pendentes` })
    }
  })

  const anosDisponiveis = [ano - 1, ano, ano + 1]

  // Top performer
  const topPerformer = sortedSellers[0]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            Painel de Gestao
          </h1>
          <p className="text-muted-foreground mt-1">Visao geral do desempenho da equipa</p>
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

      {/* Team Progress Hero */}
      <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-white/80 text-sm font-medium uppercase tracking-wider">Objetivo da Equipa - {MESES[mes]} {ano}</p>
            <div className="flex items-baseline gap-3 mt-2">
              <span className="text-4xl md:text-5xl font-bold">{formatCurrency(totals.vendasMes)}€</span>
              <span className="text-white/70 text-lg">/ {formatCurrency(totals.objetivoMes)}€</span>
            </div>
          </div>
          <div className="text-center md:text-right">
            <div className={`text-5xl md:text-6xl font-bold ${progressoEquipa >= 100 ? "text-green-300" : progressoEquipa >= 75 ? "text-white" : "text-amber-300"}`}>
              {progressoEquipa}%
            </div>
            <p className="text-white/70 text-sm mt-1">
              {progressoEquipa >= 100 ? "Objetivo atingido!" : `Faltam ${formatCurrency(totals.objetivoMes - totals.vendasMes)}€`}
            </p>
          </div>
        </div>
        <div className="mt-4">
          <div className="w-full bg-white/20 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all ${progressoEquipa >= 100 ? "bg-green-400" : "bg-white"}`}
              style={{ width: Math.min(100, progressoEquipa) + "%" }}
            />
          </div>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <span className="text-xs text-muted-foreground font-medium">Vendedores</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{sellers.length}</p>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-green-100 rounded-lg">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <span className="text-xs text-muted-foreground font-medium">Clientes Ativos</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{totals.clientesAtivos}</p>
          <p className="text-xs text-green-600 font-medium">+{totals.novosClientes} este mes</p>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-purple-100 rounded-lg">
              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <span className="text-xs text-muted-foreground font-medium">Prospectos</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{totals.prospectos}</p>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-amber-100 rounded-lg">
              <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-xs text-muted-foreground font-medium">A Receber</span>
          </div>
          <p className="text-2xl font-bold text-amber-600">{formatCurrency(totals.cobrancasPendentes)}€</p>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-red-100 rounded-lg">
              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <span className="text-xs text-muted-foreground font-medium">Tarefas Pendentes</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{totals.tarefasPendentes}</p>
        </div>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="font-semibold text-amber-800 dark:text-amber-200">Pontos de Atencao ({alerts.length})</h3>
          </div>
          <div className="space-y-2">
            {alerts.slice(0, 5).map((alert, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className="font-medium text-amber-700 dark:text-amber-300">{alert.seller}:</span>
                <span className="text-amber-600 dark:text-amber-400">{alert.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* View Toggle */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground font-medium">Vista:</span>
        <button
          onClick={() => setViewMode("cards")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${viewMode === "cards" ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
        >
          Cards
        </button>
        <button
          onClick={() => setViewMode("leaderboard")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${viewMode === "leaderboard" ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
        >
          Ranking
        </button>
      </div>

      {/* Leaderboard View */}
      {viewMode === "leaderboard" && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/30">
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              Ranking de Vendas - {MESES[mes]} {ano}
            </h3>
          </div>
          <div className="divide-y divide-border">
            {sortedSellers.map((s, index) => (
              <div 
                key={s.seller.id} 
                className={`flex items-center gap-4 p-4 hover:bg-muted/30 transition ${index < 3 ? "bg-gradient-to-r from-amber-50/50 to-transparent dark:from-amber-950/20" : ""}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                  index === 0 ? "bg-amber-400 text-amber-900" :
                  index === 1 ? "bg-gray-300 text-gray-700" :
                  index === 2 ? "bg-amber-600 text-white" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground">{s.seller.name || s.seller.email}</p>
                    {index === 0 && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Top Performer</span>}
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    <span>{s.vendas.mes.count} vendas</span>
                    <span>{s.clientes.ativos} clientes</span>
                    <span>{s.prospectos.taxaConversao}% conversao</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-foreground">{formatCurrency(s.vendas.mes.total)}€</p>
                  <p className={`text-sm font-medium ${s.vendas.mes.progresso >= 100 ? "text-green-600" : s.vendas.mes.progresso >= 75 ? "text-primary" : "text-amber-600"}`}>
                    {s.vendas.mes.progresso}% do objetivo
                  </p>
                </div>
                <Link
                  href={`/?seller=${s.seller.id}`}
                  className="p-2 hover:bg-primary/10 rounded-lg transition"
                  title="Ver dashboard"
                >
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cards View */}
      {viewMode === "cards" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {sellers.map((s, index) => (
            <div
              key={s.seller.id}
              onClick={() => setSelectedSeller(selectedSeller === s.seller.id ? null : s.seller.id)}
              className={"bg-card rounded-xl p-5 border cursor-pointer transition-all " + (
                selectedSeller === s.seller.id 
                  ? "border-primary ring-2 ring-primary/20" 
                  : "border-border hover:border-primary/50"
              )}
            >
              {/* Seller Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-bold">
                      {(s.seller.name || s.seller.email)[0].toUpperCase()}
                    </div>
                    {index === 0 && sortedSellers[0].seller.id === s.seller.id && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-amber-900" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{s.seller.name || s.seller.email}</h3>
                    <p className="text-sm text-muted-foreground">{s.clientes.ativos} clientes ativos</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={"text-2xl font-bold " + (s.vendas.mes.progresso >= 100 ? "text-green-600" : s.vendas.mes.progresso >= 75 ? "text-primary" : "text-amber-600")}>
                    {s.vendas.mes.progresso}%
                  </p>
                  <p className="text-xs text-muted-foreground">do objetivo</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-semibold">{formatCurrency(s.vendas.mes.total)}€</span>
                  <span className="text-muted-foreground">Meta: {formatCurrency(s.vendas.mes.objetivo)}€</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2.5">
                  <div 
                    className={"h-2.5 rounded-full transition-all " + (s.vendas.mes.progresso >= 100 ? "bg-green-500" : s.vendas.mes.progresso >= 75 ? "bg-primary" : "bg-amber-500")}
                    style={{ width: Math.min(100, s.vendas.mes.progresso) + "%" }}
                  />
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-muted/50 rounded-lg p-2">
                  <p className="text-lg font-bold">{s.vendas.mes.count}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Vendas</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-2">
                  <p className="text-lg font-bold">{s.clientes.novosMes}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Novos</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-2">
                  <p className="text-lg font-bold">{s.prospectos.taxaConversao}%</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Conv.</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-2">
                  <p className={"text-lg font-bold " + (s.tarefas.pendentes > 10 ? "text-red-500" : "")}>{s.tarefas.pendentes}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Tarefas</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detailed View */}
      {selectedSellerData && (
        <div className="bg-card rounded-xl p-6 border border-border">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {selectedSellerData.seller.name || selectedSellerData.seller.email}
            </h3>
            <button 
              onClick={() => setSelectedSeller(null)}
              className="p-2 hover:bg-muted rounded-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Vendas */}
            <div className="bg-muted/30 rounded-xl p-4">
              <h4 className="font-semibold text-sm text-primary mb-3 uppercase tracking-wider">Vendas</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mensal</span>
                  <span className="font-bold">{formatCurrency(selectedSellerData.vendas.mes.total)}€</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Trimestral</span>
                  <span className="font-bold">{formatCurrency(selectedSellerData.vendas.trimestre.total)}€</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Anual</span>
                  <span className="font-bold">{formatCurrency(selectedSellerData.vendas.ano.total)}€</span>
                </div>
                <div className="flex justify-between border-t border-border pt-2">
                  <span className="text-muted-foreground">Ticket Medio</span>
                  <span className="font-bold text-primary">{formatCurrency(selectedSellerData.vendas.ticketMedio)}€</span>
                </div>
              </div>
            </div>

            {/* Clientes & Prospectos */}
            <div className="bg-muted/30 rounded-xl p-4">
              <h4 className="font-semibold text-sm text-primary mb-3 uppercase tracking-wider">Clientes</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-bold">{selectedSellerData.clientes.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ativos</span>
                  <span className="font-bold text-green-600">{selectedSellerData.clientes.ativos}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Novos este Mes</span>
                  <span className="font-bold text-primary">{selectedSellerData.clientes.novosMes}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-2">
                  <span className="text-muted-foreground">Prospectos</span>
                  <span className="font-bold">{selectedSellerData.prospectos.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Taxa Conversao</span>
                  <span className="font-bold text-primary">{selectedSellerData.prospectos.taxaConversao}%</span>
                </div>
              </div>
            </div>

            {/* Cobrancas & Tarefas */}
            <div className="bg-muted/30 rounded-xl p-4">
              <h4 className="font-semibold text-sm text-primary mb-3 uppercase tracking-wider">Financeiro</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pendente</span>
                  <span className="font-bold text-amber-600">{formatCurrency(selectedSellerData.cobrancas.pendentes.valor)}€</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Recebido este Mes</span>
                  <span className="font-bold text-green-600">{formatCurrency(selectedSellerData.cobrancas.recebidoMes.valor)}€</span>
                </div>
                <div className="flex justify-between border-t border-border pt-2">
                  <span className="text-muted-foreground">Tarefas Pendentes</span>
                  <span className={"font-bold " + (selectedSellerData.tarefas.pendentes > 5 ? "text-red-500" : "")}>{selectedSellerData.tarefas.pendentes}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Concluidas este Mes</span>
                  <span className="font-bold text-green-600">{selectedSellerData.tarefas.concluidasMes}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-border">
            <Link
              href={"/?seller=" + selectedSellerData.seller.id}
              className="px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-hover transition text-sm font-medium flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Ver Dashboard
            </Link>
            <Link
              href={"/clientes?seller=" + selectedSellerData.seller.id}
              className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-xl transition text-sm font-medium"
            >
              Clientes
            </Link>
            <Link
              href={"/vendas?seller=" + selectedSellerData.seller.id}
              className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-xl transition text-sm font-medium"
            >
              Vendas
            </Link>
            <Link
              href={"/prospectos?seller=" + selectedSellerData.seller.id}
              className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-xl transition text-sm font-medium"
            >
              Prospectos
            </Link>
            <Link
              href={"/cobrancas?seller=" + selectedSellerData.seller.id}
              className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-xl transition text-sm font-medium"
            >
              Cobrancas
            </Link>
            <Link
              href={"/tarefas?seller=" + selectedSellerData.seller.id}
              className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-xl transition text-sm font-medium"
            >
              Tarefas
            </Link>
          </div>
        </div>
      )}

      {/* Quick Actions for Admins */}
      <div className="bg-card rounded-xl border border-border p-4">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Acoes Rapidas
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link href="/admin/usuarios" className="flex items-center gap-3 p-3 bg-muted/50 hover:bg-muted rounded-xl transition">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-sm">Gerir Usuarios</p>
              <p className="text-xs text-muted-foreground">Adicionar ou editar</p>
            </div>
          </Link>
          <Link href="/definicoes" className="flex items-center gap-3 p-3 bg-muted/50 hover:bg-muted rounded-xl transition">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-sm">Objetivos</p>
              <p className="text-xs text-muted-foreground">Definir metas</p>
            </div>
          </Link>
          <Link href="/reconciliacao" className="flex items-center gap-3 p-3 bg-muted/50 hover:bg-muted rounded-xl transition">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-sm">Reconciliacao</p>
              <p className="text-xs text-muted-foreground">Validar vendas</p>
            </div>
          </Link>
          <Link href="/cobrancas" className="flex items-center gap-3 p-3 bg-muted/50 hover:bg-muted rounded-xl transition">
            <div className="p-2 bg-amber-100 rounded-lg">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-sm">Cobrancas</p>
              <p className="text-xs text-muted-foreground">Ver pendentes</p>
            </div>
          </Link>
        </div>
      </div>

      {sellers.length === 0 && !loading && (
        <div className="text-center py-12 text-muted-foreground">
          <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p>Nenhum vendedor encontrado</p>
        </div>
      )}
    </div>
  )
}
