"use client"

import { useState, useEffect } from "react"
import SalesCharts from "./SalesCharts"
import { TarefasWidget, FollowUpWidget } from "@/components/DashboardWidgets"
import { NotificationsWidget, ForecastWidget, HealthScoresWidget, QuickStatsWidget, AcordosWidget } from "@/components/EnhancedDashboardWidgets"
import { formatCurrency } from "@/lib/utils"
import WellbeingSection from "@/components/WellbeingSection"

const meses = [
  "", "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez"
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

interface CobrancasStats {
  pendentesCount: number
  pendentesValor: number
  pagasCount: number
  pagasValor: number
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
  parcelasAtrasadas: number
  valorAtrasado: number
  proximasParcelas: ProximaParcela[]
  cobrancasStats?: CobrancasStats
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
        a.download = `Relatorio_${ano}${tipo !== "completo" ? `_${tipo}` : ""}.xlsx`
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
      <div className="flex items-center justify-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const ivaMes = calcularIVA(data.vendasMes)
  const ivaTrimestre = calcularIVA(data.vendasTrimestre)
  const ivaAno = calcularIVA(data.vendasAno)

  const yearsSet = new Set([currentDate.getFullYear(), ...data.anosDisponiveis])
  const years = Array.from(yearsSet).sort((a, b) => b - a)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <h1 className="text-lg sm:text-xl font-bold text-foreground">Dashboard</h1>
          <span className="text-xs sm:text-sm text-muted-foreground bg-secondary px-2 py-1 rounded-lg">
            {meses[data.currentMonth]} {data.currentYear}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={ano}
            onChange={(e) => setAno(parseInt(e.target.value))}
            className="text-xs sm:text-sm border border-border bg-card rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-primary"
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select
            value={mes}
            onChange={(e) => setMes(parseInt(e.target.value))}
            className="text-xs sm:text-sm border border-border bg-card rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-primary"
          >
            {meses.slice(1).map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
          </select>

          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={exporting}
              className="bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm font-medium rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 disabled:opacity-50"
            >
              {exporting ? (
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
              <span className="hidden sm:inline">Excel</span>
            </button>
            {showExportMenu && (
              <div className="absolute right-0 mt-1 w-44 bg-card rounded-lg shadow-lg border border-border py-1 z-50">
                {[
                  { id: "completo", label: "Completo" },
                  { id: "detalhado", label: "Detalhado" },
                  { id: "mensal", label: "Mensal" },
                  { id: "clientes", label: "Por Cliente" },
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => exportToExcel(item.id)}
                    className="w-full px-3 py-1.5 text-left text-sm text-foreground hover:bg-secondary"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Wellbeing Section - Mental Health First Aid */}
      <WellbeingSection />

      {/* Cobrancas Summary Card */}
      {data.cobrancasStats && (
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Cobrancas
            </h3>
            <a href="/cobrancas" className="text-xs text-primary hover:underline font-medium">
              Ver todas →
            </a>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-orange-50 dark:bg-orange-950/30 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{data.cobrancasStats.pendentesCount}</p>
              <p className="text-xs text-muted-foreground">Pendentes</p>
              <p className="text-sm font-semibold text-orange-600 dark:text-orange-400 mt-1">
                {formatCurrency(data.cobrancasStats.pendentesValor)}€
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-950/30 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{data.cobrancasStats.pagasCount}</p>
              <p className="text-xs text-muted-foreground">Pagas</p>
              <p className="text-sm font-semibold text-green-600 dark:text-green-400 mt-1">
                {formatCurrency(data.cobrancasStats.pagasValor)}€
              </p>
            </div>
            <div className="bg-red-50 dark:bg-red-950/30 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{data.parcelasAtrasadas}</p>
              <p className="text-xs text-muted-foreground">Em Atraso</p>
              <p className="text-sm font-semibold text-red-600 dark:text-red-400 mt-1">
                {formatCurrency(data.valorAtrasado)}€
              </p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{data.proximasParcelas.length}</p>
              <p className="text-xs text-muted-foreground">Proximos 7 dias</p>
              <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mt-1">
                {formatCurrency(data.proximasParcelas.reduce((sum, p) => sum + p.valor, 0))}€
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <QuickStatsWidget />

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <StatCard
          title="Clientes"
          value={data.clientesAtivos.toString()}
          subtitle={`${data.totalClientes} total`}
          color="primary"
        />
        <StatCard
          title={`Vendas ${meses[data.currentMonth]}`}
          value={`${formatCurrency(data.vendasMes)}€`}
          subtitle={data.objetivoMensal > 0 ? `Obj: ${formatCurrency(data.objetivoMensal)}€` : ""}
          color="green"
        />
        <StatCard
          title={`${data.currentTrimestre}º Trim`}
          value={`${formatCurrency(data.vendasTrimestre)}€`}
          subtitle={data.objetivoTrimestral > 0 ? `Obj: ${formatCurrency(data.objetivoTrimestral)}€` : ""}
          color="blue"
        />
        <StatCard
          title="A Receber"
          value={`${formatCurrency(data.pendentes)}€`}
          subtitle="Pendente"
          color="orange"
        />
      </div>

      {/* Widgets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <NotificationsWidget />
        <ForecastWidget />
        <HealthScoresWidget />
        <AcordosWidget />
      </div>

      {/* Tasks and Follow-up */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3">
        <TarefasWidget />
        <FollowUpWidget />
      </div>

      {/* Late Payments Alert */}
      {data.parcelasAtrasadas > 0 && (
        <div className="bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-700 rounded-lg p-3 flex items-center gap-3">
          <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg shrink-0">
            <svg className="w-5 h-5 text-red-600 dark:text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-red-800 dark:text-red-100">
              {data.parcelasAtrasadas} parcela{data.parcelasAtrasadas !== 1 ? "s" : ""} em atraso: <span className="font-bold">{formatCurrency(data.valorAtrasado)}€</span>
            </p>
          </div>
          <a href="/cobrancas?filter=overdue" className="shrink-0 text-xs font-medium text-red-700 dark:text-red-200 hover:underline">
            Ver
          </a>
        </div>
      )}

      {/* Upcoming Payments */}
      {data.proximasParcelas.length > 0 && (
        <div className="bg-card rounded-lg border border-border p-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-foreground">Proximos Vencimentos</h3>
            <a href="/cobrancas" className="text-xs text-primary hover:underline">Ver todos</a>
          </div>
          <div className="space-y-1.5">
            {data.proximasParcelas.slice(0, 3).map((parcela) => {
              const vencimento = new Date(parcela.dataVencimento)
              const hoje = new Date()
              const diasRestantes = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))

              return (
                <div key={parcela.id} className="flex items-center justify-between bg-secondary/50 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      diasRestantes <= 2 ? "bg-red-500" : diasRestantes <= 5 ? "bg-amber-500" : "bg-green-500"
                    }`}></div>
                    <span className="text-sm text-foreground truncate">{parcela.clienteNome}</span>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <span className="text-sm font-semibold text-foreground">{formatCurrency(parcela.valor)}€</span>
                    <span className={`text-xs ml-1.5 ${diasRestantes <= 2 ? "text-red-500" : "text-muted-foreground"}`}>
                      {diasRestantes === 0 ? "Hoje" : diasRestantes === 1 ? "Amanha" : `${diasRestantes}d`}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Annual Summary */}
      <div className="bg-card rounded-lg border border-border p-3">
        <h3 className="text-sm font-semibold text-foreground mb-2">Resumo {data.currentYear}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <MiniStat label="Total" value={`${formatCurrency(data.vendasAno)}€`} />
          <MiniStat label="Sem IVA" value={`${formatCurrency(ivaAno.semIVA)}€`} />
          <MiniStat label="IVA" value={`${formatCurrency(ivaAno.iva)}€`} />
          <MiniStat label="Objetivo" value={data.objetivoAnual > 0 ? `${formatCurrency(data.objetivoAnual)}€` : "N/D"} />
        </div>
        {data.objetivoAnual > 0 && (
          <div className="mt-2">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-medium text-primary">{data.progressoAnual.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full ${data.progressoAnual >= 100 ? "bg-green-500" : "bg-primary"}`}
                style={{ width: `${Math.min(data.progressoAnual, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* IVA Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
        <div className="bg-card rounded-lg border border-border p-3">
          <h3 className="text-sm font-semibold text-foreground mb-2">IVA {meses[data.currentMonth]}</h3>
          <div className="grid grid-cols-3 gap-2">
            <MiniStat label="Sem IVA" value={`${formatCurrency(ivaMes.semIVA)}€`} small />
            <MiniStat label="IVA" value={`${formatCurrency(ivaMes.iva)}€`} small />
            <MiniStat label="Total" value={`${formatCurrency(data.vendasMes)}€`} small />
          </div>
        </div>
        <div className="bg-card rounded-lg border border-border p-3">
          <h3 className="text-sm font-semibold text-foreground mb-2">IVA {data.currentTrimestre}º Trim</h3>
          <div className="grid grid-cols-3 gap-2">
            <MiniStat label="Sem IVA" value={`${formatCurrency(ivaTrimestre.semIVA)}€`} small />
            <MiniStat label="IVA" value={`${formatCurrency(ivaTrimestre.iva)}€`} small />
            <MiniStat label="Total" value={`${formatCurrency(data.vendasTrimestre)}€`} small />
          </div>
        </div>
      </div>

      {/* Prizes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
        <PrizeCard
          title={`Premio ${meses[data.currentMonth]}`}
          current={data.vendasMes}
          premio={data.premioMensalAtual}
          proximo={data.proximoPremioMensal}
        />
        <PrizeCard
          title={`Premio ${data.currentTrimestre}º Trim`}
          current={data.vendasTrimestre}
          premio={data.premioTrimestralAtual}
          proximo={data.proximoPremioTrimestral}
        />
      </div>

      {/* Progress */}
      {(data.objetivoMensal > 0 || data.objetivoTrimestral > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
          {data.objetivoMensal > 0 && (
            <ProgressCard
              title="Mensal"
              current={data.vendasMes}
              target={data.objetivoMensal}
              percentage={data.progressoMensal}
            />
          )}
          {data.objetivoTrimestral > 0 && (
            <ProgressCard
              title="Trimestral"
              current={data.vendasTrimestre}
              target={data.objetivoTrimestral}
              percentage={data.progressoTrimestral}
            />
          )}
        </div>
      )}

      {/* Charts */}
      <div className="bg-card rounded-lg border border-border p-3">
        <h3 className="text-sm font-semibold text-foreground mb-3">Graficos</h3>
        <SalesCharts ano={ano} />
      </div>
    </div>
  )
}

function StatCard({ title, value, subtitle, color }: {
  title: string
  value: string
  subtitle: string
  color: "primary" | "green" | "blue" | "orange"
}) {
  const colors = {
    primary: "border-l-primary text-primary",
    green: "border-l-green-500 text-green-600 dark:text-green-400",
    blue: "border-l-blue-500 text-blue-600 dark:text-blue-400",
    orange: "border-l-orange-500 text-orange-600 dark:text-orange-400"
  }

  return (
    <div className={`bg-card rounded-lg border border-border border-l-2 ${colors[color].split(" ")[0]} p-3`}>
      <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">{title}</p>
      <p className={`text-base sm:text-lg font-bold ${colors[color].split(" ").slice(1).join(" ")}`}>{value}</p>
      {subtitle && <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{subtitle}</p>}
    </div>
  )
}

function MiniStat({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div className="bg-secondary/50 rounded-lg p-2 text-center">
      <p className={`${small ? "text-[9px]" : "text-[10px]"} font-medium text-muted-foreground uppercase`}>{label}</p>
      <p className={`${small ? "text-xs" : "text-sm"} font-bold text-foreground`}>{value}</p>
    </div>
  )
}

function PrizeCard({ title, current, premio, proximo }: {
  title: string
  current: number
  premio: { minimo: number; premio: number } | null
  proximo: { minimo: number; premio: number } | null
}) {
  return (
    <div className="bg-card rounded-lg border border-border p-3">
      <h3 className="text-sm font-semibold text-foreground mb-2">{title}</h3>

      {premio ? (
        <div className="bg-green-50 dark:bg-green-950/60 rounded-lg p-2 mb-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-green-700 dark:text-green-200">Garantido</span>
            <span className="text-sm font-bold text-green-700 dark:text-green-100">{formatCurrency(premio.premio)}€</span>
          </div>
        </div>
      ) : (
        <div className="bg-secondary/50 rounded-lg p-2 mb-2">
          <span className="text-xs text-muted-foreground">Sem premio</span>
        </div>
      )}

      {proximo && (
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">Proximo: {formatCurrency(proximo.premio)}€</span>
            <span className="text-primary font-medium">Falta {formatCurrency(proximo.minimo - current)}€</span>
          </div>
          <div className="w-full bg-muted rounded-full h-1.5">
            <div
              className="bg-primary h-1.5 rounded-full"
              style={{ width: `${Math.min((current / proximo.minimo) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}
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
    <div className="bg-card rounded-lg border border-border p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <span className={`text-sm font-bold ${isComplete ? "text-green-500" : "text-primary"}`}>
          {percentage.toFixed(0)}%
        </span>
      </div>
      <div className="w-full bg-muted rounded-full h-2 mb-2">
        <div
          className={`h-2 rounded-full ${isComplete ? "bg-green-500" : "bg-primary"}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{formatCurrency(current)}€ / {formatCurrency(target)}€</span>
        <span className={isComplete ? "text-green-500" : "text-orange-500"}>
          {isComplete ? "Atingido!" : `Falta ${formatCurrency(remaining)}€`}
        </span>
      </div>
    </div>
  )
}
