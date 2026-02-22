"use client"

import { useState, useEffect } from "react"
import Swal from "sweetalert2"

type HistoricoIVA = {
  id: string
  percentagem: number
  dataInicio: string
  dataFim: string | null
  notas: string | null
  createdAt: string
}

export default function IVAHistorico() {
  const [historico, setHistorico] = useState<HistoricoIVA[]>([])
  const [taxaAtual, setTaxaAtual] = useState<number>(23)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form fields
  const [novaPercentagem, setNovaPercentagem] = useState("")
  const [novaDataInicio, setNovaDataInicio] = useState("")
  const [novasNotas, setNovasNotas] = useState("")

  useEffect(() => {
    fetchHistorico()
  }, [])

  async function fetchHistorico() {
    try {
      const res = await fetch("/api/iva-historico")
      const data = await res.json()
      if (data.success) {
        setHistorico(data.historico)
        setTaxaAtual(data.taxaAtual)
      }
    } catch (error) {
      console.error("Error fetching IVA history:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleAddRate(e: React.FormEvent) {
    e.preventDefault()
    if (!novaPercentagem || !novaDataInicio) {
      Swal.fire({
        icon: "error",
        title: "Campos obrigatorios",
        text: "Preencha a percentagem e a data de inicio",
        confirmButtonColor: "#b8860b"
      })
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/iva-historico", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          percentagem: parseFloat(novaPercentagem),
          dataInicio: novaDataInicio,
          notas: novasNotas || null
        })
      })

      const data = await res.json()
      if (data.success) {
        Swal.fire({
          icon: "success",
          title: "Taxa adicionada",
          text: `Nova taxa de IVA ${novaPercentagem}% a partir de ${formatDate(novaDataInicio)}`,
          confirmButtonColor: "#b8860b"
        })
        setShowForm(false)
        setNovaPercentagem("")
        setNovaDataInicio("")
        setNovasNotas("")
        fetchHistorico()
      } else {
        Swal.fire({
          icon: "error",
          title: "Erro",
          text: data.error || "Erro ao adicionar taxa",
          confirmButtonColor: "#b8860b"
        })
      }
    } catch (error) {
      console.error("Error adding IVA rate:", error)
      Swal.fire({
        icon: "error",
        title: "Erro",
        text: "Erro ao adicionar taxa de IVA",
        confirmButtonColor: "#b8860b"
      })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string, percentagem: number, dataInicio: string) {
    const result = await Swal.fire({
      title: "Apagar taxa?",
      text: `Tem a certeza que quer apagar a taxa de IVA ${percentagem}% (${formatDate(dataInicio)})?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sim, apagar",
      cancelButtonText: "Cancelar"
    })

    if (!result.isConfirmed) return

    try {
      const res = await fetch(`/api/iva-historico?id=${id}`, {
        method: "DELETE"
      })

      const data = await res.json()
      if (data.success) {
        Swal.fire({
          icon: "success",
          title: "Taxa apagada",
          confirmButtonColor: "#b8860b"
        })
        fetchHistorico()
      } else {
        Swal.fire({
          icon: "error",
          title: "Erro",
          text: data.error || "Erro ao apagar taxa",
          confirmButtonColor: "#b8860b"
        })
      }
    } catch (error) {
      console.error("Error deleting IVA rate:", error)
    }
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr)
    return date.toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit", year: "numeric" })
  }

  if (loading) {
    return (
      <div className="bg-card rounded-xl shadow-sm p-4 md:p-6 border border-border">
        <div className="animate-pulse">
          <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
          <div className="h-10 bg-muted rounded mb-2"></div>
          <div className="h-10 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-xl shadow-sm p-4 md:p-6 border border-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base md:text-lg font-bold text-foreground flex items-center gap-2">
          <svg className="w-4 h-4 md:w-5 md:h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
          </svg>
          IVA
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Taxa atual:</span>
          <span className="text-lg font-bold text-blue-500">{taxaAtual}%</span>
        </div>
      </div>

      {/* Add new rate button/form */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="w-full mb-4 px-4 py-3 bg-blue-500/10 text-blue-500 rounded-xl font-semibold hover:bg-blue-500/20 transition flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Definir Nova Taxa de IVA
        </button>
      ) : (
        <form onSubmit={handleAddRate} className="mb-4 p-4 bg-muted/30 rounded-xl space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Nova Percentagem (%)
              </label>
              <input
                type="number"
                step="0.01"
                value={novaPercentagem}
                onChange={(e) => setNovaPercentagem(e.target.value)}
                placeholder="Ex: 23"
                className="w-full px-3 py-2 border-2 border-border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                A partir de (Data de Inicio)
              </label>
              <input
                type="date"
                value={novaDataInicio}
                onChange={(e) => setNovaDataInicio(e.target.value)}
                className="w-full px-3 py-2 border-2 border-border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Notas (opcional)
            </label>
            <input
              type="text"
              value={novasNotas}
              onChange={(e) => setNovasNotas(e.target.value)}
              placeholder="Ex: Alteracao legislativa"
              className="w-full px-3 py-2 border-2 border-border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition disabled:opacity-50"
            >
              {saving ? "A guardar..." : "Guardar Nova Taxa"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false)
                setNovaPercentagem("")
                setNovaDataInicio("")
                setNovasNotas("")
              }}
              className="px-4 py-2 bg-muted text-muted-foreground rounded-xl font-semibold hover:bg-muted/80 transition"
            >
              Cancelar
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            A nova taxa sera aplicada a todas as cobrancas criadas a partir desta data.
            As cobrancas anteriores manterao a taxa de IVA vigente na sua data de emissao.
          </p>
        </form>
      )}

      {/* History table */}
      {historico.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-2 text-muted-foreground font-medium">Taxa</th>
                <th className="text-left py-2 px-2 text-muted-foreground font-medium">De</th>
                <th className="text-left py-2 px-2 text-muted-foreground font-medium">Ate</th>
                <th className="text-left py-2 px-2 text-muted-foreground font-medium">Notas</th>
                <th className="text-right py-2 px-2 text-muted-foreground font-medium">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {historico.map((h) => (
                <tr key={h.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="py-2 px-2">
                    <span className={`font-bold ${h.dataFim === null ? "text-blue-500" : "text-foreground"}`}>
                      {h.percentagem}%
                    </span>
                    {h.dataFim === null && (
                      <span className="ml-2 text-xs bg-blue-500/20 text-blue-500 px-2 py-0.5 rounded-full">
                        Atual
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-2 text-foreground">{formatDate(h.dataInicio)}</td>
                  <td className="py-2 px-2 text-muted-foreground">
                    {h.dataFim ? formatDate(h.dataFim) : "-"}
                  </td>
                  <td className="py-2 px-2 text-muted-foreground text-xs">{h.notas || "-"}</td>
                  <td className="py-2 px-2 text-right">
                    <button
                      onClick={() => handleDelete(h.id, h.percentagem, h.dataInicio)}
                      className="text-destructive hover:text-destructive/80 p-1"
                      title="Apagar"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-muted-foreground text-sm">
            Nenhum historico de taxas. A taxa padrao de 23% esta a ser utilizada.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Adicione uma nova taxa para comecar a rastrear alteracoes.
          </p>
        </div>
      )}
    </div>
  )
}
