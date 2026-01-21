"use client"

import { useState, useEffect } from "react"
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
  BAIXA: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
  MEDIA: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  ALTA: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  URGENTE: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
}

const estadoColors = {
  PENDENTE: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  EM_PROGRESSO: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  CONCLUIDA: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  CANCELADA: "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
}

export default function TarefasView() {
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
  }, [filter])

  async function fetchTarefas() {
    setLoading(true)
    try {
      let url = "/api/tarefas?limit=100"
      if (filter === "pendentes") url += "&pendentes=true"
      if (filter === "hoje") url += "&hoje=true"
      if (filter === "atrasadas") url += "&atrasadas=true"
      
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
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Tarefas</h1>
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
                    <option>Reunião</option>
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
                      <span className={`text-xs px-2 py-0.5 rounded-full ${prioridadeColors[tarefa.prioridade]}`}>
                        {tarefa.prioridade}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${estadoColors[tarefa.estado]}`}>
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
