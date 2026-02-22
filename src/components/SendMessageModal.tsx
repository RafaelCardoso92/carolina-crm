"use client"

import { useState, useEffect } from "react"

interface Seller {
  id: string
  name: string | null
  email: string
}

interface SendMessageModalProps {
  onClose: () => void
  onSent: () => void
  // Pre-fill for entity-linked messages
  entityType?: string
  entityId?: string
  entityName?: string
  recipientId?: string
}

export default function SendMessageModal({
  onClose,
  onSent,
  entityType,
  entityId,
  entityName,
  recipientId: initialRecipientId
}: SendMessageModalProps) {
  const [sellers, setSellers] = useState<Seller[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingSellers, setLoadingSellers] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [recipientId, setRecipientId] = useState(initialRecipientId || "")
  const [content, setContent] = useState("")
  const [priority, setPriority] = useState("NORMAL")
  const [flagged, setFlagged] = useState(false)

  useEffect(() => {
    fetch("/api/sellers")
      .then((res) => res.json())
      .then((data) => {
        setSellers(Array.isArray(data) ? data : [])
      })
      .catch((err) => console.error("Error fetching sellers:", err))
      .finally(() => setLoadingSellers(false))
  }, [])

  async function handleSend() {
    if (!recipientId || !content.trim()) {
      setError("Selecione um destinatario e escreva uma mensagem")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId,
          content,
          entityType: entityType || "GERAL",
          entityId: entityId || null,
          entityName: entityName || null,
          priority,
          flagged
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Erro ao enviar mensagem")
      }

      onSent()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar mensagem")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl shadow-xl max-w-lg w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">Nova Mensagem</h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded-xl mb-4">
            {error}
          </div>
        )}

        {entityType && entityType !== "GERAL" && (
          <div className="bg-muted rounded-lg p-3 mb-4">
            <span className="text-sm text-muted-foreground">Sobre: </span>
            <span className="text-sm font-medium text-foreground">
              {entityType} - {entityName || entityId}
            </span>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Destinatario <span className="text-red-500">*</span>
            </label>
            {loadingSellers ? (
              <div className="px-4 py-3 rounded-xl border border-border bg-muted">A carregar...</div>
            ) : (
              <select
                value={recipientId}
                onChange={(e) => setRecipientId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">Selecione um vendedor</option>
                {sellers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name || s.email}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Mensagem <span className="text-red-500">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              placeholder="Escreva a sua mensagem..."
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-foreground mb-2">Prioridade</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="LOW">Baixa</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">Alta</option>
                <option value="URGENT">Urgente</option>
              </select>
            </div>

            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={flagged}
                  onChange={(e) => setFlagged(e.target.checked)}
                  className="w-5 h-5 rounded border-border text-red-500 focus:ring-red-500"
                />
                <span className="text-sm font-medium text-foreground flex items-center gap-1">
                  <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 3v18h2v-8h14l-2-4 2-4H5V3H3z"/>
                  </svg>
                  Sinalizar
                </span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-3 rounded-xl border border-border hover:bg-muted transition disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSend}
            disabled={loading || !recipientId || !content.trim()}
            className="flex-1 bg-primary text-primary-foreground px-4 py-3 rounded-xl font-medium hover:bg-primary-hover transition disabled:opacity-50"
          >
            {loading ? "A enviar..." : "Enviar"}
          </button>
        </div>
      </div>
    </div>
  )
}
