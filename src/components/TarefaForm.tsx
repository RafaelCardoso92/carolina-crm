"use client"

import { useState, useEffect } from "react"
import Swal from "sweetalert2"

type Cliente = {
  id: string
  nome: string
  codigo: string | null
}

type Prospecto = {
  id: string
  nomeEmpresa: string
  estado: string
}

type Tarefa = {
  id?: string
  titulo: string
  descricao: string | null
  tipo: string | null
  prioridade: string
  estado?: string
  dataVencimento: string | null
  dataLembrete: string | null
  clienteId: string | null
  prospectoId: string | null
}

type Props = {
  tarefa?: Tarefa | null
  onSuccess: () => void
  onCancel: () => void
}

const TIPOS_TAREFA = [
  "Telefonema",
  "Visita",
  "Email",
  "Reuniao",
  "Proposta",
  "Follow-up",
  "Outro"
]

const PRIORIDADES = [
  { value: "BAIXA", label: "Baixa", color: "bg-gray-100 text-gray-700" },
  { value: "MEDIA", label: "Media", color: "bg-blue-100 text-blue-700" },
  { value: "ALTA", label: "Alta", color: "bg-orange-100 text-orange-700" },
  { value: "URGENTE", label: "Urgente", color: "bg-red-100 text-red-700" }
]

export default function TarefaForm({ tarefa, onSuccess, onCancel }: Props) {
  const [loading, setLoading] = useState(false)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [prospectos, setProspectos] = useState<Prospecto[]>([])
  const [formData, setFormData] = useState<Tarefa>({
    titulo: tarefa?.titulo || "",
    descricao: tarefa?.descricao || "",
    tipo: tarefa?.tipo || "",
    prioridade: tarefa?.prioridade || "MEDIA",
    dataVencimento: tarefa?.dataVencimento ? tarefa.dataVencimento.slice(0, 16) : "",
    dataLembrete: tarefa?.dataLembrete ? tarefa.dataLembrete.slice(0, 16) : "",
    clienteId: tarefa?.clienteId || "",
    prospectoId: tarefa?.prospectoId || ""
  })

  useEffect(() => {
    fetchClientes()
    fetchProspectos()
  }, [])

  async function fetchClientes() {
    try {
      const res = await fetch("/api/clientes?ativo=true&limit=1000")
      if (res.ok) {
        const data = await res.json()
        const list = Array.isArray(data) ? data : (data?.data || [])
        setClientes(list)
      }
    } catch (error) {
      console.error("Error fetching clientes:", error)
    }
  }

  async function fetchProspectos() {
    try {
      const res = await fetch("/api/prospectos?ativo=true&limit=1000")
      if (res.ok) {
        const data = await res.json()
        const list = Array.isArray(data) ? data : (data?.data || [])
        setProspectos(list)
      }
    } catch (error) {
      console.error("Error fetching prospectos:", error)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!formData.titulo.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Título obrigatório",
        text: "Por favor insira um titulo para a tarefa."
      })
      return
    }

    setLoading(true)
    try {
      const url = tarefa?.id ? `/api/tarefas/${tarefa.id}` : "/api/tarefas"
      const method = tarefa?.id ? "PUT" : "POST"

      const body = {
        ...formData,
        dataVencimento: formData.dataVencimento || null,
        dataLembrete: formData.dataLembrete || null,
        clienteId: formData.clienteId || null,
        prospectoId: formData.prospectoId || null
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      })

      if (res.ok) {
        Swal.fire({
          icon: "success",
          title: tarefa?.id ? "Tarefa atualizada!" : "Tarefa criada!",
          timer: 1500,
          showConfirmButton: false
        })
        onSuccess()
      } else {
        const data = await res.json()
        throw new Error(data.error || "Erro ao guardar tarefa")
      }
    } catch (error) {
      console.error("Error saving tarefa:", error)
      Swal.fire({
        icon: "error",
        title: "Erro",
        text: error instanceof Error ? error.message : "Erro ao guardar tarefa"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Titulo *
        </label>
        <input
          type="text"
          value={formData.titulo}
          onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
          className="w-full px-3 py-2 border-2 border-border rounded-lg bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-primary outline-none"
          placeholder="Ex: Ligar para cliente sobre encomenda"
        />
      </div>

      {/* Type and Priority row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Tipo
          </label>
          <select
            value={formData.tipo || ""}
            onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
            className="w-full px-3 py-2 border-2 border-border rounded-lg bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-primary outline-none"
          >
            <option value="">Selecionar...</option>
            {TIPOS_TAREFA.map((tipo) => (
              <option key={tipo} value={tipo}>{tipo}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Prioridade
          </label>
          <select
            value={formData.prioridade}
            onChange={(e) => setFormData({ ...formData, prioridade: e.target.value })}
            className="w-full px-3 py-2 border-2 border-border rounded-lg bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-primary outline-none"
          >
            {PRIORIDADES.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Due date and Reminder */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Data de Vencimento
          </label>
          <input
            type="datetime-local"
            value={formData.dataVencimento || ""}
            onChange={(e) => setFormData({ ...formData, dataVencimento: e.target.value })}
            className="w-full px-3 py-2 border-2 border-border rounded-lg bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-primary outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Lembrete
          </label>
          <input
            type="datetime-local"
            value={formData.dataLembrete || ""}
            onChange={(e) => setFormData({ ...formData, dataLembrete: e.target.value })}
            className="w-full px-3 py-2 border-2 border-border rounded-lg bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-primary outline-none"
          />
        </div>
      </div>

      {/* Link to Cliente or Prospecto */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Cliente (opcional)
          </label>
          <select
            value={formData.clienteId || ""}
            onChange={(e) => setFormData({ ...formData, clienteId: e.target.value, prospectoId: e.target.value ? "" : formData.prospectoId })}
            className="w-full px-3 py-2 border-2 border-border rounded-lg bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-primary outline-none"
          >
            <option value="">Nenhum</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.codigo ? `[${c.codigo}] ` : ""}{c.nome}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Prospecto (opcional)
          </label>
          <select
            value={formData.prospectoId || ""}
            onChange={(e) => setFormData({ ...formData, prospectoId: e.target.value, clienteId: e.target.value ? "" : formData.clienteId })}
            className="w-full px-3 py-2 border-2 border-border rounded-lg bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-primary outline-none"
          >
            <option value="">Nenhum</option>
            {prospectos.map((p) => (
              <option key={p.id} value={p.id}>{p.nomeEmpresa}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Descricao
        </label>
        <textarea
          value={formData.descricao || ""}
          onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border-2 border-border rounded-lg bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-primary outline-none resize-none"
          placeholder="Detalhes adicionais..."
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 border-2 border-border rounded-lg text-foreground font-medium hover:bg-secondary transition"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition disabled:opacity-50"
        >
          {loading ? "A guardar..." : tarefa?.id ? "Atualizar" : "Criar Tarefa"}
        </button>
      </div>
    </form>
  )
}
