"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { formatCurrency } from "@/lib/utils"
import HelpTooltip from "./HelpTooltip"

interface Notification {
  id: string
  tipo: string
  titulo: string
  mensagem: string
  lida: boolean
  createdAt: string
}

interface HealthScore {
  clienteId: string
  scoreGeral: number
  scorePagamento: number
  scoreEngajamento: number
  scoreCompras: number
  risco: string
  tendencia: string
}

interface ForecastData {
  current: {
    previsaoTotal: number
    confianca: number
    vendidoAteMomento: number
    faltaParaPrevisao: number
  }
  pipeline: {
    total: number
    valor: number
  }
}

// Notifications Widget
export function NotificationsWidget() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    fetchNotifications()
    // Generate notifications on load
    fetch("/api/notifications/generate", { method: "POST" })
  }, [])

  async function fetchNotifications() {
    try {
      const res = await fetch("/api/notifications?limit=10")
      const data = await res.json()
      setNotifications(data.notifications || [])
      setUnreadCount(data.unreadCount || 0)
    } catch (error) {
      console.error("Error:", error)
    }
    setLoading(false)
  }

  async function markAsRead(id: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    })
    fetchNotifications()
  }

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true })
    })
    fetchNotifications()
  }

  const getTypeIcon = (tipo: string) => {
    switch (tipo) {
      case "PAGAMENTO_ATRASADO":
        return "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      case "TAREFA_HOJE":
      case "TAREFA_VENCIDA":
        return "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
      case "LEAD_PARADO":
        return "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
      case "CLIENTE_SEM_CONTACTO":
        return "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      default:
        return "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
    }
  }

  const getTypeColor = (tipo: string) => {
    switch (tipo) {
      case "PAGAMENTO_ATRASADO":
        return "text-red-500 bg-red-500/10"
      case "TAREFA_VENCIDA":
        return "text-orange-500 bg-orange-500/10"
      case "TAREFA_HOJE":
        return "text-blue-500 bg-blue-500/10"
      case "LEAD_PARADO":
        return "text-amber-500 bg-amber-500/10"
      case "CLIENTE_SEM_CONTACTO":
        return "text-purple-500 bg-purple-500/10"
      default:
        return "text-gray-500 bg-gray-500/10"
    }
  }

  if (loading) {
    return (
      <div className="bg-card rounded-xl shadow-sm p-6 border-l-4 border-red-500">
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-muted rounded w-1/3"></div>
          <div className="h-4 bg-muted rounded w-full"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-xl shadow-sm p-6 border-l-4 border-red-500">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-foreground flex items-center gap-2">
          <span className="p-2 bg-red-500/10 rounded-lg relative">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </span>
          Notificacoes
          <HelpTooltip text="Alertas automaticos sobre pagamentos em atraso, tarefas pendentes, leads parados e clientes sem contacto recente." />
        </h3>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-sm text-primary hover:underline"
          >
            Marcar todas lidas
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <p className="text-muted-foreground text-sm">Sem notificacoes - tudo em ordem!</p>
      ) : (
        <div className="space-y-2">
          {notifications.slice(0, expanded ? 10 : 3).map(notif => (
            <div
              key={notif.id}
              className={`p-3 rounded-lg ${notif.lida ? "bg-secondary/30" : "bg-secondary/70 cursor-pointer"} flex items-start gap-3`}
              onClick={() => !notif.lida && markAsRead(notif.id)}
            >
              <div className={`p-2 rounded-lg ${getTypeColor(notif.tipo)}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getTypeIcon(notif.tipo)} />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${notif.lida ? "text-muted-foreground" : "font-medium text-foreground"}`}>
                  {notif.titulo}
                </p>
                <p className="text-xs text-muted-foreground truncate">{notif.mensagem}</p>
              </div>
              {!notif.lida && (
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
              )}
            </div>
          ))}
          {notifications.length > 3 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full text-sm text-primary hover:underline text-center py-2"
            >
              {expanded ? "Ver menos" : `Ver mais ${notifications.length - 3} notificacoes`}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// Sales Forecast Widget
export function ForecastWidget() {
  const [data, setData] = useState<ForecastData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchForecast() {
      try {
        const res = await fetch("/api/forecast")
        const json = await res.json()
        setData(json)
      } catch (error) {
        console.error("Error:", error)
      }
      setLoading(false)
    }
    fetchForecast()
  }, [])

  if (loading) {
    return (
      <div className="bg-card rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-muted rounded w-1/3"></div>
          <div className="h-8 bg-muted rounded w-2/3"></div>
        </div>
      </div>
    )
  }

  if (!data) return null

  const progressPercent = data.current.previsaoTotal > 0
    ? (data.current.vendidoAteMomento / data.current.previsaoTotal) * 100
    : 0

  return (
    <div className="bg-card rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
      <h3 className="text-lg font-medium text-foreground flex items-center gap-2 mb-4">
        <span className="p-2 bg-blue-500/10 rounded-lg">
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </span>
        Previsao de Vendas
        <HelpTooltip text="Previsao calculada com base no historico de vendas do mesmo mes em anos anteriores, tendencias de crescimento e pipeline de prospectos em negociacao." />
      </h3>

      <div className="space-y-4">
        <div>
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-2xl font-bold text-foreground">
              {formatCurrency(data.current.previsaoTotal)} €
            </span>
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              Confianca: {data.current.confianca}%
              <HelpTooltip text="Nivel de confianca baseado na quantidade de dados historicos disponiveis e pipeline ativo." position="left" />
            </span>
          </div>
          <p className="text-xs text-muted-foreground">Previsao para este mes</p>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Vendido: {formatCurrency(data.current.vendidoAteMomento)} €</span>
            <span className="font-medium text-foreground">{progressPercent.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Faltam {formatCurrency(data.current.faltaParaPrevisao)} € para atingir a previsao
          </p>
        </div>

        <div className="pt-3 border-t border-border">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              Pipeline ativo
              <HelpTooltip text="Prospectos em fase de Proposta ou Negociacao que podem converter em vendas." position="right" />
            </span>
            <span className="font-medium text-foreground">
              {data.pipeline.total} ({formatCurrency(data.pipeline.valor)} €)
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Health Scores Summary Widget
export function HealthScoresWidget() {
  const [data, setData] = useState<{
    total: number
    atRisk: number
    declining: number
    scores: HealthScore[]
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchHealth() {
      try {
        // First recalculate scores
        await fetch("/api/health", { method: "POST" })
        // Then fetch
        const res = await fetch("/api/health")
        const json = await res.json()
        setData(json)
      } catch (error) {
        console.error("Error:", error)
      }
      setLoading(false)
    }
    fetchHealth()
  }, [])

  if (loading) {
    return (
      <div className="bg-card rounded-xl shadow-sm p-6 border-l-4 border-green-500">
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-muted rounded w-1/3"></div>
          <div className="h-4 bg-muted rounded w-full"></div>
        </div>
      </div>
    )
  }

  if (!data) return null

  const atRiskClients = data.scores.filter(s => s.risco === "ALTO").slice(0, 3)

  return (
    <div className="bg-card rounded-xl shadow-sm p-6 border-l-4 border-green-500">
      <h3 className="text-lg font-medium text-foreground flex items-center gap-2 mb-4">
        <span className="p-2 bg-green-500/10 rounded-lg">
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </span>
        Saude dos Clientes
        <HelpTooltip text="Score de 0-100 calculado com base no historico de pagamentos (40%), frequencia de comunicacao (30%) e recencia de compras (30%)." />
      </h3>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-foreground">{data.total}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-red-500">{data.atRisk}</p>
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
            Em Risco
            <HelpTooltip text="Clientes com score abaixo de 40 - precisam de atencao urgente." position="bottom" />
          </p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-orange-500">{data.declining}</p>
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
            A Descer
            <HelpTooltip text="Clientes cujo score desceu 5+ pontos recentemente." position="bottom" />
          </p>
        </div>
      </div>

      {atRiskClients.length > 0 && (
        <div className="pt-3 border-t border-border">
          <p className="text-xs font-medium text-red-500 mb-2">Clientes em risco - contactar urgente:</p>
          <div className="space-y-1">
            {atRiskClients.map(client => (
              <Link
                key={client.clienteId}
                href={`/clientes/${client.clienteId}`}
                className="flex items-center justify-between p-2 bg-secondary rounded text-sm hover:bg-muted transition"
              >
                <span className="text-foreground">Score: {client.scoreGeral}</span>
                <span className={`text-xs ${
                  client.tendencia === "DESCENDO" ? "text-red-500" :
                  client.tendencia === "SUBINDO" ? "text-green-500" : "text-muted-foreground"
                }`}>
                  {client.tendencia === "DESCENDO" ? "↓ A descer" : client.tendencia === "SUBINDO" ? "↑ A subir" : "→ Estavel"}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Quick Stats Row Widget
export function QuickStatsWidget() {
  const [stats, setStats] = useState({
    overduePayments: { count: 0, value: 0 },
    tasksDueToday: 0,
    staleLeads: 0,
    clientsNoContact: 0
  })
  const [loading, setLoading] = useState(true)
  const searchParams = useSearchParams()
  const seller = searchParams.get("seller")

  useEffect(() => {
    async function fetchStats() {
      try {
        const sellerParam = seller ? `?seller=${seller}` : ""
        const res = await fetch(`/api/dashboard/quick-stats${sellerParam}`)
        const data = await res.json()
        setStats(data)
      } catch (error) {
        console.error("Error:", error)
      }
      setLoading(false)
    }
    fetchStats()
  }, [seller])

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-card rounded-xl p-4 animate-pulse">
            <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Link
        href="/cobrancas"
        className={`bg-card rounded-xl p-4 border-l-4 ${
          stats.overduePayments.count > 0 ? "border-red-500" : "border-green-500"
        } hover:shadow-md transition`}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className={`text-2xl font-bold ${
              stats.overduePayments.count > 0 ? "text-red-500" : "text-green-500"
            }`}>
              {stats.overduePayments.count}
            </p>
            <p className="text-sm text-muted-foreground">Pagamentos Atrasados</p>
            {stats.overduePayments.count > 0 && (
              <p className="text-xs text-red-500 mt-1">{formatCurrency(stats.overduePayments.value)} €</p>
            )}
          </div>
          <HelpTooltip text="Parcelas com data de vencimento ultrapassada e ainda nao pagas." position="left" />
        </div>
      </Link>

      <Link
        href="/tarefas"
        className={`bg-card rounded-xl p-4 border-l-4 ${
          stats.tasksDueToday > 0 ? "border-blue-500" : "border-gray-300"
        } hover:shadow-md transition`}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className={`text-2xl font-bold ${
              stats.tasksDueToday > 0 ? "text-blue-500" : "text-muted-foreground"
            }`}>
              {stats.tasksDueToday}
            </p>
            <p className="text-sm text-muted-foreground">Tarefas Hoje</p>
          </div>
          <HelpTooltip text="Tarefas com data de vencimento para hoje que ainda nao foram concluidas." position="left" />
        </div>
      </Link>

      <Link
        href="/prospectos"
        className={`bg-card rounded-xl p-4 border-l-4 ${
          stats.staleLeads > 0 ? "border-amber-500" : "border-gray-300"
        } hover:shadow-md transition`}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className={`text-2xl font-bold ${
              stats.staleLeads > 0 ? "text-amber-500" : "text-muted-foreground"
            }`}>
              {stats.staleLeads}
            </p>
            <p className="text-sm text-muted-foreground">Leads Parados</p>
          </div>
          <HelpTooltip text="Prospectos que nao tiveram contacto nos ultimos 7 dias e ainda nao foram ganhos ou perdidos." position="left" />
        </div>
      </Link>

      <Link
        href="/clientes"
        className={`bg-card rounded-xl p-4 border-l-4 ${
          stats.clientsNoContact > 0 ? "border-purple-500" : "border-gray-300"
        } hover:shadow-md transition`}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className={`text-2xl font-bold ${
              stats.clientsNoContact > 0 ? "text-purple-500" : "text-muted-foreground"
            }`}>
              {stats.clientsNoContact}
            </p>
            <p className="text-sm text-muted-foreground">Clientes sem Contacto</p>
          </div>
          <HelpTooltip text="Clientes ativos que nao foram contactados nos ultimos 30 dias." position="left" />
        </div>
      </Link>
    </div>
  )
}

// Partnership Agreements Widget
export function AcordosWidget() {
  const [data, setData] = useState<{
    total: number
    atras: number
    noCaminho: number
    adiantado: number
    clientesAtRisk: Array<{
      clienteId: string
      clienteNome: string
      progressPercent: number
      deficit: number
    }>
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAcordos() {
      try {
        const res = await fetch("/api/acordos")
        const acordos = await res.json()

        if (Array.isArray(acordos)) {
          const summary = {
            total: acordos.length,
            atras: acordos.filter((a: any) => a.estado === "ATRAS").length,
            noCaminho: acordos.filter((a: any) => a.estado === "NO_CAMINHO").length,
            adiantado: acordos.filter((a: any) => a.estado === "ADIANTADO").length,
            clientesAtRisk: acordos
              .filter((a: any) => a.estado === "ATRAS")
              .slice(0, 3)
              .map((a: any) => ({
                clienteId: a.clienteId,
                clienteNome: a.cliente?.nome || "Cliente",
                progressPercent: a.progressPercent,
                deficit: a.yearToDateTarget - a.yearToDateActual
              }))
          }

          setData(summary)
        }
      } catch (error) {
        console.error("Error:", error)
      }
      setLoading(false)
    }
    fetchAcordos()
  }, [])

  if (loading) {
    return (
      <div className="bg-card rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-muted rounded w-1/3"></div>
          <div className="h-4 bg-muted rounded w-full"></div>
        </div>
      </div>
    )
  }

  if (!data || data.total === 0) {
    return (
      <div className="bg-card rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
        <h3 className="text-lg font-medium text-foreground flex items-center gap-2 mb-4">
          <span className="p-2 bg-purple-500/10 rounded-lg">
            <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </span>
          Acordos de Parceria
          <HelpTooltip text="Clientes com compromissos anuais de compras. Mostra progresso trimestral e alerta quando estao atrasados." />
        </h3>
        <p className="text-muted-foreground text-sm">Sem acordos ativos</p>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
      <h3 className="text-lg font-medium text-foreground flex items-center gap-2 mb-4">
        <span className="p-2 bg-purple-500/10 rounded-lg">
          <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </span>
        Acordos de Parceria
        <HelpTooltip text="Clientes com compromissos anuais de compras. Mostra progresso trimestral e alerta quando estao atrasados." />
      </h3>

      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="text-center">
          <p className="text-xl font-bold text-foreground">{data.total}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-green-500">{data.noCaminho}</p>
          <p className="text-xs text-muted-foreground">No Caminho</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-red-500">{data.atras}</p>
          <p className="text-xs text-muted-foreground">Atrasados</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-blue-500">{data.adiantado}</p>
          <p className="text-xs text-muted-foreground">Adiantados</p>
        </div>
      </div>

      {data.clientesAtRisk.length > 0 && (
        <div className="pt-3 border-t border-border">
          <p className="text-xs font-medium text-red-500 mb-2">Clientes atrasados - requer atencao:</p>
          <div className="space-y-1">
            {data.clientesAtRisk.map(client => (
              <Link
                key={client.clienteId}
                href={`/clientes/${client.clienteId}`}
                className="flex items-center justify-between p-2 bg-secondary rounded text-sm hover:bg-muted transition"
              >
                <span className="text-foreground truncate">{client.clienteNome}</span>
                <span className="text-red-500 font-medium whitespace-nowrap ml-2">
                  -{formatCurrency(client.deficit)} EUR
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Bulk Actions Panel
export function BulkActionsPanel({
  selectedIds,
  entityType,
  onClear,
  onSuccess
}: {
  selectedIds: string[]
  entityType: "cliente" | "prospecto"
  onClear: () => void
  onSuccess: () => void
}) {
  const [action, setAction] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)

  // Task form state
  const [taskTitle, setTaskTitle] = useState("")
  const [taskType, setTaskType] = useState("Telefonema")
  const [taskPriority, setTaskPriority] = useState("MEDIA")
  const [taskDate, setTaskDate] = useState("")

  // Communication form state
  const [commType, setCommType] = useState("TELEFONEMA")
  const [commSubject, setCommSubject] = useState("")
  const [commNotes, setCommNotes] = useState("")

  if (selectedIds.length === 0) return null

  async function handleAction() {
    if (!action) return
    setLoading(true)

    try {
      let body: any = { action, ids: selectedIds, data: { entityType } }

      if (action === "create-tasks") {
        body.data = {
          ...body.data,
          titulo: taskTitle,
          tipo: taskType,
          prioridade: taskPriority,
          dataVencimento: taskDate || null
        }
      } else if (action === "log-communication") {
        body.data = {
          ...body.data,
          tipo: commType,
          assunto: commSubject,
          notas: commNotes
        }
      }

      const res = await fetch("/api/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      })

      const data = await res.json()
      if (data.success) {
        onSuccess()
        onClear()
        setShowForm(false)
        setAction("")
      }
    } catch (error) {
      console.error("Error:", error)
    }
    setLoading(false)
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-card rounded-xl shadow-lg border border-border p-4 z-50 min-w-[400px] max-w-[90vw]">
      <div className="flex items-center justify-between mb-3">
        <span className="font-medium text-foreground flex items-center gap-2">
          {selectedIds.length} {entityType === "cliente" ? "clientes" : "prospectos"} selecionados
          <HelpTooltip text="Pode executar acoes em massa para todos os itens selecionados de uma vez." />
        </span>
        <button
          onClick={onClear}
          className="text-muted-foreground hover:text-foreground"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {!showForm ? (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => { setAction("create-tasks"); setShowForm(true) }}
            className="px-3 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-hover transition flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Criar Tarefas
          </button>
          <button
            onClick={() => { setAction("log-communication"); setShowForm(true) }}
            className="px-3 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Registar Comunicacao
          </button>
          {entityType === "prospecto" && (
            <button
              onClick={() => setAction("update-status")}
              className="px-3 py-2 bg-purple-500 text-white rounded-lg text-sm hover:bg-purple-600 transition"
            >
              Alterar Estado
            </button>
          )}
          <button
            onClick={() => { setAction("mark-inactive"); handleAction() }}
            disabled={loading}
            className="px-3 py-2 bg-gray-500 text-white rounded-lg text-sm hover:bg-gray-600 transition disabled:opacity-50"
          >
            Marcar Inativos
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {action === "create-tasks" && (
            <>
              <input
                type="text"
                placeholder="Titulo da tarefa"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              />
              <div className="grid grid-cols-3 gap-2">
                <select
                  value={taskType}
                  onChange={(e) => setTaskType(e.target.value)}
                  className="px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                >
                  <option value="Telefonema">Telefonema</option>
                  <option value="Visita">Visita</option>
                  <option value="Email">Email</option>
                  <option value="Reunião">Reunião</option>
                </select>
                <select
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value)}
                  className="px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                >
                  <option value="BAIXA">Baixa</option>
                  <option value="MEDIA">Media</option>
                  <option value="ALTA">Alta</option>
                  <option value="URGENTE">Urgente</option>
                </select>
                <input
                  type="date"
                  value={taskDate}
                  onChange={(e) => setTaskDate(e.target.value)}
                  className="px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                />
              </div>
            </>
          )}

          {action === "log-communication" && (
            <>
              <select
                value={commType}
                onChange={(e) => setCommType(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              >
                <option value="TELEFONEMA">Telefonema</option>
                <option value="EMAIL">Email</option>
                <option value="VISITA">Visita</option>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="REUNIAO">Reunião</option>
              </select>
              <input
                type="text"
                placeholder="Assunto"
                value={commSubject}
                onChange={(e) => setCommSubject(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              />
              <textarea
                placeholder="Notas"
                value={commNotes}
                onChange={(e) => setCommNotes(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              />
            </>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => { setShowForm(false); setAction("") }}
              className="flex-1 px-3 py-2 border border-border rounded-lg text-foreground hover:bg-secondary transition"
            >
              Cancelar
            </button>
            <button
              onClick={handleAction}
              disabled={loading || (action === "create-tasks" && !taskTitle)}
              className="flex-1 px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition disabled:opacity-50"
            >
              {loading ? "A processar..." : "Confirmar"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
