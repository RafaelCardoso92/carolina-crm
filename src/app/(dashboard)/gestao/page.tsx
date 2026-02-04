"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
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
  }
  tarefas: {
    pendentes: number
    concluidasMes: number
  }
  cobrancas: {
    pendentes: { count: number; valor: number }
    recebidoMes: { count: number; valor: number }
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
        <div className="text-muted-foreground">A carregar...</div>
      </div>
    )
  }

  const selectedSellerData = selectedSeller ? sellers.find(s => s.seller.id === selectedSeller) : null

  // Calculate totals
  const totals = sellers.reduce((acc, s) => ({
    vendasMes: acc.vendasMes + s.vendas.mes.total,
    vendasAno: acc.vendasAno + s.vendas.ano.total,
    clientes: acc.clientes + s.clientes.total,
    clientesAtivos: acc.clientesAtivos + s.clientes.ativos,
    prospectos: acc.prospectos + s.prospectos.total,
    cobrancasPendentes: acc.cobrancasPendentes + s.cobrancas.pendentes.valor
  }), { vendasMes: 0, vendasAno: 0, clientes: 0, clientesAtivos: 0, prospectos: 0, cobrancasPendentes: 0 })

  const anosDisponiveis = [ano - 1, ano, ano + 1]

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
          <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Gestao de Vendedores
        </h1>
        <p className="text-muted-foreground mt-1">Acompanhe o desempenho da sua equipa de vendas</p>
      </div>

      {/* Period Selector */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select
          value={mes}
          onChange={(e) => setMes(parseInt(e.target.value))}
          className="px-4 py-2 border border-border rounded-xl bg-background text-foreground"
        >
          {MESES.slice(1).map((m, i) => (
            <option key={i + 1} value={i + 1}>{m}</option>
          ))}
        </select>
        <select
          value={ano}
          onChange={(e) => setAno(parseInt(e.target.value))}
          className="px-4 py-2 border border-border rounded-xl bg-background text-foreground"
        >
          {anosDisponiveis.map(a => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-4 border border-primary/20">
          <p className="text-sm text-muted-foreground">Vendas {MESES[mes]}</p>
          <p className="text-2xl font-bold text-primary">{formatCurrency(totals.vendasMes)}</p>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <p className="text-sm text-muted-foreground">Vendas {ano}</p>
          <p className="text-2xl font-bold">{formatCurrency(totals.vendasAno)}</p>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <p className="text-sm text-muted-foreground">Clientes Ativos</p>
          <p className="text-2xl font-bold">{totals.clientesAtivos}</p>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <p className="text-sm text-muted-foreground">A Receber</p>
          <p className="text-2xl font-bold text-amber-600">{formatCurrency(totals.cobrancasPendentes)}</p>
        </div>
      </div>

      {/* Sellers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {sellers.map(s => (
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
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-bold">
                  {(s.seller.name || s.seller.email)[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-lg">{s.seller.name || s.seller.email}</h3>
                  <p className="text-sm text-muted-foreground">{s.seller.email}</p>
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
                <span>{formatCurrency(s.vendas.mes.total)}</span>
                <span className="text-muted-foreground">Meta: {formatCurrency(s.vendas.mes.objetivo)}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className={"h-2 rounded-full transition-all " + (s.vendas.mes.progresso >= 100 ? "bg-green-500" : s.vendas.mes.progresso >= 75 ? "bg-primary" : "bg-amber-500")}
                  style={{ width: Math.min(100, s.vendas.mes.progresso) + "%" }}
                />
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <p className="text-lg font-bold">{s.vendas.mes.count}</p>
                <p className="text-xs text-muted-foreground">Vendas</p>
              </div>
              <div>
                <p className="text-lg font-bold">{s.clientes.ativos}</p>
                <p className="text-xs text-muted-foreground">Clientes</p>
              </div>
              <div>
                <p className="text-lg font-bold">{s.prospectos.taxaConversao}%</p>
                <p className="text-xs text-muted-foreground">Conversao</p>
              </div>
              <div>
                <p className="text-lg font-bold">{s.tarefas.pendentes}</p>
                <p className="text-xs text-muted-foreground">Tarefas</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed View */}
      {selectedSellerData && (
        <div className="bg-card rounded-xl p-6 border border-border">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Detalhes: {selectedSellerData.seller.name || selectedSellerData.seller.email}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Vendas */}
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground mb-3">VENDAS</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Mensal</span>
                  <span className="font-bold">{formatCurrency(selectedSellerData.vendas.mes.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Trimestral</span>
                  <span className="font-bold">{formatCurrency(selectedSellerData.vendas.trimestre.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Anual</span>
                  <span className="font-bold">{formatCurrency(selectedSellerData.vendas.ano.total)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span>Ticket Medio</span>
                  <span className="font-bold text-primary">{formatCurrency(selectedSellerData.vendas.ticketMedio)}</span>
                </div>
              </div>
            </div>

            {/* Clientes & Prospectos */}
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground mb-3">CLIENTES E PROSPECTOS</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Total Clientes</span>
                  <span className="font-bold">{selectedSellerData.clientes.total}</span>
                </div>
                <div className="flex justify-between">
                  <span>Clientes Ativos</span>
                  <span className="font-bold text-green-600">{selectedSellerData.clientes.ativos}</span>
                </div>
                <div className="flex justify-between">
                  <span>Novos este Mes</span>
                  <span className="font-bold text-primary">{selectedSellerData.clientes.novosMes}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span>Prospectos</span>
                  <span className="font-bold">{selectedSellerData.prospectos.total}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxa Conversao</span>
                  <span className="font-bold text-primary">{selectedSellerData.prospectos.taxaConversao}%</span>
                </div>
              </div>
            </div>

            {/* Cobrancas & Tarefas */}
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground mb-3">COBRANCAS E TAREFAS</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Pendente</span>
                  <span className="font-bold text-amber-600">{formatCurrency(selectedSellerData.cobrancas.pendentes.valor)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Recebido este Mes</span>
                  <span className="font-bold text-green-600">{formatCurrency(selectedSellerData.cobrancas.recebidoMes.valor)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span>Tarefas Pendentes</span>
                  <span className={"font-bold " + (selectedSellerData.tarefas.pendentes > 5 ? "text-red-500" : "")}>{selectedSellerData.tarefas.pendentes}</span>
                </div>
                <div className="flex justify-between">
                  <span>Concluidas este Mes</span>
                  <span className="font-bold text-green-600">{selectedSellerData.tarefas.concluidasMes}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6 pt-4 border-t">
            <a
              href={"/clientes?seller=" + selectedSellerData.seller.id}
              className="px-4 py-2 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition text-sm font-medium"
            >
              Ver Clientes
            </a>
            <a
              href={"/vendas?seller=" + selectedSellerData.seller.id}
              className="px-4 py-2 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition text-sm font-medium"
            >
              Ver Vendas
            </a>
            <a
              href={"/prospectos?seller=" + selectedSellerData.seller.id}
              className="px-4 py-2 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition text-sm font-medium"
            >
              Ver Prospectos
            </a>
            <a
              href={"/cobrancas?seller=" + selectedSellerData.seller.id}
              className="px-4 py-2 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition text-sm font-medium"
            >
              Ver Cobrancas
            </a>
          </div>
        </div>
      )}

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
