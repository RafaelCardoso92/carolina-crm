"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Swal from "sweetalert2"
import { formatCurrency } from "@/lib/utils"

type Parcela = {
  id: string
  numero: number
  valor: unknown
  dataVencimento: Date | string
  dataPago: Date | string | null
  pago: boolean
  notas: string | null
}

type Cobranca = {
  id: string
  clienteId: string
  fatura: string | null
  valor: unknown
  valorSemIva: unknown
  comissao: unknown
  dataEmissao: Date | null
  dataPago: Date | null
  pago: boolean
  notas: string | null
  numeroParcelas: number
  dataInicioVencimento: Date | null
  cliente: {
    id: string
    nome: string
    codigo: string | null
  }
  parcelas: Parcela[]
}

type Cliente = {
  id: string
  nome: string
  codigo: string | null
}

type Props = {
  cobrancas: Cobranca[]
  clientes: Cliente[]
  totalPendente: number
  totalComissao: number
  ano: number | null
}

function isParcelaAtrasada(parcela: Parcela): boolean {
  if (parcela.pago) return false
  const vencimento = parcela.dataVencimento instanceof Date
    ? parcela.dataVencimento
    : new Date(parcela.dataVencimento)
  return new Date() > vencimento
}

function formatDate(dateVal: Date | string): string {
  const date = dateVal instanceof Date ? dateVal : new Date(dateVal)
  return date.toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit", year: "numeric" })
}

export default function CobrancasView({ cobrancas, clientes, totalPendente, totalComissao, ano }: Props) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<"all" | "pending" | "paid" | "overdue">("pending")
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  // Form state for installments
  const [tipoParcelado, setTipoParcelado] = useState(false)
  const [numeroParcelas, setNumeroParcelas] = useState(2)
  const [dataInicioVencimento, setDataInicioVencimento] = useState("")
  const [valorTotal, setValorTotal] = useState("")

  const filtered = cobrancas.filter(c => {
    if (filter === "pending") return !c.pago
    if (filter === "paid") return c.pago
    if (filter === "overdue") {
      // Has at least one overdue parcela
      return c.parcelas.some(p => isParcelaAtrasada(p))
    }
    return true
  })

  // Count overdue parcelas
  const totalAtrasadas = cobrancas.reduce((acc, c) => {
    return acc + c.parcelas.filter(p => isParcelaAtrasada(p)).length
  }, 0)

  function toggleRowExpanded(id: string) {
    setExpandedRows(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function resetForm() {
    setTipoParcelado(false)
    setNumeroParcelas(2)
    setDataInicioVencimento("")
    setValorTotal("")
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const valor = parseFloat(formData.get("valor") as string)
    const comissaoPercent = 3.5 // Default commission percentage

    const data: Record<string, unknown> = {
      clienteId: formData.get("clienteId") as string,
      fatura: formData.get("fatura") as string || null,
      valor,
      valorSemIva: valor / 1.23, // Assuming 23% VAT
      comissao: (valor / 1.23) * (comissaoPercent / 100),
      dataEmissao: formData.get("dataEmissao") as string || null,
      notas: formData.get("notas") as string || null
    }

    // Add installment data if parcelado mode
    if (tipoParcelado && !editingId) {
      data.numeroParcelas = numeroParcelas
      data.dataInicioVencimento = dataInicioVencimento
    }

    try {
      const url = editingId ? `/api/cobrancas/${editingId}` : "/api/cobrancas"
      const method = editingId ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })

      if (res.ok) {
        setShowForm(false)
        setEditingId(null)
        resetForm()
        router.refresh()
      } else {
        const error = await res.json()
        Swal.fire({
          icon: "error",
          title: "Erro",
          text: error.error || "Erro ao guardar cobranca",
          confirmButtonColor: "#b8860b"
        })
      }
    } catch {
      Swal.fire({
        icon: "error",
        title: "Erro",
        text: "Erro ao guardar cobranca",
        confirmButtonColor: "#b8860b"
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleTogglePaid(id: string, pago: boolean) {
    const action = pago ? "marcar como pendente" : "marcar como pago"
    const result = await Swal.fire({
      title: pago ? "Marcar como pendente?" : "Marcar como pago?",
      text: `Tem a certeza que quer ${action} esta cobranca?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#b8860b",
      cancelButtonColor: "#666666",
      confirmButtonText: "Sim, confirmar",
      cancelButtonText: "Cancelar"
    })

    if (!result.isConfirmed) return

    try {
      const res = await fetch(`/api/cobrancas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pago: !pago,
          dataPago: !pago ? new Date().toISOString() : null
        })
      })
      if (res.ok) {
        router.refresh()
      }
    } catch {
      Swal.fire({
        icon: "error",
        title: "Erro",
        text: "Erro ao atualizar cobranca",
        confirmButtonColor: "#b8860b"
      })
    }
  }

  async function handleToggleParcelaPaid(parcelaId: string, pago: boolean) {
    const action = pago ? "marcar como pendente" : "marcar como pago"
    const result = await Swal.fire({
      title: pago ? "Marcar como pendente?" : "Marcar como pago?",
      text: `Tem a certeza que quer ${action} esta parcela?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#b8860b",
      cancelButtonColor: "#666666",
      confirmButtonText: "Sim, confirmar",
      cancelButtonText: "Cancelar"
    })

    if (!result.isConfirmed) return

    try {
      const res = await fetch(`/api/parcelas/${parcelaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pago: !pago })
      })
      if (res.ok) {
        router.refresh()
      }
    } catch {
      Swal.fire({
        icon: "error",
        title: "Erro",
        text: "Erro ao atualizar parcela",
        confirmButtonColor: "#b8860b"
      })
    }
  }

  async function handleDelete(id: string) {
    const result = await Swal.fire({
      title: "Eliminar cobranca?",
      text: "Tem a certeza que quer eliminar esta cobranca?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#c41e3a",
      cancelButtonColor: "#666666",
      confirmButtonText: "Sim, eliminar",
      cancelButtonText: "Cancelar"
    })

    if (!result.isConfirmed) return

    try {
      const res = await fetch(`/api/cobrancas/${id}`, { method: "DELETE" })
      if (res.ok) {
        router.refresh()
      } else {
        Swal.fire({
          icon: "error",
          title: "Erro",
          text: "Erro ao eliminar cobranca",
          confirmButtonColor: "#b8860b"
        })
      }
    } catch {
      Swal.fire({
        icon: "error",
        title: "Erro",
        text: "Erro ao eliminar cobranca",
        confirmButtonColor: "#b8860b"
      })
    }
  }

  function startEdit(cobranca: Cobranca) {
    setValorTotal(String(cobranca.valor))
    setEditingId(cobranca.id)
    setShowForm(true)
    // Reset installment fields for edit mode (not editable for existing)
    setTipoParcelado(false)
  }

  const editingCobranca = editingId ? cobrancas.find(c => c.id === editingId) : null

  // Generate preview of installments
  const installmentPreview = tipoParcelado && valorTotal && dataInicioVencimento ?
    Array.from({ length: numeroParcelas }, (_, i) => {
      const date = new Date(dataInicioVencimento)
      date.setMonth(date.getMonth() + i)
      return {
        numero: i + 1,
        valor: parseFloat(valorTotal) / numeroParcelas,
        dataVencimento: date
      }
    }) : []

  // Get parcelas status string
  function getParcelasStatus(cobranca: Cobranca): string {
    if (cobranca.parcelas.length === 0) return "-"
    const pagas = cobranca.parcelas.filter(p => p.pago).length
    return `${pagas}/${cobranca.parcelas.length}`
  }

  return (
    <div>
      {/* Year Selector */}
      <div className="bg-card rounded-xl shadow-sm p-3 md:p-4 mb-4 md:mb-6">
        <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4">
          <div className="flex items-center gap-2">
            <label className="text-xs md:text-sm font-semibold text-foreground">Ano:</label>
            <select
              value={ano || ""}
              onChange={(e) => {
                const value = e.target.value
                if (value) {
                  router.push(`/cobrancas?ano=${value}`)
                } else {
                  router.push(`/cobrancas`)
                }
              }}
              className="px-3 md:px-4 py-2 md:py-2.5 border-2 border-border rounded-xl text-foreground font-semibold focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-card text-sm md:text-base"
            >
              <option value="">Todos</option>
              {[2023, 2024, 2025, 2026].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6 mb-4 md:mb-6">
        <div className="bg-card rounded-xl shadow-sm p-4 md:p-6 border-l-4 border-orange-500">
          <div className="flex items-center gap-2 md:gap-3 mb-2">
            <div className="p-1.5 md:p-2 bg-orange-500/10 rounded-lg">
              <svg className="w-5 h-5 md:w-6 md:h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xs md:text-sm font-bold text-foreground">Pendente</h3>
          </div>
          <p className="text-xl md:text-3xl font-bold text-orange-600">{formatCurrency(totalPendente)} €</p>
          <p className="text-xs md:text-sm text-muted-foreground mt-1 hidden md:block">Por receber {ano ? `(${ano})` : ""}</p>
        </div>
        <div className="bg-card rounded-xl shadow-sm p-4 md:p-6 border-l-4 border-primary">
          <div className="flex items-center gap-2 md:gap-3 mb-2">
            <div className="p-1.5 md:p-2 bg-primary/10 rounded-lg">
              <svg className="w-5 h-5 md:w-6 md:h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xs md:text-sm font-bold text-foreground">Comissao</h3>
          </div>
          <p className="text-xl md:text-3xl font-bold text-primary">{formatCurrency(totalComissao)} €</p>
          <p className="text-xs md:text-sm text-muted-foreground mt-1 hidden md:block">3.5% pendentes</p>
        </div>
        {totalAtrasadas > 0 && (
          <div className="bg-card rounded-xl shadow-sm p-4 md:p-6 border-l-4 border-red-500 col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 md:gap-3 mb-2">
              <div className="p-1.5 md:p-2 bg-red-500/10 rounded-lg">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xs md:text-sm font-bold text-foreground">Em Atraso</h3>
            </div>
            <p className="text-xl md:text-3xl font-bold text-red-600">{totalAtrasadas}</p>
            <p className="text-xs md:text-sm text-muted-foreground mt-1 hidden md:block">Parcelas atrasadas</p>
          </div>
        )}
      </div>

      {/* Filter and Add Button */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 md:gap-4 mb-4 md:mb-6">
        <div className="flex gap-1.5 md:gap-2 flex-wrap">
          {[
            { value: "pending", label: "Pendentes", shortLabel: "Pend.", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
            { value: "paid", label: "Pagas", shortLabel: "Pagas", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
            { value: "overdue", label: "Atrasadas", shortLabel: "Atras.", icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" },
            { value: "all", label: "Todas", shortLabel: "Todas", icon: "M4 6h16M4 10h16M4 14h16M4 18h16" }
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value as typeof filter)}
              className={`flex items-center gap-1.5 md:gap-2 px-2.5 md:px-4 py-2 md:py-2.5 rounded-xl font-semibold transition text-xs md:text-base ${
                filter === f.value
                  ? f.value === "overdue"
                    ? "bg-red-600 text-white shadow-lg"
                    : "bg-primary text-primary-foreground shadow-lg"
                  : "bg-card text-foreground hover:bg-secondary border-2 border-border"
              }`}
            >
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={f.icon} />
              </svg>
              <span className="hidden sm:inline">{f.label}</span>
              <span className="sm:hidden">{f.shortLabel}</span>
              {f.value === "overdue" && totalAtrasadas > 0 && (
                <span className={`text-xs px-1.5 md:px-2 py-0.5 rounded-full ${
                  filter === "overdue" ? "bg-white/20" : "bg-red-100 text-red-700"
                }`}>
                  {totalAtrasadas}
                </span>
              )}
            </button>
          ))}
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); resetForm(); }}
          className="bg-primary text-white px-4 md:px-6 py-2.5 md:py-3 rounded-xl font-semibold hover:bg-primary-hover transition flex items-center justify-center gap-2 shadow-lg shadow-primary/20 text-sm md:text-base"
        >
          <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="hidden sm:inline">Adicionar Cobranca</span>
          <span className="sm:hidden">Nova</span>
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-card rounded-xl shadow-sm p-4 md:p-6 mb-4 md:mb-6 border-2 border-primary/20">
          <h3 className="text-lg md:text-xl font-bold text-foreground mb-4 md:mb-6 flex items-center gap-2">
            <svg className="w-5 h-5 md:w-6 md:h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {editingId ? "Editar Cobranca" : "Nova Cobranca"}
          </h3>
          <form key={editingId || "new"} onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-foreground mb-2">Cliente *</label>
                <select
                  name="clienteId"
                  required
                  defaultValue={editingCobranca?.clienteId || ""}
                  className="w-full px-4 py-3 border-2 border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none text-foreground font-medium bg-card"
                >
                  <option value="">Escolher cliente...</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome} {c.codigo ? `(${c.codigo})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-foreground mb-2">Numero da Fatura</label>
                <input
                  name="fatura"
                  type="text"
                  defaultValue={editingCobranca?.fatura || ""}
                  className="w-full px-4 py-3 border-2 border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none text-foreground font-medium bg-card"
                  placeholder="Ex: FA2025/001"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-foreground mb-2">Valor Total (com IVA) *</label>
                <div className="relative">
                  <input
                    name="valor"
                    type="number"
                    step="0.01"
                    required
                    value={valorTotal}
                    onChange={(e) => setValorTotal(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none text-foreground font-medium pr-10 bg-card"
                    placeholder="0.00"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">€</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-foreground mb-2">Data de Emissao</label>
                <input
                  name="dataEmissao"
                  type="date"
                  defaultValue={editingCobranca?.dataEmissao ? new Date(editingCobranca.dataEmissao).toISOString().split("T")[0] : ""}
                  className="w-full px-4 py-3 border-2 border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none text-foreground font-medium bg-card"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-foreground mb-2">Notas</label>
                <input
                  name="notas"
                  type="text"
                  defaultValue={editingCobranca?.notas || ""}
                  className="w-full px-4 py-3 border-2 border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none text-foreground font-medium bg-card"
                  placeholder="Notas adicionais..."
                />
              </div>
            </div>

            {/* Installment Options - Only for new cobrancas */}
            {!editingId && (
              <div className="border-t-2 border-border pt-4 mt-4">
                <label className="block text-sm font-bold text-foreground mb-3">Tipo de Pagamento</label>
                <div className="flex gap-4 mb-4">
                  <button
                    type="button"
                    onClick={() => setTipoParcelado(false)}
                    className={`flex-1 py-3 px-4 rounded-xl font-semibold transition border-2 ${
                      !tipoParcelado
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card text-foreground border-border hover:bg-secondary"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
                      </svg>
                      Pagamento Unico
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipoParcelado(true)}
                    className={`flex-1 py-3 px-4 rounded-xl font-semibold transition border-2 ${
                      tipoParcelado
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card text-foreground border-border hover:bg-secondary"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      Parcelado
                    </div>
                  </button>
                </div>

                {tipoParcelado && (
                  <div className="bg-secondary/50 rounded-xl p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-foreground mb-2">Numero de Parcelas *</label>
                        <select
                          value={numeroParcelas}
                          onChange={(e) => setNumeroParcelas(parseInt(e.target.value))}
                          className="w-full px-4 py-3 border-2 border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none text-foreground font-medium bg-card"
                        >
                          {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                            <option key={n} value={n}>{n} parcelas</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-foreground mb-2">Data da 1ª Parcela *</label>
                        <input
                          type="date"
                          value={dataInicioVencimento}
                          onChange={(e) => setDataInicioVencimento(e.target.value)}
                          required={tipoParcelado}
                          className="w-full px-4 py-3 border-2 border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none text-foreground font-medium bg-card"
                        />
                      </div>
                    </div>

                    {/* Installment Preview */}
                    {installmentPreview.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-bold text-foreground mb-2">Resumo das Parcelas:</h4>
                        <div className="bg-card rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
                          {installmentPreview.map((p) => (
                            <div key={p.numero} className="flex justify-between items-center text-sm py-1 border-b border-border last:border-0">
                              <span className="font-medium text-foreground">Parcela {p.numero}</span>
                              <span className="text-muted-foreground">
                                {formatCurrency(p.valor)} € - {p.dataVencimento.toLocaleDateString("pt-PT")}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-hover transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    A guardar...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Guardar
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditingId(null); resetForm(); }}
                className="px-6 py-3 border-2 border-border rounded-xl font-bold text-foreground hover:bg-secondary transition flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Cobrancas Table */}
      <div className="bg-card rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary border-b-2 border-border">
              <tr>
                <th className="px-2 py-4 text-left text-sm font-bold text-foreground w-8"></th>
                <th className="px-4 py-4 text-left text-sm font-bold text-foreground">Cliente</th>
                <th className="px-4 py-4 text-left text-sm font-bold text-foreground">Fatura</th>
                <th className="px-4 py-4 text-right text-sm font-bold text-foreground">Valor c/IVA</th>
                <th className="px-4 py-4 text-right text-sm font-bold text-foreground">Sem IVA</th>
                <th className="px-4 py-4 text-right text-sm font-bold text-primary">Comissao</th>
                <th className="px-4 py-4 text-center text-sm font-bold text-foreground">Parcelas</th>
                <th className="px-4 py-4 text-center text-sm font-bold text-foreground">Estado</th>
                <th className="px-4 py-4 text-center text-sm font-bold text-foreground">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((cobranca) => {
                const hasOverdue = cobranca.parcelas.some(p => isParcelaAtrasada(p))
                const isExpanded = expandedRows.has(cobranca.id)

                return (
                  <>
                    <tr
                      key={cobranca.id}
                      className={`hover:bg-table-row-hover transition ${
                        cobranca.pago
                          ? "bg-green-500/10"
                          : hasOverdue
                            ? "bg-red-500/5"
                            : ""
                      }`}
                    >
                      <td className="px-2 py-4">
                        {cobranca.parcelas.length > 0 && (
                          <button
                            onClick={() => toggleRowExpanded(cobranca.id)}
                            className="p-1 hover:bg-secondary rounded transition"
                          >
                            <svg
                              className={`w-5 h-5 text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <Link href={`/clientes/${cobranca.cliente.id}`} className="font-semibold text-foreground hover:text-primary transition">
                          {cobranca.cliente.nome}
                        </Link>
                        {cobranca.cliente.codigo && (
                          <span className="text-muted-foreground text-sm ml-2">({cobranca.cliente.codigo})</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-foreground font-medium">{cobranca.fatura || "-"}</td>
                      <td className="px-4 py-4 text-right font-bold text-foreground">
                        {formatCurrency(Number(cobranca.valor))} €
                      </td>
                      <td className="px-4 py-4 text-right text-muted-foreground font-medium">
                        {cobranca.valorSemIva ? formatCurrency(Number(cobranca.valorSemIva)) : "-"} €
                      </td>
                      <td className="px-4 py-4 text-right text-primary font-semibold">
                        {cobranca.comissao ? formatCurrency(Number(cobranca.comissao)) : "-"} €
                      </td>
                      <td className="px-4 py-4 text-center">
                        {cobranca.parcelas.length > 0 ? (
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            hasOverdue
                              ? "bg-red-100 text-red-700"
                              : cobranca.pago
                                ? "bg-green-100 text-green-700"
                                : "bg-blue-100 text-blue-700"
                          }`}>
                            {getParcelasStatus(cobranca)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        {cobranca.parcelas.length === 0 ? (
                          <button
                            onClick={() => handleTogglePaid(cobranca.id, cobranca.pago)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2 mx-auto ${
                              cobranca.pago
                                ? "bg-green-100 text-green-700 hover:bg-green-200"
                                : "bg-orange-100 text-orange-700 hover:bg-orange-200"
                            }`}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={cobranca.pago ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" : "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"} />
                            </svg>
                            {cobranca.pago ? "Marcar Pendente" : "Marcar Pago"}
                          </button>
                        ) : (
                          <span className={`px-4 py-2 rounded-xl text-sm font-bold inline-flex items-center gap-2 ${
                            cobranca.pago
                              ? "bg-green-100 text-green-700"
                              : hasOverdue
                                ? "bg-red-100 text-red-700"
                                : "bg-orange-100 text-orange-700"
                          }`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={
                                cobranca.pago
                                  ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                  : hasOverdue
                                    ? "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                    : "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              } />
                            </svg>
                            {cobranca.pago ? "Pago" : hasOverdue ? "Atrasado" : "Pendente"}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-center gap-1">
                          <button
                            onClick={() => startEdit(cobranca)}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                            title="Editar" aria-label="Editar"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(cobranca.id)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition"
                            title="Eliminar" aria-label="Eliminar"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Parcelas Rows */}
                    {isExpanded && cobranca.parcelas.map((parcela) => {
                      const isAtrasada = isParcelaAtrasada(parcela)
                      return (
                        <tr
                          key={parcela.id}
                          className={`${
                            isAtrasada
                              ? "bg-red-50 dark:bg-red-900/10"
                              : parcela.pago
                                ? "bg-green-50 dark:bg-green-900/10"
                                : "bg-secondary/30"
                          }`}
                        >
                          <td className="px-2 py-3"></td>
                          <td className="px-4 py-3" colSpan={2}>
                            <div className="flex items-center gap-3 pl-4">
                              <div className={`w-2 h-2 rounded-full ${
                                parcela.pago
                                  ? "bg-green-500"
                                  : isAtrasada
                                    ? "bg-red-500"
                                    : "bg-orange-500"
                              }`}></div>
                              <span className="font-medium text-foreground">Parcela {parcela.numero}</span>
                              {isAtrasada && (
                                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">
                                  ATRASADA
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-foreground">
                            {formatCurrency(Number(parcela.valor))} €
                          </td>
                          <td className="px-4 py-3 text-right text-muted-foreground" colSpan={2}>
                            Vencimento: {formatDate(parcela.dataVencimento)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {parcela.pago && parcela.dataPago && (
                              <span className="text-sm text-muted-foreground">
                                Pago em {formatDate(parcela.dataPago)}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => handleToggleParcelaPaid(parcela.id, parcela.pago)}
                              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${
                                parcela.pago
                                  ? "bg-green-100 text-green-700 hover:bg-green-200"
                                  : isAtrasada
                                    ? "bg-red-100 text-red-700 hover:bg-red-200"
                                    : "bg-orange-100 text-orange-700 hover:bg-orange-200"
                              }`}
                            >
                              {parcela.pago ? "Marcar Pendente" : "Marcar Pago"}
                            </button>
                          </td>
                          <td className="px-4 py-3"></td>
                        </tr>
                      )
                    })}
                  </>
                )
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <svg className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-muted-foreground text-lg font-medium">Nenhuma cobranca encontrada</p>
            <p className="text-muted-foreground/70 mt-1">Clique em &quot;Adicionar Cobranca&quot; para comecar</p>
          </div>
        )}
      </div>
    </div>
  )
}
