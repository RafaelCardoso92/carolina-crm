"use client"

import { useState, useEffect } from "react"
import Swal from "sweetalert2"

type SellerRate = {
  id: string
  percentagem: number
  dataInicio: string
  dataFim: string | null
  notas: string | null
  userId: string
  createdAt: string
}

type Seller = {
  id: string
  name: string | null
  email: string
  currentRate: number | null
  historico: SellerRate[]
}

export default function ComissaoVendedor() {
  const [sellers, setSellers] = useState<Seller[]>([])
  const [globalRate, setGlobalRate] = useState<number>(3.5)
  const [loading, setLoading] = useState(true)
  const [expandedSeller, setExpandedSeller] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Form fields
  const [novaPercentagem, setNovaPercentagem] = useState("")
  const [novaDataInicio, setNovaDataInicio] = useState("")
  const [novasNotas, setNovasNotas] = useState("")

  useEffect(() => {
    fetchSellers()
  }, [])

  async function fetchSellers() {
    try {
      const res = await fetch("/api/comissao-vendedor")
      const data = await res.json()
      if (data.success) {
        setSellers(data.sellers)
        setGlobalRate(data.globalRate)
      }
    } catch (error) {
      console.error("Error fetching seller commissions:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleAddRate(e: React.FormEvent, userId: string) {
    e.preventDefault()
    if (!novaPercentagem || !novaDataInicio) {
      Swal.fire({
        icon: "error",
        title: "Campos obrigatórios",
        text: "Preencha a percentagem e a data de início",
        confirmButtonColor: "#b8860b"
      })
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/comissao-vendedor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
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
          text: `Nova taxa de ${novaPercentagem}% definida`,
          confirmButtonColor: "#b8860b"
        })
        setNovaPercentagem("")
        setNovaDataInicio("")
        setNovasNotas("")
        fetchSellers()
      } else {
        Swal.fire({
          icon: "error",
          title: "Erro",
          text: data.error || "Erro ao adicionar taxa",
          confirmButtonColor: "#b8860b"
        })
      }
    } catch (error) {
      console.error("Error adding seller commission rate:", error)
      Swal.fire({
        icon: "error",
        title: "Erro",
        text: "Erro ao adicionar taxa de comissão",
        confirmButtonColor: "#b8860b"
      })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string, percentagem: number, sellerName: string) {
    const result = await Swal.fire({
      title: "Apagar taxa?",
      text: `Tem a certeza que quer apagar a taxa de ${percentagem}% de ${sellerName}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sim, apagar",
      cancelButtonText: "Cancelar"
    })

    if (!result.isConfirmed) return

    try {
      const res = await fetch(`/api/comissao-vendedor?id=${id}`, {
        method: "DELETE"
      })

      const data = await res.json()
      if (data.success) {
        Swal.fire({
          icon: "success",
          title: "Taxa apagada",
          confirmButtonColor: "#b8860b"
        })
        fetchSellers()
      } else {
        Swal.fire({
          icon: "error",
          title: "Erro",
          text: data.error || "Erro ao apagar taxa",
          confirmButtonColor: "#b8860b"
        })
      }
    } catch (error) {
      console.error("Error deleting seller commission rate:", error)
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
          <svg className="w-4 h-4 md:w-5 md:h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Comissão por Vendedor
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Global:</span>
          <span className="text-lg font-bold text-success">{globalRate}%</span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mb-4">
        Defina taxas individuais por vendedor. Vendedores sem taxa própria usam a taxa global.
      </p>

      {sellers.length > 0 ? (
        <div className="space-y-2">
          {sellers.map((seller) => (
            <div key={seller.id} className="border border-border/50 rounded-xl overflow-hidden">
              {/* Seller row */}
              <button
                onClick={() => {
                  setExpandedSeller(expandedSeller === seller.id ? null : seller.id)
                  setNovaPercentagem("")
                  setNovaDataInicio("")
                  setNovasNotas("")
                }}
                className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    {(seller.name || seller.email).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="font-semibold text-foreground text-sm">{seller.name || seller.email}</span>
                    {seller.name && (
                      <span className="text-xs text-muted-foreground ml-2">{seller.email}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {seller.currentRate !== null ? (
                    <span className="text-sm font-bold text-primary">{seller.currentRate}%</span>
                  ) : (
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                      Global ({globalRate}%)
                    </span>
                  )}
                  <svg
                    className={`w-4 h-4 text-muted-foreground transition-transform ${expandedSeller === seller.id ? "rotate-180" : ""}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {/* Expanded panel */}
              {expandedSeller === seller.id && (
                <div className="border-t border-border/50 p-3 bg-muted/10">
                  {/* Add rate form */}
                  <form onSubmit={(e) => handleAddRate(e, seller.id)} className="mb-3 p-3 bg-muted/30 rounded-xl space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                          Percentagem (%)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={novaPercentagem}
                          onChange={(e) => setNovaPercentagem(e.target.value)}
                          placeholder="Ex: 4.0"
                          className="w-full px-3 py-2 border-2 border-border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                          A partir de
                        </label>
                        <input
                          type="date"
                          value={novaDataInicio}
                          onChange={(e) => setNovaDataInicio(e.target.value)}
                          className="w-full px-3 py-2 border-2 border-border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                          Notas (opcional)
                        </label>
                        <input
                          type="text"
                          value={novasNotas}
                          onChange={(e) => setNovasNotas(e.target.value)}
                          placeholder="Ex: Taxa especial"
                          className="w-full px-3 py-2 border-2 border-border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={saving}
                        className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary-hover transition disabled:opacity-50"
                      >
                        {saving ? "A guardar..." : "Definir Taxa"}
                      </button>
                    </div>
                  </form>

                  {/* Rate history */}
                  {seller.historico.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-2 px-2 text-muted-foreground font-medium">Taxa</th>
                            <th className="text-left py-2 px-2 text-muted-foreground font-medium">De</th>
                            <th className="text-left py-2 px-2 text-muted-foreground font-medium">Até</th>
                            <th className="text-left py-2 px-2 text-muted-foreground font-medium">Notas</th>
                            <th className="text-right py-2 px-2 text-muted-foreground font-medium">Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {seller.historico.map((h) => (
                            <tr key={h.id} className="border-b border-border/50 hover:bg-muted/30">
                              <td className="py-2 px-2">
                                <span className={`font-bold ${h.dataFim === null ? "text-success" : "text-foreground"}`}>
                                  {h.percentagem}%
                                </span>
                                {h.dataFim === null && (
                                  <span className="ml-2 text-xs bg-success/20 text-success px-2 py-0.5 rounded-full">
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
                                  onClick={() => handleDelete(h.id, h.percentagem, seller.name || seller.email)}
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
                    <p className="text-xs text-muted-foreground text-center py-2">
                      Sem taxa individual — a usar taxa global ({globalRate}%)
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-muted-foreground text-sm">
            Nenhum vendedor ativo encontrado.
          </p>
        </div>
      )}
    </div>
  )
}
