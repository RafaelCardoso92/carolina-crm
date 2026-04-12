"use client"

import { useState, useEffect } from "react"
import Swal from "sweetalert2"

interface Movimento {
  id: string
  tipo: string
  valor: number
  saldoAnterior: number
  saldoNovo: number
  descricao: string | null
  createdAt: string
  incidenciaId: string | null
  cobrancaId: string | null
  parcelaId: string | null
  cobranca: { fatura: string | null; valor: number } | null
  incidencia: { motivo: string; fatura: string | null } | null
}

interface CreditoData {
  cliente: {
    id: string
    nome: string
    codigo: string | null
    saldoCredito: number
  }
  movimentos: Movimento[]
}

const tipoBadge: Record<string, { label: string; color: string }> = {
  CREDITO_ADICIONADO: { label: "Adicionado", color: "bg-green-500/20 text-green-600 dark:text-green-400" },
  CREDITO_APLICADO: { label: "Aplicado", color: "bg-blue-500/20 text-blue-600 dark:text-blue-400" },
  CREDITO_ESTORNADO: { label: "Estornado", color: "bg-orange-500/20 text-orange-600 dark:text-orange-400" },
  CREDITO_REMOVIDO: { label: "Removido", color: "bg-red-500/20 text-red-600 dark:text-red-400" },
}

function formatCurrency(value: number) {
  return value.toFixed(2).replace(".", ",")
}

function getMovimentoDetail(m: Movimento): string {
  if (m.tipo === "CREDITO_APLICADO") {
    const fatura = m.cobranca?.fatura
    if (fatura) return `Aplicado a fatura ${fatura}`
    if (m.cobrancaId) return m.descricao || "Aplicado a cobranca"
    return m.descricao || "Credito aplicado"
  }
  if (m.tipo === "CREDITO_ADICIONADO") {
    const motivo = m.incidencia?.motivo
    const fatura = m.incidencia?.fatura
    if (motivo && fatura) return `${motivo} (fatura ${fatura})`
    if (motivo) return motivo
    return m.descricao || "Credito adicionado"
  }
  if (m.tipo === "CREDITO_ESTORNADO") {
    const motivo = m.incidencia?.motivo
    if (motivo) return `Estorno: ${motivo}`
    return m.descricao || "Credito estornado"
  }
  return m.descricao || "-"
}

export default function CreditoCliente({ clienteId }: { clienteId: string }) {
  const [data, setData] = useState<CreditoData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [valor, setValor] = useState("")
  const [descricao, setDescricao] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const fetchCredito = async () => {
    try {
      const res = await fetch(`/api/clientes/${clienteId}/credito`)
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCredito()
  }, [clienteId])

  const handleRemoveCredit = async () => {
    const valorNum = parseFloat(valor.replace(",", "."))
    if (!valorNum || valorNum <= 0) {
      Swal.fire({ icon: "error", title: "Erro", text: "Introduza um valor valido", confirmButtonColor: "#b8860b" })
      return
    }

    if (data && valorNum > data.cliente.saldoCredito) {
      Swal.fire({ icon: "error", title: "Erro", text: "Valor excede o credito disponivel", confirmButtonColor: "#b8860b" })
      return
    }

    const result = await Swal.fire({
      title: "Remover Credito",
      html: `Tem a certeza que deseja remover <strong>${formatCurrency(valorNum)} EUR</strong> de credito?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sim, remover",
      cancelButtonText: "Cancelar"
    })

    if (!result.isConfirmed) return

    setSubmitting(true)
    try {
      const res = await fetch(`/api/clientes/${clienteId}/credito`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ valor: valorNum, descricao: descricao || undefined })
      })

      if (res.ok) {
        Swal.fire({ icon: "success", title: "Credito removido", text: `${formatCurrency(valorNum)} EUR removido com sucesso`, confirmButtonColor: "#b8860b" })
        setValor("")
        setDescricao("")
        setShowForm(false)
        fetchCredito()
      } else {
        const err = await res.json()
        Swal.fire({ icon: "error", title: "Erro", text: err.error || "Erro ao remover credito", confirmButtonColor: "#b8860b" })
      }
    } catch {
      Swal.fire({ icon: "error", title: "Erro", text: "Erro ao remover credito", confirmButtonColor: "#b8860b" })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-card rounded-xl shadow-sm p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-muted rounded w-40" />
          <div className="h-8 bg-muted rounded w-32" />
        </div>
      </div>
    )
  }

  if (!data) return null

  const saldo = data.cliente.saldoCredito

  return (
    <div className="bg-card rounded-xl shadow-sm p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Historico de Credito</h3>
          <p className={`text-2xl font-bold mt-1 ${saldo > 0 ? "text-purple-600 dark:text-purple-400" : "text-muted-foreground/40"}`}>
            {formatCurrency(saldo)} EUR
          </p>
        </div>
        {saldo > 0 && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition"
          >
            {showForm ? "Cancelar" : "Remover Credito"}
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-secondary/50 rounded-lg p-4 mb-6 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Valor (EUR)</label>
              <input
                type="text"
                inputMode="decimal"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="0,00"
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Motivo (opcional)</label>
              <input
                type="text"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Motivo da remocao..."
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <button
            onClick={handleRemoveCredit}
            disabled={submitting}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition"
          >
            {submitting ? "A remover..." : "Confirmar Remocao"}
          </button>
        </div>
      )}

      {data.movimentos.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2 text-left text-sm font-medium text-muted-foreground">Tipo</th>
                <th className="py-2 text-right text-sm font-medium text-muted-foreground">Valor</th>
                <th className="py-2 text-right text-sm font-medium text-muted-foreground hidden sm:table-cell">Saldo</th>
                <th className="py-2 text-left text-sm font-medium text-muted-foreground">Detalhes</th>
                <th className="py-2 text-right text-sm font-medium text-muted-foreground">Data</th>
              </tr>
            </thead>
            <tbody>
              {data.movimentos.map((m) => {
                const badge = tipoBadge[m.tipo] || { label: m.tipo, color: "bg-gray-500/20 text-gray-600" }
                const isDebit = m.tipo === "CREDITO_APLICADO" || m.tipo === "CREDITO_REMOVIDO" || m.tipo === "CREDITO_ESTORNADO"
                return (
                  <tr key={m.id} className="border-b border-border last:border-0">
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className={`py-3 text-right font-medium ${isDebit ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}>
                      {isDebit ? "-" : "+"}{formatCurrency(m.valor)} €
                    </td>
                    <td className="py-3 text-right text-muted-foreground text-sm hidden sm:table-cell">
                      {formatCurrency(m.saldoAnterior)} → {formatCurrency(m.saldoNovo)}
                    </td>
                    <td className="py-3 text-sm text-muted-foreground max-w-[250px]">
                      <span className="line-clamp-2">{getMovimentoDetail(m)}</span>
                      {m.cobranca?.fatura && m.tipo === "CREDITO_APLICADO" && (
                        <span className="block text-xs text-blue-500 dark:text-blue-400 mt-0.5">
                          Fatura: {m.cobranca.fatura} ({formatCurrency(m.cobranca.valor)} €)
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-right text-muted-foreground text-sm whitespace-nowrap">
                      {new Date(m.createdAt).toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit", year: "numeric" })}
                      <span className="block text-xs text-muted-foreground/60">
                        {new Date(m.createdAt).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">Sem movimentos de credito</p>
      )}
    </div>
  )
}
