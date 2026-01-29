"use client"

import { useState, useEffect } from "react"
import { formatCurrency } from "@/lib/utils"

interface AcordoData {
  id: string
  valorAnual: number
  ano: number
  ativo: boolean
  notas: string | null
  quarterlyTarget: number
  quarterlyTotals: Record<number, number>
  currentQuarter: number
  yearToDateTarget: number
  yearToDateActual: number
  progressPercent: number
  estado: "NO_CAMINHO" | "ATRAS" | "ADIANTADO"
}

interface Props {
  clienteId: string
}

const estadoColors = {
  NO_CAMINHO: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  ATRAS: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  ADIANTADO: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
}

const estadoLabels = {
  NO_CAMINHO: "No Caminho",
  ATRAS: "Atrasado",
  ADIANTADO: "Adiantado"
}

export default function AcordoParceria({ clienteId }: Props) {
  const [acordo, setAcordo] = useState<AcordoData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    valorAnual: "",
    ano: new Date().getFullYear().toString(),
    notas: ""
  })

  useEffect(() => {
    fetchAcordo()
  }, [clienteId])

  async function fetchAcordo() {
    try {
      const res = await fetch(`/api/acordos?clienteId=${clienteId}&ativos=true`)
      const data = await res.json()
      if (data.length > 0) {
        setAcordo(data[0])
        setFormData({
          valorAnual: data[0].valorAnual.toString(),
          ano: data[0].ano.toString(),
          notas: data[0].notas || ""
        })
      }
    } catch (error) {
      console.error("Error:", error)
    }
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch("/api/acordos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clienteId,
          valorAnual: parseFloat(formData.valorAnual),
          ano: parseInt(formData.ano),
          notas: formData.notas || null
        })
      })
      if (res.ok) {
        setShowForm(false)
        fetchAcordo()
      }
    } catch (error) {
      console.error("Error:", error)
    }
    setSaving(false)
  }

  async function handleDeactivate() {
    if (!acordo) return
    if (!confirm("Tem a certeza que deseja desativar este acordo?")) return

    try {
      await fetch(`/api/acordos/${acordo.id}`, { method: "DELETE" })
      setAcordo(null)
      setFormData({
        valorAnual: "",
        ano: new Date().getFullYear().toString(),
        notas: ""
      })
    } catch (error) {
      console.error("Error:", error)
    }
  }

  if (loading) {
    return (
      <div className="bg-card rounded-xl shadow-sm p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-muted rounded w-1/2"></div>
          <div className="h-8 bg-muted rounded w-3/4"></div>
          <div className="h-3 bg-muted rounded w-full"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Acordo de Parceria
        </h3>
        {acordo ? (
          <div className="flex gap-2">
            <button
              onClick={() => setShowForm(true)}
              className="text-sm text-primary hover:underline"
            >
              Editar
            </button>
            <button
              onClick={handleDeactivate}
              className="text-sm text-red-500 hover:underline"
            >
              Desativar
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="text-sm text-primary hover:underline"
          >
            Criar Acordo
          </button>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold mb-4 text-foreground">
              {acordo ? "Editar" : "Novo"} Acordo de Parceria
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Valor Anual (EUR)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.valorAnual}
                  onChange={e => setFormData({ ...formData, valorAnual: e.target.value })}
                  className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Ex: 10000"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Ano
                </label>
                <input
                  type="number"
                  value={formData.ano}
                  onChange={e => setFormData({ ...formData, ano: e.target.value })}
                  className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Notas
                </label>
                <textarea
                  value={formData.notas}
                  onChange={e => setFormData({ ...formData, notas: e.target.value })}
                  className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  rows={2}
                  placeholder="Condicoes, detalhes do acordo..."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2 border border-border rounded-lg text-foreground hover:bg-secondary transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition disabled:opacity-50"
                >
                  {saving ? "A guardar..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {acordo ? (
        <div>
          {/* Status Badge */}
          <div className="flex items-center gap-3 mb-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${estadoColors[acordo.estado]}`}>
              {estadoLabels[acordo.estado]}
            </span>
            <span className="text-sm text-muted-foreground">{acordo.ano}</span>
          </div>

          {/* Annual Target */}
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">Compromisso Anual</p>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(acordo.valorAnual)} EUR</p>
            <p className="text-sm text-muted-foreground">
              Trimestral: {formatCurrency(acordo.quarterlyTarget)} EUR
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Progresso YTD</span>
              <span className="font-medium text-foreground">{acordo.progressPercent.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${
                  acordo.estado === "ATRAS" ? "bg-red-500" :
                  acordo.estado === "ADIANTADO" ? "bg-blue-500" : "bg-green-500"
                }`}
                style={{ width: `${Math.min(acordo.progressPercent, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Realizado: {formatCurrency(acordo.yearToDateActual)} EUR</span>
              <span>Esperado: {formatCurrency(acordo.yearToDateTarget)} EUR</span>
            </div>
          </div>

          {/* Quarterly Breakdown */}
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map(q => {
              const actual = acordo.quarterlyTotals[q] || 0
              const isPast = q < acordo.currentQuarter
              const isCurrent = q === acordo.currentQuarter
              const percent = (actual / acordo.quarterlyTarget) * 100

              return (
                <div
                  key={q}
                  className={`text-center p-2 rounded-lg ${
                    isCurrent ? "bg-primary/10 border-2 border-primary" :
                    isPast ? "bg-secondary" : "bg-muted/50"
                  }`}
                >
                  <p className="text-xs font-medium text-muted-foreground">Q{q}</p>
                  <p className={`text-sm font-bold ${
                    isPast && percent < 90 ? "text-red-500" :
                    isPast && percent >= 90 ? "text-green-500" :
                    "text-foreground"
                  }`}>
                    {formatCurrency(actual)}
                  </p>
                  {(isPast || isCurrent) && (
                    <p className="text-[10px] text-muted-foreground">
                      {percent.toFixed(0)}%
                    </p>
                  )}
                </div>
              )
            })}
          </div>

          {acordo.notas && (
            <p className="text-sm text-muted-foreground mt-4 p-2 bg-muted/50 rounded-lg">
              {acordo.notas}
            </p>
          )}
        </div>
      ) : (
        <div className="text-center py-6">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
            <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <p className="text-muted-foreground text-sm mb-2">Sem acordo de parceria ativo</p>
          <button
            onClick={() => setShowForm(true)}
            className="text-primary hover:underline text-sm font-medium"
          >
            Criar acordo
          </button>
        </div>
      )}
    </div>
  )
}
