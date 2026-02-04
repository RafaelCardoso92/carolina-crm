"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"

interface Tarefa {
  id: string
  titulo: string
  descricao: string | null
  tipo: string | null
  prioridade: "BAIXA" | "MEDIA" | "ALTA" | "URGENTE"
  estado: "PENDENTE" | "EM_PROGRESSO" | "CONCLUIDA" | "CANCELADA"
  dataVencimento: string | null
  cliente: { id: string; nome: string } | null
  prospecto: { id: string; nomeEmpresa: string } | null
}

const prioridadeColors = {
  BAIXA: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 font-medium",
  MEDIA: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 font-medium",
  ALTA: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100 font-medium",
  URGENTE: "bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-100 font-semibold"
}

const estadoColors = {
  PENDENTE: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100 font-medium",
  EM_PROGRESSO: "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-100 font-medium",
  CONCLUIDA: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100 font-medium",
  CANCELADA: "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300 font-medium"
}

export default function TarefasView() {
  const searchParams = useSearchParams()
  const seller = searchParams.get("seller")
  const [tarefas, setTarefas] = useState<Tarefa[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"todas" | "pendentes" | "hoje" | "atrasadas">("pendentes")
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    tipo: "Telefonema",
    prioridade: "MEDIA",
    dataVencimento: ""
  })

  useEffect(() => {
    fetchTarefas()
  }, [filter, seller])

  async function fetchTarefas() {
    setLoading(true)
    try {
      let url = "/api/tarefas?limit=100"
      if (filter === "pendentes") url += "&pendentes=true"
      if (filter === "hoje") url += "&hoje=true"
      if (filter === "atrasadas") url += "&atrasadas=true"
      if (seller) url += `&seller=${seller}`
      
      const res = await fetch(url)
      const data = await res.json()
      setTarefas(data)
    } catch (error) {
      console.error("Error:", error)
    }
    setLoading(false)
  }

  async function createTarefa(e: React.FormEvent) {
    e.preventDefault()
    try {
      const res = await fetch("/api/tarefas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        setShowForm(false)
        setFormData({ titulo: "", descricao: "", tipo: "Telefonema", prioridade: "MEDIA", dataVencimento: "" })
        fetchTarefas()
      }
    } catch (error) {
      console.error("Error:", error)
    }
  }

  async function updateEstado(id: string, estado: string) {
    try {
      await fetch(`/api/tarefas/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado })
      })
      fetchTarefas()
    } catch (error) {
      console.error("Error:", error)
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Tarefas</h1>
          <p className="text-muted-foreground flex items-center gap-2 mt-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            Gestão de tarefas e follow-ups
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-hover transition"
        >
          + Nova Tarefa
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { key: "pendentes", label: "Pendentes" },
          { key: "hoje", label: "Hoje" },
          { key: "atrasadas", label: "Atrasadas" },
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

      {/* New Task Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-foreground">Nova Tarefa</h2>
            <form onSubmit={createTarefa} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Titulo</label>
                <input
                  type="text"
                  value={formData.titulo}
                  onChange={e => setFormData({ ...formData, titulo: e.target.value })}
                  className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Descricao</label>
                <textarea
                  value={formData.descricao}
                  onChange={e => setFormData({ ...formData, descricao: e.target.value })}
                  className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Tipo</label>
                  <select
                    value={formData.tipo}
                    onChange={e => setFormData({ ...formData, tipo: e.target.value })}
                    className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground"
                  >
                    <option>Telefonema</option>
                    <option>Email</option>
                    <option>Visita</option>
                    <option>Reuniao</option>
                    <option>Outro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Prioridade</label>
                  <select
                    value={formData.prioridade}
                    onChange={e => setFormData({ ...formData, prioridade: e.target.value })}
                    className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground"
                  >
                    <option value="BAIXA">Baixa</option>
                    <option value="MEDIA">Media</option>
                    <option value="ALTA">Alta</option>
                    <option value="URGENTE">Urgente</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Data Vencimento</label>
                <input
                  type="date"
                  value={formData.dataVencimento}
                  onChange={e => setFormData({ ...formData, dataVencimento: e.target.value })}
                  className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 border border-border rounded-lg text-foreground hover:bg-secondary">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover">
                  Criar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tasks List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : tarefas.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Nenhuma tarefa encontrada
        </div>
      ) : (
        <div className="space-y-3">
          {tarefas.map(tarefa => {
            const isOverdue = tarefa.dataVencimento && new Date(tarefa.dataVencimento) < new Date() && tarefa.estado !== "CONCLUIDA"
            return (
              <div key={tarefa.id} className={`bg-card rounded-xl p-4 border ${isOverdue ? "border-red-300 dark:border-red-700" : "border-border"}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-semibold ${tarefa.estado === "CONCLUIDA" ? "line-through text-muted-foreground" : "text-foreground"}`}>
                        {tarefa.titulo}
                      </h3>
                      <span className={`text-[11px] px-2.5 py-1 rounded-md ${prioridadeColors[tarefa.prioridade]}`}>
                        {tarefa.prioridade}
                      </span>
                      <span className={`text-[11px] px-2.5 py-1 rounded-md ${estadoColors[tarefa.estado]}`}>
                        {tarefa.estado.replace("_", " ")}
                      </span>
                    </div>
                    {tarefa.descricao && (
                      <p className="text-sm text-muted-foreground mb-2">{tarefa.descricao}</p>
                    )}
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      {tarefa.tipo && <span className="flex items-center gap-1">📋 {tarefa.tipo}</span>}
                      {tarefa.dataVencimento && (
                        <span className={`flex items-center gap-1 ${isOverdue ? "text-red-600 dark:text-red-400 font-medium" : ""}`}>
                          📅 {new Date(tarefa.dataVencimento).toLocaleDateString("pt-PT")}
                          {isOverdue && " (Atrasada)"}
                        </span>
                      )}
                      {tarefa.cliente && (
                        <Link href={`/clientes/${tarefa.cliente.id}`} className="flex items-center gap-1 text-primary hover:underline">
                          👤 {tarefa.cliente.nome}
                        </Link>
                      )}
                      {tarefa.prospecto && (
                        <Link href={`/prospectos/${tarefa.prospecto.id}`} className="flex items-center gap-1 text-primary hover:underline">
                          🏢 {tarefa.prospecto.nomeEmpresa}
                        </Link>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {tarefa.estado !== "CONCLUIDA" && (
                      <button
                        onClick={() => updateEstado(tarefa.id, "CONCLUIDA")}
                        className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition"
                        title="Marcar como concluida"
                      >
                        ✓
                      </button>
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
