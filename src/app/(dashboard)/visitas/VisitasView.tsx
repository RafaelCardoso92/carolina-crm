"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"

interface Visita {
  id: string
  dataAgendada: string
  dataRealizada: string | null
  duracao: number | null
  estado: "AGENDADA" | "REALIZADA" | "CANCELADA" | "REAGENDADA"
  objetivo: string | null
  notas: string | null
  resultado: string | null
  proximosPassos: string | null
  cliente: { id: string; nome: string; codigo: string; cidade: string } | null
  prospecto: { id: string; nomeEmpresa: string; estado: string; cidade: string } | null
  user: { id: string; name: string; email: string } | null
}

interface Stats {
  resumo: {
    total: number
    agendadas: number
    realizadas: number
    canceladas: number
    reagendadas: number
    hoje: number
    semana: number
    taxaRealizacao: number
  }
  mensal: Array<{
    mes: number
    ano: number
    total: number
    realizadas: number
    taxaRealizacao: number
  }>
  vendedores: Array<{
    id: string
    name: string
    email: string
    total: number
    realizadas: number
    taxaRealizacao: number
  }>
}

interface ClienteOption {
  id: string
  nome: string
  codigo: string
}

interface ProspectoOption {
  id: string
  nomeEmpresa: string
}

const estadoColors = {
  AGENDADA: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  REALIZADA: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100",
  CANCELADA: "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
  REAGENDADA: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100"
}

const estadoLabels = {
  AGENDADA: "Agendada",
  REALIZADA: "Realizada",
  CANCELADA: "Cancelada",
  REAGENDADA: "Reagendada"
}

const mesesNomes = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

export default function VisitasView() {
  const searchParams = useSearchParams()
  const seller = searchParams.get("seller")
  const [visitas, setVisitas] = useState<Visita[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"todas" | "hoje" | "semana" | "agendadas" | "realizadas">("hoje")
  const [showForm, setShowForm] = useState(false)
  const [clientes, setClientes] = useState<ClienteOption[]>([])
  const [prospectos, setProspectos] = useState<ProspectoOption[]>([])
  const [formData, setFormData] = useState({
    dataAgendada: "",
    horaAgendada: "09:00",
    objetivo: "",
    notas: "",
    clienteId: "",
    prospectoId: ""
  })
  const [editingVisita, setEditingVisita] = useState<Visita | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)

  useEffect(() => {
    fetchVisitas()
    fetchStats()
  }, [filter, seller])

  useEffect(() => {
    fetchClientes()
    fetchProspectos()
  }, [])

  async function fetchVisitas() {
    setLoading(true)
    try {
      let url = "/api/visitas?limit=100"
      if (filter === "hoje") url += "&hoje=true"
      if (filter === "semana") url += "&semana=true"
      if (filter === "agendadas") url += "&agendadas=true"
      if (filter === "realizadas") url += "&realizadas=true"
      if (seller) url += `&seller=${seller}`

      const res = await fetch(url)
      const data = await res.json()
      setVisitas(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Error:", error)
      setVisitas([])
    }
    setLoading(false)
  }

  async function fetchStats() {
    try {
      const ano = new Date().getFullYear()
      let url = `/api/visitas/stats?ano=${ano}`
      if (seller) url += `&seller=${seller}`

      const res = await fetch(url)
      if (!res.ok) {
        console.error("Stats API error:", res.status)
        setStats(null)
        return
      }
      const data = await res.json()
      if (data && data.resumo) {
        setStats(data)
      } else {
        setStats(null)
      }
    } catch (error) {
      console.error("Error:", error)
      setStats(null)
    }
  }

  async function fetchClientes() {
    try {
      const res = await fetch("/api/clientes?all=true")
      const data = await res.json()
      console.log("[Visitas] Clientes response:", data)
      setClientes(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Error:", error)
      setClientes([])
    }
  }

  async function fetchProspectos() {
    try {
      const res = await fetch("/api/prospectos?ativo=true")
      const data = await res.json()
      setProspectos(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Error:", error)
      setProspectos([])
    }
  }

  async function createVisita(e: React.FormEvent) {
    e.preventDefault()
    try {
      const dataAgendada = new Date(`${formData.dataAgendada}T${formData.horaAgendada}:00`)

      const res = await fetch("/api/visitas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataAgendada: dataAgendada.toISOString(),
          objetivo: formData.objetivo,
          notas: formData.notas,
          clienteId: formData.clienteId || null,
          prospectoId: formData.prospectoId || null
        })
      })
      if (res.ok) {
        setShowForm(false)
        setFormData({ dataAgendada: "", horaAgendada: "09:00", objetivo: "", notas: "", clienteId: "", prospectoId: "" })
        fetchVisitas()
        fetchStats()
      }
    } catch (error) {
      console.error("Error:", error)
    }
  }

  async function updateEstado(id: string, estado: string, resultado?: string) {
    try {
      await fetch(`/api/visitas/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado, resultado })
      })
      fetchVisitas()
      fetchStats()
    } catch (error) {
      console.error("Error:", error)
    }
  }

  async function handleMarkCompleted(visita: Visita) {
    setEditingVisita(visita)
    setShowEditModal(true)
  }

  async function submitCompletion(e: React.FormEvent) {
    e.preventDefault()
    if (!editingVisita) return

    const form = e.target as HTMLFormElement
    const formData = new FormData(form)
    const resultado = formData.get("resultado") as string
    const proximosPassos = formData.get("proximosPassos") as string

    try {
      await fetch(`/api/visitas/${editingVisita.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estado: "REALIZADA",
          resultado,
          proximosPassos
        })
      })
      setShowEditModal(false)
      setEditingVisita(null)
      fetchVisitas()
      fetchStats()
    } catch (error) {
      console.error("Error:", error)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit", year: "numeric" })
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })
  }

  const isToday = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isPast = (dateStr: string) => {
    return new Date(dateStr) < new Date() && !isToday(dateStr)
  }

  return (
    <div>
      {/* Stats Summary */}
      {stats?.resumo && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-card rounded-xl p-4 border border-border">
            <p className="text-xs text-muted-foreground mb-1">Hoje</p>
            <p className="text-2xl font-bold text-foreground">{stats.resumo.hoje}</p>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border">
            <p className="text-xs text-muted-foreground mb-1">Esta Semana</p>
            <p className="text-2xl font-bold text-foreground">{stats.resumo.semana}</p>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border">
            <p className="text-xs text-muted-foreground mb-1">Realizadas</p>
            <p className="text-2xl font-bold text-emerald-600">{stats.resumo.realizadas}</p>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border">
            <p className="text-xs text-muted-foreground mb-1">Taxa Realizacao</p>
            <p className="text-2xl font-bold text-primary">{stats.resumo.taxaRealizacao}%</p>
          </div>
        </div>
      )}

      {/* Monthly Chart */}
      {stats?.mensal && (
        <div className="bg-card rounded-xl p-4 border border-border mb-6">
          <h3 className="text-sm font-semibold text-foreground mb-3">Visitas por Mes ({new Date().getFullYear()})</h3>
          <div className="flex items-end gap-1 h-24">
            {stats.mensal.map((m, i) => {
              const maxTotal = Math.max(...stats.mensal.map(x => x.total), 1)
              const height = (m.total / maxTotal) * 100
              const realizedHeight = m.total > 0 ? (m.realizadas / m.total) * height : 0
              return (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div className="w-full flex flex-col justify-end h-20 relative">
                    <div
                      className="w-full bg-blue-200 dark:bg-blue-900 rounded-t"
                      style={{ height: `${height}%` }}
                    >
                      <div
                        className="w-full bg-emerald-500 rounded-t absolute bottom-0"
                        style={{ height: `${realizedHeight}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-1">{mesesNomes[i]}</span>
                  <span className="text-[10px] font-medium text-foreground">{m.total}</span>
                </div>
              )
            })}
          </div>
          <div className="flex gap-4 mt-3 text-xs">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-blue-200 dark:bg-blue-900 rounded" /> Total
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-emerald-500 rounded" /> Realizadas
            </span>
          </div>
        </div>
      )}

      {/* Seller Stats (Admin Only) */}
      {stats && stats.vendedores && stats.vendedores.length > 0 && (
        <div className="bg-card rounded-xl p-4 border border-border mb-6">
          <h3 className="text-sm font-semibold text-foreground mb-3">Visitas por Vendedor</h3>
          <div className="space-y-2">
            {stats.vendedores.map(v => (
              <div key={v.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium text-foreground">{v.name || v.email}</p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground">{v.total} visitas</span>
                  <span className="text-emerald-600 font-medium">{v.realizadas} realizadas</span>
                  <span className="text-primary font-medium">{v.taxaRealizacao}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex gap-2 flex-wrap">
          {[
            { key: "hoje", label: "Hoje" },
            { key: "semana", label: "Semana" },
            { key: "agendadas", label: "Agendadas" },
            { key: "realizadas", label: "Realizadas" },
            { key: "todas", label: "Todas" }
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key as typeof filter)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === f.key
                  ? "bg-primary text-white"
                  : "bg-secondary text-foreground hover:bg-secondary/80"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-hover transition"
        >
          + Nova Visita
        </button>
      </div>

      {/* New Visit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-foreground">Nova Visita</h2>
            <form onSubmit={createVisita} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Data</label>
                  <input
                    type="date"
                    value={formData.dataAgendada}
                    onChange={e => setFormData({ ...formData, dataAgendada: e.target.value })}
                    className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Hora</label>
                  <input
                    type="time"
                    value={formData.horaAgendada}
                    onChange={e => setFormData({ ...formData, horaAgendada: e.target.value })}
                    className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Cliente</label>
                <select
                  value={formData.clienteId}
                  onChange={e => setFormData({ ...formData, clienteId: e.target.value, prospectoId: "" })}
                  className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground"
                  disabled={!!formData.prospectoId}
                >
                  <option value="">Selecionar cliente...</option>
                  {clientes.map(c => (
                    <option key={c.id} value={c.id}>{c.codigo} - {c.nome}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Ou Prospecto</label>
                <select
                  value={formData.prospectoId}
                  onChange={e => setFormData({ ...formData, prospectoId: e.target.value, clienteId: "" })}
                  className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground"
                  disabled={!!formData.clienteId}
                >
                  <option value="">Selecionar prospecto...</option>
                  {prospectos.map(p => (
                    <option key={p.id} value={p.id}>{p.nomeEmpresa}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Objetivo</label>
                <input
                  type="text"
                  value={formData.objetivo}
                  onChange={e => setFormData({ ...formData, objetivo: e.target.value })}
                  className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground"
                  placeholder="Objetivo da visita"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Notas</label>
                <textarea
                  value={formData.notas}
                  onChange={e => setFormData({ ...formData, notas: e.target.value })}
                  className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground"
                  rows={3}
                  placeholder="Notas adicionais..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2 border border-border rounded-lg text-foreground hover:bg-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover"
                >
                  Criar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mark Completed Modal */}
      {showEditModal && editingVisita && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-foreground">Marcar Visita como Realizada</h2>
            <p className="text-sm text-muted-foreground mb-4">
              {editingVisita.cliente?.nome || editingVisita.prospecto?.nomeEmpresa} - {formatDate(editingVisita.dataAgendada)}
            </p>
            <form onSubmit={submitCompletion} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Resultado da Visita</label>
                <textarea
                  name="resultado"
                  className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground"
                  rows={3}
                  placeholder="Como correu a visita..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Proximos Passos</label>
                <textarea
                  name="proximosPassos"
                  className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground"
                  rows={2}
                  placeholder="Acoes a tomar..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowEditModal(false); setEditingVisita(null) }}
                  className="flex-1 px-4 py-2 border border-border rounded-lg text-foreground hover:bg-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  Concluir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Visits List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : visitas.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Nenhuma visita encontrada
        </div>
      ) : (
        <div className="space-y-3">
          {visitas.map(visita => {
            const isOverdue = visita.estado === "AGENDADA" && isPast(visita.dataAgendada)
            const todayVisit = isToday(visita.dataAgendada)
            return (
              <div
                key={visita.id}
                className={`bg-card rounded-xl p-4 border ${
                  isOverdue ? "border-red-300 dark:border-red-700" :
                  todayVisit && visita.estado === "AGENDADA" ? "border-blue-300 dark:border-blue-700" :
                  "border-border"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className={`font-semibold ${
                        visita.estado === "REALIZADA" ? "text-muted-foreground" : "text-foreground"
                      }`}>
                        {visita.cliente?.nome || visita.prospecto?.nomeEmpresa || "Sem destino"}
                      </h3>
                      <span className={`text-[11px] px-2.5 py-1 rounded-md font-medium ${estadoColors[visita.estado]}`}>
                        {estadoLabels[visita.estado]}
                      </span>
                      {todayVisit && visita.estado === "AGENDADA" && (
                        <span className="text-[11px] px-2.5 py-1 rounded-md font-medium bg-blue-500 text-white">
                          HOJE
                        </span>
                      )}
                      {isOverdue && (
                        <span className="text-[11px] px-2.5 py-1 rounded-md font-medium bg-red-500 text-white">
                          ATRASADA
                        </span>
                      )}
                    </div>

                    {visita.objetivo && (
                      <p className="text-sm text-muted-foreground mb-2">{visita.objetivo}</p>
                    )}

                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {formatDate(visita.dataAgendada)} as {formatTime(visita.dataAgendada)}
                      </span>

                      {visita.cliente && (
                        <Link
                          href={`/clientes/${visita.cliente.id}`}
                          className="flex items-center gap-1 text-primary hover:underline"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          {visita.cliente.codigo} - {visita.cliente.cidade}
                        </Link>
                      )}

                      {visita.prospecto && (
                        <Link
                          href={`/prospectos/${visita.prospecto.id}`}
                          className="flex items-center gap-1 text-primary hover:underline"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
                          </svg>
                          {visita.prospecto.nomeEmpresa}
                        </Link>
                      )}

                      {visita.user && (
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {visita.user.name || visita.user.email}
                        </span>
                      )}
                    </div>

                    {visita.resultado && (
                      <div className="mt-2 p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                        <p className="text-xs font-medium text-emerald-800 dark:text-emerald-200">Resultado:</p>
                        <p className="text-sm text-emerald-700 dark:text-emerald-300">{visita.resultado}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {visita.estado === "AGENDADA" && (
                      <>
                        <button
                          onClick={() => handleMarkCompleted(visita)}
                          className="p-2 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-lg transition"
                          title="Marcar como realizada"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => updateEstado(visita.id, "CANCELADA")}
                          className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition"
                          title="Cancelar visita"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
