"use client"

import { useState, useEffect } from "react"
import SalesCharts from "./SalesCharts"
import { TarefasWidget, FollowUpWidget } from "@/components/DashboardWidgets"
import { NotificationsWidget, ForecastWidget, HealthScoresWidget, QuickStatsWidget, AcordosWidget } from "@/components/EnhancedDashboardWidgets"
import { formatCurrency } from "@/lib/utils"
import HelpTooltip from "@/components/HelpTooltip"

const meses = [
  "", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
]

const IVA_RATE = 0.23

function calcularIVA(totalComIVA: number) {
  const semIVA = totalComIVA / (1 + IVA_RATE)
  const iva = totalComIVA - semIVA
  return { semIVA, iva }
}

interface ProximaParcela {
  id: string
  numero: number
  valor: number
  dataVencimento: string
  clienteNome: string
  cobrancaId: string
  fatura: string | null
}

interface DashboardData {
  totalClientes: number
  clientesAtivos: number
  vendasMes: number
  vendasTrimestre: number
  vendasAno: number
  pendentes: number
  objetivoMensal: number
  objetivoTrimestral: number
  objetivoAnual: number
  progressoMensal: number
  progressoTrimestral: number
  progressoAnual: number
  currentMonth: number
  currentYear: number
  currentTrimestre: number
  premioMensalAtual: { minimo: number; premio: number } | null
  proximoPremioMensal: { minimo: number; premio: number } | null
  premioTrimestralAtual: { minimo: number; premio: number } | null
  proximoPremioTrimestral: { minimo: number; premio: number } | null
  anosDisponiveis: number[]
  // Late payments data
  parcelasAtrasadas: number
  valorAtrasado: number
  proximasParcelas: ProximaParcela[]
}

export default function DashboardView() {
  const currentDate = new Date()
  const [ano, setAno] = useState(currentDate.getFullYear())
  const [mes, setMes] = useState(currentDate.getMonth() + 1)
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)

  useEffect(() => {
    fetchData()
    // Generate follow-up tasks automatically
    fetch("/api/auto-followup", { method: "POST" })
  }, [ano, mes])

  async function fetchData() {
    setLoading(true)
    try {
      const res = await fetch(`/api/dashboard?ano=${ano}&mes=${mes}`)
      const json = await res.json()
      setData(json)
    } catch (error) {
      console.error("Error fetching dashboard:", error)
    }
    setLoading(false)
  }

  async function exportToExcel(tipo: string) {
    setExporting(true)
    setShowExportMenu(false)
    try {
      const res = await fetch(`/api/export/vendas?ano=${ano}&tipo=${tipo}`)
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `Relatorio_Vendas_${ano}${tipo !== "completo" ? `_${tipo}` : ""}.xlsx`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error("Error exporting:", error)
    }
    setExporting(false)
  }

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  const ivaMes = calcularIVA(data.vendasMes)
  const ivaTrimestre = calcularIVA(data.vendasTrimestre)
  const ivaAno = calcularIVA(data.vendasAno)

  // Build year options - include current year and any years with data
  const yearsSet = new Set([currentDate.getFullYear(), ...data.anosDisponiveis])
  const years = Array.from(yearsSet).sort((a, b) => b - a)

  return (
    <div>
      {/* Header with Period Selectors */}
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">{meses[data.currentMonth]} {data.currentYear}</p>
          </div>

          {/* Export Button - visible on larger screens in header */}
          <div className="hidden sm:block relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={exporting}
              className="bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl px-4 py-3 flex items-center gap-2 shadow-sm transition disabled:opacity-50"
            >
              {exporting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
              <span className="hidden md:inline">Exportar Excel</span>
              <span className="md:hidden">Excel</span>
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-card rounded-xl shadow-lg border border-border py-2 z-50">
                <button
                  onClick={() => exportToExcel("completo")}
                  className="w-full px-4 py-2 text-left text-foreground hover:bg-secondary flex items-center gap-2"
                >
                  <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="font-medium">Relatorio Completo</span>
                </button>
                <button
                  onClick={() => exportToExcel("detalhado")}
                  className="w-full px-4 py-2 text-left text-foreground hover:bg-secondary flex items-center gap-2"
                >
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span>Vendas Detalhadas</span>
                </button>
                <button
                  onClick={() => exportToExcel("mensal")}
                  className="w-full px-4 py-2 text-left text-foreground hover:bg-secondary flex items-center gap-2"
                >
                  <svg className="w-4 h-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Resumo Mensal</span>
                </button>
                <button
                  onClick={() => exportToExcel("trimestral")}
                  className="w-full px-4 py-2 text-left text-foreground hover:bg-secondary flex items-center gap-2"
                >
                  <svg className="w-4 h-4 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span>Resumo Trimestral</span>
                </button>
                <button
                  onClick={() => exportToExcel("clientes")}
                  className="w-full px-4 py-2 text-left text-foreground hover:bg-secondary flex items-center gap-2"
                >
                  <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                  <span>Vendas por Cliente</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Period Selectors - Row on mobile */}
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <div className="bg-card rounded-xl shadow-sm p-2 flex items-center gap-2 border border-border flex-1 sm:flex-none">
            <label className="text-xs sm:text-sm font-medium text-muted-foreground pl-2">Ano:</label>
            <select
              value={ano}
              onChange={(e) => setAno(parseInt(e.target.value))}
              className="border-0 bg-primary/10 text-primary font-bold rounded-lg px-2 sm:px-3 py-2 focus:ring-2 focus:ring-primary text-sm sm:text-base flex-1 sm:flex-none"
            >
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div className="bg-card rounded-xl shadow-sm p-2 flex items-center gap-2 border border-border flex-1 sm:flex-none">
            <label className="text-xs sm:text-sm font-medium text-muted-foreground pl-2">Mes:</label>
            <select
              value={mes}
              onChange={(e) => setMes(parseInt(e.target.value))}
              className="border-0 bg-primary/10 text-primary font-bold rounded-lg px-2 sm:px-3 py-2 focus:ring-2 focus:ring-primary text-sm sm:text-base flex-1 sm:flex-none"
            >
              {meses.slice(1).map((m, i) => (
                <option key={i + 1} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>

          {/* Export Button - Mobile only full width */}
          <div className="sm:hidden relative w-full">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={exporting}
              className="bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl px-4 py-3 flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50 w-full"
            >
              {exporting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
              Exportar Excel
            </button>

            {showExportMenu && (
              <div className="absolute left-0 right-0 mt-2 bg-card rounded-xl shadow-lg border border-border py-2 z-50">
                <button
                  onClick={() => exportToExcel("completo")}
                  className="w-full px-4 py-3 text-left text-foreground hover:bg-secondary flex items-center gap-2"
                >
                  <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="font-medium">Relatorio Completo</span>
                </button>
                <button
                  onClick={() => exportToExcel("detalhado")}
                  className="w-full px-4 py-3 text-left text-foreground hover:bg-secondary flex items-center gap-2"
                >
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span>Vendas Detalhadas</span>
                </button>
                <button
                  onClick={() => exportToExcel("mensal")}
                  className="w-full px-4 py-3 text-left text-foreground hover:bg-secondary flex items-center gap-2"
                >
                  <svg className="w-4 h-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Resumo Mensal</span>
                </button>
                <button
                  onClick={() => exportToExcel("clientes")}
                  className="w-full px-4 py-3 text-left text-foreground hover:bg-secondary flex items-center gap-2"
                >
                  <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                  <span>Vendas por Cliente</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats Row - NEW */}
      <div className="mb-8">
        <QuickStatsWidget />
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Clientes Ativos"
          value={data.clientesAtivos.toString()}
          subtitle={`${data.totalClientes} total`}
          color="gold"
          icon="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
        />
        <StatCard
          title={`Vendas ${meses[data.currentMonth]}`}
          value={`${formatCurrency(data.vendasMes)} €`}
          subtitle={data.objetivoMensal > 0 ? `Objetivo: ${formatCurrency(data.objetivoMensal)} €` : "Sem objetivo definido"}
          color="green"
          icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
        <StatCard
          title={`Vendas ${data.currentTrimestre}º Trimestre`}
          value={`${formatCurrency(data.vendasTrimestre)} €`}
          subtitle={data.objetivoTrimestral > 0 ? `Objetivo: ${formatCurrency(data.objetivoTrimestral)} €` : "Sem objetivo definido"}
          color="blue"
          icon="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
        />
        <StatCard
          title="A Receber"
          value={`${formatCurrency(data.pendentes)} €`}
          subtitle="Cobrancas pendentes"
          color="orange"
          icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </div>

      {/* NEW: Notifications, Forecast, Health, and Acordos Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <NotificationsWidget />
        <ForecastWidget />
        <HealthScoresWidget />
        <AcordosWidget />
      </div>

      {/* Tasks and Follow-up Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <TarefasWidget />
        <FollowUpWidget />
      </div>

      {/* Late Payments Alert */}
      {data.parcelasAtrasadas > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-red-100 dark:bg-red-800/30 rounded-xl">
              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-red-700 dark:text-red-400 mb-1">Pagamentos em Atraso</h3>
              <p className="text-red-600 dark:text-red-300 mb-3">
                Tens <span className="font-bold">{data.parcelasAtrasadas} parcela{data.parcelasAtrasadas !== 1 ? "s" : ""}</span> em atraso no valor total de <span className="font-bold">{formatCurrency(data.valorAtrasado)} €</span>
              </p>
              <a
                href="/cobrancas"
                className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Ver Cobrancas
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Payments */}
      {data.proximasParcelas.length > 0 && (
        <div className="bg-card rounded-xl shadow-sm p-6 mb-8 border-l-4 border-primary">
          <h3 className="text-lg font-medium tracking-wide text-foreground mb-4 flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            Proximos Vencimentos (7 dias)
          </h3>
          <div className="space-y-3">
            {data.proximasParcelas.map((parcela) => {
              const vencimento = new Date(parcela.dataVencimento)
              const hoje = new Date()
              const diasRestantes = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))

              return (
                <div
                  key={parcela.id}
                  className="flex items-center justify-between bg-secondary/50 rounded-lg p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      diasRestantes <= 2 ? "bg-red-500" : diasRestantes <= 5 ? "bg-amber-500" : "bg-green-500"
                    }`}></div>
                    <div>
                      <p className="font-semibold text-foreground">{parcela.clienteNome}</p>
                      <p className="text-sm text-muted-foreground">
                        {parcela.fatura ? `${parcela.fatura} - ` : ""}Parcela {parcela.numero}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-foreground">{formatCurrency(parcela.valor)} €</p>
                    <p className={`text-sm font-medium ${
                      diasRestantes <= 2 ? "text-red-600" : diasRestantes <= 5 ? "text-amber-600" : "text-muted-foreground"
                    }`}>
                      {vencimento.toLocaleDateString("pt-PT")}
                      <span className="ml-1">
                        ({diasRestantes === 0 ? "Hoje" : diasRestantes === 1 ? "Amanha" : `${diasRestantes} dias`})
                      </span>
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
          <a
            href="/cobrancas"
            className="mt-4 inline-flex items-center gap-2 text-primary hover:text-primary-hover font-medium text-sm tracking-wide"
          >
            Ver todas as cobrancas
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      )}

      {/* Annual Stats */}
      <div className="bg-card rounded-xl shadow-sm p-6 mb-8 border-l-4 border-primary">
        <h3 className="text-lg font-medium tracking-wide text-foreground mb-4 flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          Resumo Anual {data.currentYear}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-secondary rounded-lg p-4 text-center">
            <p className="text-xs font-medium tracking-wide text-muted-foreground mb-1 uppercase">Total Vendas</p>
            <p className="text-xl font-bold text-foreground">{formatCurrency(data.vendasAno)} €</p>
          </div>
          <div className="bg-primary/5 rounded-lg p-4 text-center">
            <p className="text-xs font-medium tracking-wide text-primary mb-1 uppercase">Sem IVA</p>
            <p className="text-xl font-bold text-primary">{formatCurrency(ivaAno.semIVA)} €</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
            <p className="text-xs font-medium tracking-wide text-blue-600 dark:text-blue-400 mb-1 uppercase">IVA (23%)</p>
            <p className="text-xl font-bold text-blue-700 dark:text-blue-300">{formatCurrency(ivaAno.iva)} €</p>
          </div>
          <div className="bg-primary/5 rounded-lg p-4 text-center border border-primary/30">
            <p className="text-xs font-medium tracking-wide text-primary mb-1 uppercase">Objetivo Anual</p>
            <p className="text-xl font-bold text-primary">{data.objetivoAnual > 0 ? `${formatCurrency(data.objetivoAnual)} €` : "N/D"}</p>
          </div>
        </div>
        {data.objetivoAnual > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium text-foreground">Progresso Anual</span>
              <span className="font-bold text-primary">{data.progressoAnual.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${data.progressoAnual >= 100 ? "bg-success" : "bg-primary"}`}
                style={{ width: `${Math.min(data.progressoAnual, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* VAT Summary Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Monthly VAT */}
        <div className="bg-card rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-medium tracking-wide text-foreground mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            IVA Mensal - {meses[data.currentMonth]}
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-secondary rounded-lg p-4 text-center">
              <p className="text-xs font-medium tracking-wide text-muted-foreground mb-1 uppercase">Sem IVA</p>
              <p className="text-xl font-bold text-foreground">{formatCurrency(ivaMes.semIVA)} €</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
              <p className="text-xs font-medium tracking-wide text-blue-600 dark:text-blue-400 mb-1 uppercase">IVA (23%)</p>
              <p className="text-xl font-bold text-blue-700 dark:text-blue-300">{formatCurrency(ivaMes.iva)} €</p>
            </div>
            <div className="bg-success/10 rounded-lg p-4 text-center">
              <p className="text-xs font-medium tracking-wide text-success mb-1 uppercase">Total c/IVA</p>
              <p className="text-xl font-bold text-success">{formatCurrency(data.vendasMes)} €</p>
            </div>
          </div>
        </div>

        {/* Quarterly VAT */}
        <div className="bg-card rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-medium tracking-wide text-foreground mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            IVA Trimestral - {data.currentTrimestre}º Trimestre
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-secondary rounded-lg p-4 text-center">
              <p className="text-xs font-medium tracking-wide text-muted-foreground mb-1 uppercase">Sem IVA</p>
              <p className="text-xl font-bold text-foreground">{formatCurrency(ivaTrimestre.semIVA)} €</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
              <p className="text-xs font-medium tracking-wide text-blue-600 dark:text-blue-400 mb-1 uppercase">IVA (23%)</p>
              <p className="text-xl font-bold text-blue-700 dark:text-blue-300">{formatCurrency(ivaTrimestre.iva)} €</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center border border-blue-200 dark:border-blue-700">
              <p className="text-xs font-medium tracking-wide text-blue-600 dark:text-blue-400 mb-1 uppercase">Total c/IVA</p>
              <p className="text-xl font-bold text-blue-700 dark:text-blue-300">{formatCurrency(data.vendasTrimestre)} €</p>
            </div>
          </div>
        </div>
      </div>

      {/* Prize Progress Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Monthly Prize */}
        <div className="bg-card rounded-xl shadow-sm p-6 border-l-4 border-primary">
          <h3 className="text-lg font-medium tracking-wide text-foreground mb-4 flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            Premio Mensal - {meses[data.currentMonth]}
          </h3>

          {data.premioMensalAtual ? (
            <div className="bg-green-50 rounded-xl p-4 mb-4 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-green-700">Premio Garantido!</p>
                  <p className="text-xs text-green-600">Vendas: {formatCurrency(data.vendasMes)} € (min: {formatCurrency(data.premioMensalAtual.minimo)} €)</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-700">{formatCurrency(data.premioMensalAtual.premio)} €</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-secondary rounded-xl p-4 mb-4 border border-border">
              <p className="text-sm text-muted-foreground">Ainda sem premio este mes</p>
              <p className="text-xs text-muted-foreground">Vendas: {formatCurrency(data.vendasMes)} €</p>
            </div>
          )}

          {data.proximoPremioMensal ? (
            <div className="bg-primary/5 rounded-lg p-4 border border-primary/30">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-medium text-primary">Proximo Premio</p>
                  <p className="text-xs text-primary/70">Objetivo: {formatCurrency(data.proximoPremioMensal.minimo)} €</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-primary">{formatCurrency(data.proximoPremioMensal.premio)} €</p>
                </div>
              </div>
              <div className="w-full bg-primary/20 rounded-full h-3 mb-2">
                <div
                  className="bg-primary h-3 rounded-full transition-all"
                  style={{ width: `${Math.min((data.vendasMes / data.proximoPremioMensal.minimo) * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs font-medium text-primary text-center">
                Faltam {formatCurrency(data.proximoPremioMensal.minimo - data.vendasMes)} €
              </p>
            </div>
          ) : data.premioMensalAtual ? (
            <div className="bg-success/10 rounded-lg p-4 border border-success/30 text-center">
              <p className="text-sm font-bold text-success">Parabens! Premio maximo atingido!</p>
            </div>
          ) : null}
        </div>

        {/* Quarterly Prize */}
        <div className="bg-card rounded-xl shadow-sm p-6 border-l-4 border-accent">
          <h3 className="text-lg font-medium tracking-wide text-foreground mb-4 flex items-center gap-2">
            <div className="p-2 bg-accent/10 rounded-lg">
              <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            Premio Trimestral - {data.currentTrimestre}º Trimestre {data.currentYear}
          </h3>

          {data.premioTrimestralAtual ? (
            <div className="bg-green-50 rounded-xl p-4 mb-4 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-green-700">Premio Garantido!</p>
                  <p className="text-xs text-green-600">Vendas: {formatCurrency(data.vendasTrimestre)} € (min: {formatCurrency(data.premioTrimestralAtual.minimo)} €)</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-700">{formatCurrency(data.premioTrimestralAtual.premio)} €</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-secondary rounded-xl p-4 mb-4 border border-border">
              <p className="text-sm text-muted-foreground">Ainda sem premio este trimestre</p>
              <p className="text-xs text-muted-foreground">Vendas: {formatCurrency(data.vendasTrimestre)} €</p>
            </div>
          )}

          {data.proximoPremioTrimestral ? (
            <div className="bg-accent/5 rounded-lg p-4 border border-accent/30">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-medium text-accent">Proximo Premio</p>
                  <p className="text-xs text-accent/70">Objetivo: {formatCurrency(data.proximoPremioTrimestral.minimo)} €</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-accent">{formatCurrency(data.proximoPremioTrimestral.premio)} €</p>
                </div>
              </div>
              <div className="w-full bg-accent/20 rounded-full h-3 mb-2">
                <div
                  className="bg-accent h-3 rounded-full transition-all"
                  style={{ width: `${Math.min((data.vendasTrimestre / data.proximoPremioTrimestral.minimo) * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs font-medium text-accent text-center">
                Faltam {formatCurrency(data.proximoPremioTrimestral.minimo - data.vendasTrimestre)} €
              </p>
            </div>
          ) : data.premioTrimestralAtual ? (
            <div className="bg-success/10 rounded-lg p-4 border border-success/30 text-center">
              <p className="text-sm font-bold text-success">Parabens! Premio maximo atingido!</p>
            </div>
          ) : null}
        </div>
      </div>

      {/* Progress Cards */}
      {(data.objetivoMensal > 0 || data.objetivoTrimestral > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {data.objetivoMensal > 0 && (
            <ProgressCard
              title="Progresso Mensal"
              current={data.vendasMes}
              target={data.objetivoMensal}
              percentage={data.progressoMensal}
            />
          )}
          {data.objetivoTrimestral > 0 && (
            <ProgressCard
              title="Progresso Trimestral"
              current={data.vendasTrimestre}
              target={data.objetivoTrimestral}
              percentage={data.progressoTrimestral}
            />
          )}
        </div>
      )}

      {/* Sales Charts Section */}
      <div className="mt-8">
        <h2 className="text-2xl font-medium tracking-wide text-foreground mb-6 flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          Graficos e Tendencias
        </h2>
        <SalesCharts ano={ano} />
      </div>
    </div>
  )
}

function StatCard({ title, value, subtitle, color, icon }: {
  title: string
  value: string
  subtitle: string
  color: "gold" | "green" | "blue" | "orange"
  icon: string
}) {
  const colors = {
    gold: { border: "border-primary", iconBg: "bg-primary/10", iconText: "text-primary" },
    green: { border: "border-success", iconBg: "bg-success/10", iconText: "text-success" },
    blue: { border: "border-blue-500", iconBg: "bg-blue-500/10", iconText: "text-blue-600" },
    orange: { border: "border-warning", iconBg: "bg-warning/10", iconText: "text-warning" }
  }

  const c = colors[color]

  return (
    <div className={`bg-card rounded-xl shadow-sm border-l-4 ${c.border} p-6`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 ${c.iconBg} rounded-lg`}>
          <svg className={`w-5 h-5 ${c.iconText}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
          </svg>
        </div>
        <h3 className="text-sm font-medium tracking-wide text-foreground uppercase">{title}</h3>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
    </div>
  )
}

function ProgressCard({ title, current, target, percentage }: {
  title: string
  current: number
  target: number
  percentage: number
}) {
  const remaining = target - current
  const isComplete = percentage >= 100

  return (
    <div className="bg-card rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-medium tracking-wide text-foreground mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        {title}
      </h3>
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="font-medium text-foreground">Realizado: {formatCurrency(current)} €</span>
          <span className="font-bold text-primary">{percentage.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-4">
          <div
            className={`h-4 rounded-full transition-all ${isComplete ? "bg-success" : "bg-primary"}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>
      <div className="flex justify-between text-sm">
        <span className="font-medium text-muted-foreground">Objetivo: {formatCurrency(target)} €</span>
        <span className={`font-bold ${isComplete ? "text-success" : "text-warning"}`}>
          {isComplete ? "Objetivo atingido!" : `Falta: ${formatCurrency(remaining)} €`}
        </span>
      </div>
    </div>
  )
}
