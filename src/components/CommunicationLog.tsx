"use client"

import { useState, useEffect } from "react"

interface Comunicacao {
  id: string
  tipo: string
  assunto: string | null
  notas: string | null
  dataContacto: string
  duracao: number | null
}

const tipoIcons: Record<string, string> = {
  TELEFONEMA: "📞",
  EMAIL: "📧",
  VISITA: "🚗",
  WHATSAPP: "💬",
  REUNIAO: "🤝",
  OUTRO: "📋"
}

interface Props {
  clienteId?: string
  prospectoId?: string
}

export default function CommunicationLog({ clienteId, prospectoId }: Props) {
  const [comunicacoes, setComunicacoes] = useState<Comunicacao[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    tipo: "TELEFONEMA",
    assunto: "",
    notas: "",
    duracao: ""
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchComunicacoes()
  }, [clienteId, prospectoId])

  async function fetchComunicacoes() {
    try {
      const params = new URLSearchParams()
      if (clienteId) params.set("clienteId", clienteId)
      if (prospectoId) params.set("prospectoId", prospectoId)
      
      const res = await fetch(`/api/comunicacoes?${params}`)
      const data = await res.json()
      setComunicacoes(data)
    } catch (error) {
      console.error("Error:", error)
    }
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch("/api/comunicacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clienteId,
          prospectoId,
          ...formData,
          duracao: formData.duracao ? parseInt(formData.duracao) : null
        })
      })
      if (res.ok) {
        setShowForm(false)
        setFormData({ tipo: "TELEFONEMA", assunto: "", notas: "", duracao: "" })
        fetchComunicacoes()
      }
    } catch (error) {
      console.error("Error:", error)
    }
    setSaving(false)
  }

  return (
    <div className="bg-card rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Historico de Contactos</h3>
        <button
          onClick={() => setShowForm(true)}
          className="bg-primary text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-primary-hover transition"
        >
          + Registar Contacto
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-foreground">Registar Contacto</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Tipo</label>
                <select
                  value={formData.tipo}
                  onChange={e => setFormData({ ...formData, tipo: e.target.value })}
                  className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground"
                >
                  <option value="TELEFONEMA">📞 Telefonema</option>
                  <option value="EMAIL">📧 Email</option>
                  <option value="VISITA">🚗 Visita</option>
                  <option value="WHATSAPP">💬 WhatsApp</option>
                  <option value="REUNIAO">🤝 Reunião</option>
                  <option value="OUTRO">📋 Outro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Assunto</label>
                <input
                  type="text"
                  value={formData.assunto}
                  onChange={e => setFormData({ ...formData, assunto: e.target.value })}
                  className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground"
                  placeholder="Ex: Apresentacao de novos produtos"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Notas</label>
                <textarea
                  value={formData.notas}
                  onChange={e => setFormData({ ...formData, notas: e.target.value })}
                  className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground"
                  rows={3}
                  placeholder="Detalhes da conversa..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Duracao (minutos)</label>
                <input
                  type="number"
                  value={formData.duracao}
                  onChange={e => setFormData({ ...formData, duracao: e.target.value })}
                  className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground"
                  placeholder="Ex: 15"
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
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50"
                >
                  {saving ? "A guardar..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Communications List */}
      {loading ? (
        <div className="animate-pulse space-y-3">
          <div className="h-12 bg-muted rounded"></div>
          <div className="h-12 bg-muted rounded"></div>
        </div>
      ) : comunicacoes.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-4">Nenhum contacto registado</p>
      ) : (
        <div className="space-y-3">
          {comunicacoes.map(com => (
            <div key={com.id} className="p-3 bg-secondary/50 rounded-lg">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{tipoIcons[com.tipo] || "📋"}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">{com.assunto || com.tipo}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(com.dataContacto).toLocaleDateString("pt-PT")}
                    </span>
                  </div>
                  {com.notas && <p className="text-sm text-muted-foreground mt-1">{com.notas}</p>}
                  {com.duracao && (
                    <p className="text-xs text-muted-foreground mt-1">{com.duracao} min</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
