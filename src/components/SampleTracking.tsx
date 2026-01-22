"use client"

import { useState, useEffect } from "react"

interface Amostra {
  id: string
  tipo: string
  descricao: string | null
  quantidade: number
  valorEstimado: number | null
  dataEntrega: string
  notas: string | null
  produto: { id: string; nome: string } | null
}

interface Props {
  clienteId?: string
  prospectoId?: string
  produtos?: { id: string; nome: string }[]
}

export default function SampleTracking({ clienteId, prospectoId, produtos = [] }: Props) {
  const [amostras, setAmostras] = useState<Amostra[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    tipo: "AMOSTRA",
    produtoId: "",
    descricao: "",
    quantidade: "1",
    valorEstimado: "",
    notas: ""
  })

  useEffect(() => {
    fetchAmostras()
  }, [clienteId, prospectoId])

  async function fetchAmostras() {
    try {
      const params = new URLSearchParams()
      if (clienteId) params.set("clienteId", clienteId)
      if (prospectoId) params.set("prospectoId", prospectoId)
      
      const res = await fetch(`/api/amostras?${params}`)
      const data = await res.json()
      setAmostras(data)
    } catch (error) {
      console.error("Error:", error)
    }
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch("/api/amostras", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clienteId,
          prospectoId,
          ...formData,
          quantidade: parseInt(formData.quantidade),
          valorEstimado: formData.valorEstimado ? parseFloat(formData.valorEstimado) : null,
          produtoId: formData.produtoId || null
        })
      })
      if (res.ok) {
        setShowForm(false)
        setFormData({ tipo: "AMOSTRA", produtoId: "", descricao: "", quantidade: "1", valorEstimado: "", notas: "" })
        fetchAmostras()
      }
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setSaving(false)
    }
  }

  const totalValor = amostras.reduce((sum, a) => sum + (Number(a.valorEstimado) || 0), 0)

  return (
    <div className="bg-card rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Amostras e Brindes</h3>
          {totalValor > 0 && (
            <p className="text-sm text-muted-foreground">Total: {totalValor.toFixed(2)} EUR</p>
          )}
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-primary text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-primary-hover transition"
        >
          + Registar
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="sample-modal-title">
          <div className="bg-card rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-foreground">Registar Amostra/Brinde</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Tipo</label>
                <select
                  value={formData.tipo}
                  onChange={e => setFormData({ ...formData, tipo: e.target.value })}
                  className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground"
                >
                  <option value="AMOSTRA">Amostra</option>
                  <option value="BRINDE">Brinde</option>
                  <option value="DEMONSTRACAO">Demonstracao</option>
                </select>
              </div>
              {produtos.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Produto</label>
                  <select
                    value={formData.produtoId}
                    onChange={e => setFormData({ ...formData, produtoId: e.target.value })}
                    className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground"
                  >
                    <option value="">Selecionar produto...</option>
                    {produtos.map(p => (
                      <option key={p.id} value={p.id}>{p.nome}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Descricao</label>
                <input
                  type="text"
                  value={formData.descricao}
                  onChange={e => setFormData({ ...formData, descricao: e.target.value })}
                  className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Quantidade</label>
                  <input
                    type="number"
                    value={formData.quantidade}
                    onChange={e => setFormData({ ...formData, quantidade: e.target.value })}
                    className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Valor (EUR)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.valorEstimado}
                    onChange={e => setFormData({ ...formData, valorEstimado: e.target.value })}
                    className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 border border-border rounded-lg text-foreground hover:bg-secondary">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50">
                  {saving ? "A guardar..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="animate-pulse h-20 bg-muted rounded"></div>
      ) : amostras.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-4">Nenhuma amostra registada</p>
      ) : (
        <div className="space-y-2">
          {amostras.map(amostra => (
            <div key={amostra.id} className="p-3 bg-secondary/50 rounded-lg flex items-center justify-between">
              <div>
                <span className="font-medium text-foreground">
                  {amostra.produto?.nome || amostra.descricao || amostra.tipo}
                </span>
                <span className="text-sm text-muted-foreground ml-2">x{amostra.quantidade}</span>
                <p className="text-xs text-muted-foreground">
                  {new Date(amostra.dataEntrega).toLocaleDateString("pt-PT")} - {amostra.tipo}
                </p>
              </div>
              {amostra.valorEstimado && (
                <span className="text-sm font-medium text-foreground">{Number(amostra.valorEstimado).toFixed(2)} EUR</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
