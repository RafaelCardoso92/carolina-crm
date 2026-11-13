"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import Swal from "sweetalert2"
import TarefaForm from "@/components/TarefaForm"

interface Tarefa {
  id: string
  titulo: string
  descricao: string | null
  tipo: string | null
  prioridade: "BAIXA" | "MEDIA" | "ALTA" | "URGENTE"
  estado: "PENDENTE" | "EM_PROGRESSO" | "CONCLUIDA" | "CANCELADA"
  dataVencimento: string | null
  dataLembrete: string | null
  clienteId: string | null
  prospectoId: string | null
  cliente: { id: string; nome: string } | null
  prospecto: { id: string; nomeEmpresa: string } | null
}

const prioridadeColors = {
  BAIXA: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 font-medium",
  MEDIA: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 font-medium",
  ALTA: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100 font-medium",
  URGENTE: "bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-100 font-semibold"
}
const prioridadeLabels = { BAIXA: "Baixa", MEDIA: "Média", ALTA: "Alta", URGENTE: "Urgente" }

const estadoColors = {
  PENDENTE: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100 font-medium",
  EM_PROGRESSO: "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-100 font-medium",
  CONCLUIDA: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100 font-medium",
  CANCELADA: "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 font-medium"
}
const estadoLabels = { PENDENTE: "Pendente", EM_PROGRESSO: "Em progresso", CONCLUIDA: "Concluída", CANCELADA: "Descartada" }

const PAGE = 100
const iconBtn = "inline-flex items-center justify-center w-11 h-11 rounded-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"

async function erroDoServidor(res: Response, fallback: string) {
  const data = await res.json().catch(() => ({}))
  Swal.fire({ icon: "error", title: "Erro", text: data.error || fallback, confirmButtonColor: "#005290" })
}

export default function TarefasView() {
  const searchParams = useSearchParams()
  const seller = searchParams.get("seller")
  const [tarefas, setTarefas] = useState<Tarefa[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"todas" | "pendentes" | "hoje" | "atrasadas">("pendentes")
  const [limit, setLimit] = useState(PAGE)
  // undefined = closed, null = new, Tarefa = editing
  const [editing, setEditing] = useState<Tarefa | null | undefined>(undefined)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkBusy, setBulkBusy] = useState(false)
  const bulk = filter === "pendentes" || filter === "atrasadas"

  useEffect(() => {
    fetchTarefas()
  }, [filter, seller, limit])

  async function fetchTarefas() {
    setLoading(true)
    try {
      let url = `/api/tarefas?limit=${limit}`
      if (filter === "pendentes") url += "&pendentes=true"
      if (filter === "hoje") url += "&hoje=true"
      if (filter === "atrasadas") url += "&atrasadas=true"
      if (seller) url += `&seller=${seller}`

      const res = await fetch(url)
      if (!res.ok) await erroDoServidor(res, "Erro ao carregar tarefas")
      else {
        const data: Tarefa[] = await res.json()
        setTarefas(data)
        // drop selections that are no longer in the list (other tab/seller, or just updated)
        setSelected(prev => new Set(data.filter(t => prev.has(t.id)).map(t => t.id)))
      }
    } catch (error) {
      console.error("Error:", error)
    }
    setLoading(false)
  }

  async function updateEstado(id: string, estado: Tarefa["estado"]) {
    try {
      const res = await fetch(`/api/tarefas/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado })
      })
      if (!res.ok) await erroDoServidor(res, "Erro ao atualizar tarefa")
      fetchTarefas()
    } catch (error) {
      console.error("Error:", error)
    }
  }

  async function deleteTarefa(t: Tarefa) {
    const r = await Swal.fire({
      icon: "warning",
      title: "Eliminar tarefa?",
      text: `"${t.titulo}" será eliminada definitivamente.`,
      showCancelButton: true,
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      reverseButtons: true
    })
    if (!r.isConfirmed) return
    const res = await fetch(`/api/tarefas/${t.id}`, { method: "DELETE" })
    if (!res.ok) await erroDoServidor(res, "Erro ao eliminar tarefa")
    fetchTarefas()
  }

  async function bulkUpdate(estado: "CONCLUIDA" | "CANCELADA") {
    const ids = [...selected]
    const r = await Swal.fire({
      icon: "question",
      title: estado === "CONCLUIDA" ? `Concluir ${ids.length} tarefas?` : `Descartar ${ids.length} tarefas?`,
      text: estado === "CANCELADA" ? "Ficam em \"Todas\" como descartadas e podem ser reabertas." : undefined,
      showCancelButton: true,
      confirmButtonText: estado === "CONCLUIDA" ? "Concluir" : "Descartar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#005290",
      cancelButtonColor: "#6b7280",
      reverseButtons: true
    })
    if (!r.isConfirmed) return
    setBulkBusy(true)
    let falhas = 0
    // ponytail: one PUT per task, 10 at a time; add a bulk endpoint if this ever runs on thousands
    for (let i = 0; i < ids.length; i += 10) {
      const results = await Promise.all(ids.slice(i, i + 10).map(id =>
        fetch(`/api/tarefas/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ estado })
        }).then(res => res.ok, () => false)
      ))
      falhas += results.filter(ok => !ok).length
    }
    setBulkBusy(false)
    setSelected(new Set())
    if (falhas) Swal.fire({ icon: "error", title: "Erro", text: `${falhas} de ${ids.length} tarefas não foram atualizadas.`, confirmButtonColor: "#005290" })
    fetchTarefas()
  }

  function toggle(id: string) {
    const s = new Set(selected)
    if (s.has(id)) s.delete(id)
    else s.add(id)
    setSelected(s)
  }

  const allSelected = tarefas.length > 0 && selected.size === tarefas.length

  return (
    <div className={selected.size > 0 ? "pb-40 md:pb-24" : ""}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Tarefas</h1>
          <p className="text-muted-foreground flex items-center gap-2 mt-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            Gestão de tarefas e follow-ups
          </p>
        </div>
        <button
          onClick={() => setEditing(null)}
          className="bg-primary text-white px-4 py-2.5 rounded-lg font-medium hover:bg-primary-hover transition"
        >
          + Nova Tarefa
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {[
          { key: "pendentes", label: "Pendentes" },
          { key: "hoje", label: "Hoje" },
          { key: "atrasadas", label: "Atrasadas" },
          { key: "todas", label: "Todas" }
        ].map(f => (
          <button
            key={f.key}
            onClick={() => { setFilter(f.key as typeof filter); setLimit(PAGE) }}
            className={`px-4 py-2.5 rounded-lg font-medium transition ${
              filter === f.key
                ? "bg-primary text-white"
                : "bg-secondary text-foreground hover:bg-secondary/80"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {bulk && tarefas.length > 0 && !loading && (
        <label className="inline-flex items-center gap-3 mb-3 min-h-11 px-1 text-sm font-medium text-foreground cursor-pointer select-none">
          <input
            type="checkbox"
            className="w-5 h-5 accent-primary"
            checked={allSelected}
            onChange={() => setSelected(allSelected ? new Set() : new Set(tarefas.map(t => t.id)))}
          />
          Selecionar todas ({tarefas.length})
        </label>
      )}

      {/* New / edit task modal */}
      {editing !== undefined && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setEditing(undefined)}>
          <div className="bg-card rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4 text-foreground">{editing ? "Editar Tarefa" : "Nova Tarefa"}</h2>
            <TarefaForm
              tarefa={editing}
              onSuccess={() => { setEditing(undefined); fetchTarefas() }}
              onCancel={() => setEditing(undefined)}
            />
          </div>
        </div>
      )}

      {/* Tasks List */}
      {loading && tarefas.length === 0 ? (
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
            const aberta = tarefa.estado === "PENDENTE" || tarefa.estado === "EM_PROGRESSO"
            const isOverdue = aberta && tarefa.dataVencimento && new Date(tarefa.dataVencimento) < new Date()
            const isSel = selected.has(tarefa.id)
            return (
              <div key={tarefa.id} className={`bg-card rounded-xl p-4 border ${isSel ? "border-primary ring-1 ring-primary" : isOverdue ? "border-red-300 dark:border-red-700" : "border-border"}`}>
                <div className="sm:flex sm:items-start sm:gap-3">
                <div className="flex items-start gap-3 sm:flex-1 min-w-0">
                  {bulk && (
                    <input
                      type="checkbox"
                      aria-label={`Selecionar ${tarefa.titulo}`}
                      className="mt-1 w-5 h-5 shrink-0 accent-primary cursor-pointer"
                      checked={isSel}
                      onChange={() => toggle(tarefa.id)}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className={`font-semibold w-full sm:w-auto ${aberta ? "text-foreground" : "line-through text-muted-foreground"}`}>
                        {tarefa.titulo}
                      </h3>
                      <span className={`text-[11px] px-2.5 py-1 rounded-md whitespace-nowrap ${prioridadeColors[tarefa.prioridade]}`}>
                        {prioridadeLabels[tarefa.prioridade]}
                      </span>
                      <span className={`text-[11px] px-2.5 py-1 rounded-md whitespace-nowrap ${estadoColors[tarefa.estado]}`}>
                        {estadoLabels[tarefa.estado]}
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
                </div>
                <div className="flex flex-wrap justify-end gap-1 mt-2 sm:mt-0 sm:shrink-0 -mb-1 -mr-1">
                  {aberta ? (
                    <>
                      <button onClick={() => updateEstado(tarefa.id, "CONCLUIDA")} className={`${iconBtn} w-auto px-3 gap-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                        Concluir
                      </button>
                      <button onClick={() => updateEstado(tarefa.id, "CANCELADA")} className={`${iconBtn} w-auto px-3 text-sm font-medium text-muted-foreground hover:bg-secondary`}>
                        Descartar
                      </button>
                    </>
                  ) : (
                    <button onClick={() => updateEstado(tarefa.id, "PENDENTE")} className={`${iconBtn} w-auto px-3 gap-1.5 text-sm font-medium text-primary hover:bg-primary-light`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                      Reabrir
                    </button>
                  )}
                  <button onClick={() => setEditing(tarefa)} className={`${iconBtn} text-muted-foreground hover:bg-secondary hover:text-foreground`} aria-label="Editar" title="Editar">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </button>
                  <button onClick={() => deleteTarefa(tarefa)} className={`${iconBtn} text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30`} aria-label="Eliminar" title="Eliminar">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
                </div>
              </div>
            )
          })}
          {tarefas.length >= limit && (
            <button
              onClick={() => setLimit(limit + PAGE)}
              disabled={loading}
              className="w-full py-3 rounded-xl border border-border bg-card text-foreground font-medium hover:bg-secondary transition disabled:opacity-60"
            >
              {loading ? "A carregar..." : "Carregar mais"}
            </button>
          )}
        </div>
      )}

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] md:bottom-0 inset-x-0 lg:left-56 z-40 border-t border-border bg-card/95 backdrop-blur pl-4 pr-24 py-3 md:pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-lg">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="text-sm font-medium text-foreground">{selected.size} selecionada{selected.size > 1 ? "s" : ""}</span>
            <div className="flex gap-2">
              <button onClick={() => setSelected(new Set())} disabled={bulkBusy} className="min-h-11 px-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-secondary disabled:opacity-60">
                Limpar
              </button>
              <button onClick={() => bulkUpdate("CANCELADA")} disabled={bulkBusy} className="min-h-11 px-4 rounded-lg text-sm font-medium border border-border text-foreground hover:bg-secondary disabled:opacity-60">
                Descartar
              </button>
              <button onClick={() => bulkUpdate("CONCLUIDA")} disabled={bulkBusy} className="min-h-11 px-4 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary-hover disabled:opacity-60">
                {bulkBusy ? "A atualizar..." : "Concluir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
