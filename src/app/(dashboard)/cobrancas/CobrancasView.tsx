"use client"
import CobrancaAIRisk from "@/components/CobrancaAIRisk"

import { useState, useEffect, useMemo } from "react"
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
  valorPago: unknown | null
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
  prazoVencimentoDias: number | null
  dataVencimento: Date | string | null
  valorPago: unknown | null
  estado: "PENDENTE" | "PAGO" | "PARCIAL" | "ATRASADO"
  tipoDocumento: "FATURA" | "CONSUMO_INTERNO" | null
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
  totalPago: number
  pagoEsteMes: number
  pagoMesPassado: number
  valorEmAtraso: number
  ano: number | null
}

type SortField = "cliente" | "valor" | "dataEmissao" | "fatura"
type SortOrder = "asc" | "desc"


function isCobrancaAtrasada(cobranca: Cobranca): boolean {
  // Fully paid - not late
  if (cobranca.pago || cobranca.estado === "PAGO") return false
  // Has parcelas - check parcelas instead
  if (cobranca.parcelas.length > 0) return false
  // No due date - can't determine
  if (!cobranca.dataVencimento) return false
  const vencimento = cobranca.dataVencimento instanceof Date
    ? cobranca.dataVencimento
    : new Date(cobranca.dataVencimento)
  // Partial or pending - check if past due date
  return new Date() > vencimento
}

function getCobrancaEstado(cobranca: Cobranca): "PENDENTE" | "PAGO" | "PARCIAL" | "ATRASADO" {
  if (cobranca.pago) return "PAGO"
  if (cobranca.valorPago && Number(cobranca.valorPago) > 0 && Number(cobranca.valorPago) < Number(cobranca.valor)) return "PARCIAL"
  if (cobranca.parcelas.length === 0 && isCobrancaAtrasada(cobranca)) return "ATRASADO"
  if (cobranca.parcelas.some(p => isParcelaAtrasada(p))) return "ATRASADO"
  return "PENDENTE"
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

function getMonthKey(date: Date | string | null): string {
  if (!date) return "sem-data"
  const d = date instanceof Date ? date : new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

function getMonthLabel(monthKey: string): string {
  if (monthKey === "sem-data") return "Sem Data"
  const [year, month] = monthKey.split("-")
  const monthNames = [
    "Janeiro", "Fevereiro", "Marco", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ]
  return `${monthNames[parseInt(month) - 1]} ${year}`
}

export default function CobrancasView({ cobrancas, clientes, totalPendente, totalPago, pagoEsteMes, pagoMesPassado, valorEmAtraso, ano }: Props) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<"all" | "pending" | "paid" | "overdue">("all")
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCliente, setSelectedCliente] = useState<string>("")
  const [sortField, setSortField] = useState<SortField>("cliente")
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc")

  // Month grouping state
  const [groupByMonth, setGroupByMonth] = useState(true)
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set())
  const [selectedMonth, setSelectedMonth] = useState<string>("")

  // Document type filter
  const [filterTipoDoc, setFilterTipoDoc] = useState<"all" | "FATURA" | "CI">("all")

  // Form state for installments
  const [tipoParcelado, setTipoParcelado] = useState(false)
  const [numeroParcelas, setNumeroParcelas] = useState(2)
  const [dataInicioVencimento, setDataInicioVencimento] = useState("")
  const [valorTotal, setValorTotal] = useState("")
  const [prazoVencimento, setPrazoVencimento] = useState<4 | 30>(30)

  // Modal state
  const [showModal, setShowModal] = useState(false)

  // Get unique clients from cobrancas for filter dropdown
  const clientesComCobrancas = useMemo(() => {
    const clienteIds = new Set(cobrancas.map(c => c.clienteId))
    return clientes.filter(c => clienteIds.has(c.id)).sort((a, b) => a.nome.localeCompare(b.nome))
  }, [cobrancas, clientes])

  // Get unique months from cobrancas for filter dropdown
  const availableMonths = useMemo(() => {
    const months = new Set<string>()
    cobrancas.forEach(c => {
      const key = getMonthKey(c.dataEmissao)
      months.add(key)
    })
    return Array.from(months).sort().reverse()
  }, [cobrancas])

  // Initialize expanded months with current month
  useEffect(() => {
    if (expandedMonths.size === 0 && availableMonths.length > 0) {
      const now = new Date()
      const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
      if (availableMonths.includes(currentMonthKey)) {
        setExpandedMonths(new Set([currentMonthKey]))
      } else if (availableMonths.length > 0) {
        setExpandedMonths(new Set([availableMonths[0]]))
      }
    }
  }, [availableMonths])

  // Filter and sort cobrancas
  const filtered = useMemo(() => {
    let result = cobrancas

    // Status filter
    if (filter === "pending") result = result.filter(c => !c.pago)
    else if (filter === "paid") result = result.filter(c => c.pago)
    else if (filter === "overdue") result = result.filter(c => c.parcelas.some(p => isParcelaAtrasada(p)))

    // Month filter
    if (selectedMonth) {
      result = result.filter(c => getMonthKey(c.dataEmissao) === selectedMonth)
    }

    // Client filter
    if (selectedCliente) {
      result = result.filter(c => c.clienteId === selectedCliente)
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      result = result.filter(c =>
        c.cliente.nome.toLowerCase().includes(query) ||
        (c.cliente.codigo && c.cliente.codigo.toLowerCase().includes(query)) ||
        (c.fatura && c.fatura.toLowerCase().includes(query)) ||
        (c.notas && c.notas.toLowerCase().includes(query))
      )
    }

    // Document type filter
    if (filterTipoDoc === "FATURA") {
      result = result.filter(c => c.tipoDocumento !== "CONSUMO_INTERNO")
    } else if (filterTipoDoc === "CI") {
      result = result.filter(c => c.tipoDocumento === "CONSUMO_INTERNO")
    }

    // Sort
    result = [...result].sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case "cliente":
          comparison = a.cliente.nome.localeCompare(b.cliente.nome)
          break
        case "valor":
          comparison = Number(a.valor) - Number(b.valor)
          break
        case "dataEmissao":
          const dateA = a.dataEmissao ? new Date(a.dataEmissao).getTime() : 0
          const dateB = b.dataEmissao ? new Date(b.dataEmissao).getTime() : 0
          comparison = dateA - dateB
          break
        case "fatura":
          comparison = (a.fatura || "").localeCompare(b.fatura || "")
          break
      }
      return sortOrder === "asc" ? comparison : -comparison
    })

    return result
  }, [cobrancas, filter, selectedCliente, selectedMonth, searchQuery, sortField, sortOrder, filterTipoDoc])

  // Group cobrancas by month
  const groupedByMonth = useMemo(() => {
    const groups: Record<string, Cobranca[]> = {}
    filtered.forEach(c => {
      const key = getMonthKey(c.dataEmissao)
      if (!groups[key]) groups[key] = []
      groups[key].push(c)
    })
    // Sort months descending (most recent first)
    const sortedKeys = Object.keys(groups).sort().reverse()
    return sortedKeys.map(key => ({
      monthKey: key,
      monthLabel: getMonthLabel(key),
      cobrancas: groups[key],
      total: groups[key].reduce((sum, c) => sum + Number(c.valor), 0),
      totalPendente: groups[key].reduce((sum, c) => {
        // Fully paid - nothing pending
        if (c.pago || c.estado === "PAGO") {
          return sum
        }
        // Cobranca with parcelas - sum unpaid parcelas
        if (c.parcelas && c.parcelas.length > 0) {
          const unpaidParcelas = c.parcelas.filter(p => !p.pago).reduce((pSum, p) => pSum + Number(p.valor), 0)
          return sum + unpaidParcelas
        }
        // Partial payment - remaining amount
        if (c.estado === "PARCIAL" && c.valorPago) {
          return sum + (Number(c.valor) - Number(c.valorPago))
        }
        // Fully pending
        return sum + Number(c.valor)
      }, 0),
      totalPago: groups[key].reduce((sum, c) => {
        // Fully paid cobranca
        if (c.pago || c.estado === "PAGO") {
          return sum + Number(c.valor)
        }
        // Cobranca with parcelas - sum paid parcelas
        if (c.parcelas && c.parcelas.length > 0) {
          const paidParcelas = c.parcelas.filter(p => p.pago).reduce((pSum, p) => pSum + Number(p.valor), 0)
          return sum + paidParcelas
        }
        // Partial payment on cobranca without parcelas
        if (c.estado === "PARCIAL" && c.valorPago) {
          return sum + Number(c.valorPago)
        }
        return sum
      }, 0),
      totalComissao: groups[key].reduce((sum, c) => sum + (c.comissao ? Number(c.comissao) : Number(c.valorSemIva || 0) * 0.035), 0),
      comissaoGanha: groups[key].reduce((sum, c) => {
        const comissaoTotal = c.comissao ? Number(c.comissao) : Number(c.valorSemIva || 0) * 0.035
        if (c.estado === "PAGO" || c.pago) {
          return sum + comissaoTotal
        } else if (c.estado === "PARCIAL" && c.valorPago) {
          const percentPago = Number(c.valorPago) / Number(c.valor)
          return sum + (comissaoTotal * percentPago)
        }
        return sum
      }, 0)
    }))
  }, [filtered])

  // Count overdue parcelas
  const totalAtrasadas = cobrancas.reduce((acc, c) => {
    return acc + c.parcelas.filter(p => isParcelaAtrasada(p)).length
  }, 0)

  // Calculate earned commissions for current month (only from paid or partially paid cobrancas)
  const comissoesGanhasMesAtual = useMemo(() => {
    const currentMonthKey = getMonthKey(new Date())
    return cobrancas.reduce((total, c) => {
      // Only include if paid this month (check dataPago)
      if (!c.dataPago) return total
      const paymentMonthKey = getMonthKey(c.dataPago)
      if (paymentMonthKey !== currentMonthKey) return total

      const comissaoTotal = c.comissao ? Number(c.comissao) : Number(c.valorSemIva || 0) * 0.035

      if (c.estado === "PAGO" || c.pago) {
        // Fully paid - full commission
        return total + comissaoTotal
      } else if (c.estado === "PARCIAL" && c.valorPago) {
        // Partially paid - proportional commission
        const percentPago = Number(c.valorPago) / Number(c.valor)
        return total + (comissaoTotal * percentPago)
      }
      return total
    }, 0)
  }, [cobrancas])

  // Calculate commission breakdown by document type
  const comissoesPorTipo = useMemo(() => {
    const result = {
      faturas: { total: 0, pendente: 0, ganha: 0, count: 0 },
      ci: { total: 0, pendente: 0, ganha: 0, count: 0 }
    }

    cobrancas.forEach(c => {
      const isCI = c.tipoDocumento === "CONSUMO_INTERNO"
      const target = isCI ? result.ci : result.faturas
      const comissaoTotal = c.comissao ? Number(c.comissao) : Number(c.valorSemIva || 0) * 0.035

      target.count++
      target.total += comissaoTotal

      if (c.estado === "PAGO" || c.pago) {
        target.ganha += comissaoTotal
      } else if (c.estado === "PARCIAL" && c.valorPago) {
        const percentPago = Number(c.valorPago) / Number(c.valor)
        target.ganha += comissaoTotal * percentPago
        target.pendente += comissaoTotal * (1 - percentPago)
      } else {
        target.pendente += comissaoTotal
      }
    })

    return result
  }, [cobrancas])

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

  function toggleMonthExpanded(monthKey: string) {
    setExpandedMonths(prev => {
      const next = new Set(prev)
      if (next.has(monthKey)) {
        next.delete(monthKey)
      } else {
        next.add(monthKey)
      }
      return next
    })
  }

  function expandAllMonths() {
    setExpandedMonths(new Set(groupedByMonth.map(g => g.monthKey)))
  }

  function collapseAllMonths() {
    setExpandedMonths(new Set())
  }

  function resetForm() {
    setTipoParcelado(false)
    setNumeroParcelas(2)
    setDataInicioVencimento("")
    setValorTotal("")
    setPrazoVencimento(30)
  }

  function closeModal() {
    setShowModal(false)
    setShowForm(false)
    setEditingId(null)
    resetForm()
  }

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("asc")
    }
  }

  function clearFilters() {
    setSearchQuery("")
    setSelectedCliente("")
    setSelectedMonth("")
    setSortField("cliente")
    setSortOrder("asc")
    setFilter("pending")
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const valor = parseFloat(formData.get("valor") as string)

    // Commission is now calculated server-side using date-based rates
    const data: Record<string, unknown> = {
      clienteId: formData.get("clienteId") as string,
      fatura: formData.get("fatura") as string || null,
      valor,
      valorSemIva: valor / 1.23,
      // comissao is calculated server-side based on emission date
      dataEmissao: formData.get("dataEmissao") as string || null,
      notas: formData.get("notas") as string || null
    }

    if (tipoParcelado) {
      data.numeroParcelas = numeroParcelas
      data.dataInicioVencimento = dataInicioVencimento
      data.updateParcelas = true
    } else {
      // For non-installment payments, set the deadline
      data.prazoVencimentoDias = prazoVencimento
      // Calculate dataVencimento based on dataEmissao + prazo
      if (data.dataEmissao) {
        const emissao = new Date(data.dataEmissao as string)
        emissao.setDate(emissao.getDate() + prazoVencimento)
        data.dataVencimento = emissao.toISOString()
      }
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
        closeModal()
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

  async function handleTogglePaid(id: string, pago: boolean, valorTotal?: number, valorJaPago?: number) {
    const cobranca = cobrancas.find(c => c.id === id)
    const currentValorPago = valorJaPago || (cobranca?.valorPago ? Number(cobranca.valorPago) : 0)
    const isPartialPayment = cobranca?.estado === "PARCIAL" || (currentValorPago > 0 && currentValorPago < (valorTotal || 0))

    // If already fully paid, allow marking as unpaid
    if (pago && !isPartialPayment) {
      const result = await Swal.fire({
        title: "",
        html: `
          <div style="text-align: center; padding: 0;">
            <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
              <svg width="32" height="32" fill="none" stroke="white" viewBox="0 0 24 24" style="stroke-width: 2.5;">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h2 style="font-size: 1.25rem; font-weight: 700; color: #1f2937; margin: 0 0 8px 0;">Marcar como Pendente?</h2>
            <p style="font-size: 0.875rem; color: #6b7280; margin: 0;">Isto ira remover todos os pagamentos registados.</p>
          </div>
        `,
        showCancelButton: true,
        confirmButtonColor: "#f97316",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Sim, marcar pendente",
        cancelButtonText: "Cancelar",
        width: '360px',
        padding: '24px'
      })
      if (!result.isConfirmed) return
      try {
        const res = await fetch(`/api/cobrancas/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pago: false, dataPago: null, valorPago: null, estado: "PENDENTE" })
        })
        if (res.ok) router.refresh()
      } catch {
        Swal.fire({ icon: "error", title: "Erro", text: "Erro ao atualizar cobranca", confirmButtonColor: "#b8860b" })
      }
      return
    }

    // Handle partial payment - show action menu first
    const valorCobranca = valorTotal || 0
    const valorRestante = valorCobranca - currentValorPago
    const today = new Date().toISOString().split("T")[0]

    // If partial payment, show action selection menu
    if (isPartialPayment) {
      const actionResult = await Swal.fire({
        title: "",
        html: `
          <div style="text-align: center; padding: 0;">
            <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
              <svg width="32" height="32" fill="none" stroke="white" viewBox="0 0 24 24" style="stroke-width: 2.5;">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h2 style="font-size: 1.25rem; font-weight: 700; color: #1f2937; margin: 0 0 8px 0;">Pagamento Parcial</h2>
            <p style="font-size: 0.875rem; color: #6b7280; margin: 0 0 16px 0;">Ja pago: <strong>${formatCurrency(currentValorPago)} €</strong> de ${formatCurrency(valorCobranca)} €</p>

            <div style="display: flex; flex-direction: column; gap: 10px;">
              <button type="button" id="action-add" style="width: 100%; padding: 14px 20px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; border: none; border-radius: 12px; font-size: 1rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; transition: transform 0.1s;">
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
                Adicionar Pagamento
              </button>
              <button type="button" id="action-edit" style="width: 100%; padding: 14px 20px; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; border: none; border-radius: 12px; font-size: 1rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; transition: transform 0.1s;">
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                Editar Valor Pago
              </button>
              <button type="button" id="action-remove" style="width: 100%; padding: 14px 20px; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; border: none; border-radius: 12px; font-size: 1rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; transition: transform 0.1s;">
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                Remover Pagamento
              </button>
            </div>
          </div>
        `,
        showConfirmButton: false,
        showCancelButton: true,
        cancelButtonText: "Cancelar",
        cancelButtonColor: "#6b7280",
        width: '380px',
        padding: '24px',
        didOpen: () => {
          const addBtn = document.getElementById('action-add')
          const editBtn = document.getElementById('action-edit')
          const removeBtn = document.getElementById('action-remove')

          addBtn?.addEventListener('click', () => Swal.close({ isConfirmed: true, value: 'add' } as any))
          editBtn?.addEventListener('click', () => Swal.close({ isConfirmed: true, value: 'edit' } as any))
          removeBtn?.addEventListener('click', () => Swal.close({ isConfirmed: true, value: 'remove' } as any))
        }
      })

      if (!actionResult.isConfirmed) return

      const action = (actionResult as any).value

      // Handle remove action
      if (action === 'remove') {
        const confirmRemove = await Swal.fire({
          title: "",
          html: `
            <div style="text-align: center; padding: 0;">
              <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
                <svg width="32" height="32" fill="none" stroke="white" viewBox="0 0 24 24" style="stroke-width: 2.5;">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </div>
              <h2 style="font-size: 1.25rem; font-weight: 700; color: #1f2937; margin: 0 0 8px 0;">Remover Pagamento?</h2>
              <p style="font-size: 0.875rem; color: #6b7280; margin: 0;">Isto ira remover os ${formatCurrency(currentValorPago)} € ja pagos e marcar como pendente.</p>
            </div>
          `,
          showCancelButton: true,
          confirmButtonColor: "#ef4444",
          cancelButtonColor: "#6b7280",
          confirmButtonText: "Sim, remover",
          cancelButtonText: "Cancelar",
          width: '380px',
          padding: '24px'
        })
        if (!confirmRemove.isConfirmed) return
        try {
          const res = await fetch(`/api/cobrancas/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pago: false, dataPago: null, valorPago: null, estado: "PENDENTE" })
          })
          if (res.ok) router.refresh()
        } catch {
          Swal.fire({ icon: "error", title: "Erro", text: "Erro ao remover pagamento", confirmButtonColor: "#b8860b" })
        }
        return
      }

      // Handle edit action
      if (action === 'edit') {
        const editResult = await Swal.fire({
          title: "",
          html: `
            <div style="text-align: left; padding: 0;">
              <div style="text-align: center; margin-bottom: 20px;">
                <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px;">
                  <svg width="32" height="32" fill="none" stroke="white" viewBox="0 0 24 24" style="stroke-width: 2.5;">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                </div>
                <h2 style="font-size: 1.25rem; font-weight: 700; color: #1f2937; margin: 0;">Editar Valor Pago</h2>
              </div>

              <div style="background: #f3f4f6; border-radius: 10px; padding: 12px; margin-bottom: 16px; text-align: center;">
                <p style="font-size: 0.75rem; color: #6b7280; margin: 0;">Valor total da cobranca: <strong>${formatCurrency(valorCobranca)} €</strong></p>
              </div>

              <div style="margin-bottom: 16px;">
                <label style="display: block; font-size: 0.875rem; font-weight: 600; color: #374151; margin-bottom: 8px;">
                  Novo valor pago
                </label>
                <div style="position: relative;">
                  <input type="number" step="0.01" id="valorPago" value="${currentValorPago.toFixed(2)}" min="0" max="${valorCobranca.toFixed(2)}"
                    style="width: 100%; padding: 14px 40px 14px 16px; font-size: 1.125rem; font-weight: 600; border: 2px solid #e5e7eb; border-radius: 12px; outline: none; transition: border-color 0.2s; box-sizing: border-box;"
                    onfocus="this.style.borderColor='#3b82f6'" onblur="this.style.borderColor='#e5e7eb'">
                  <span style="position: absolute; right: 16px; top: 50%; transform: translateY(-50%); font-size: 1.125rem; font-weight: 600; color: #6b7280;">€</span>
                </div>
              </div>
            </div>
          `,
          showCancelButton: true,
          confirmButtonColor: "#3b82f6",
          cancelButtonColor: "#6b7280",
          confirmButtonText: '<span style="display: flex; align-items: center; gap: 8px; padding: 4px 8px;"><svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>Guardar</span>',
          cancelButtonText: "Cancelar",
          width: '380px',
          padding: '24px',
          preConfirm: () => {
            const valorInput = document.getElementById("valorPago") as HTMLInputElement
            const newValue = parseFloat(valorInput.value)
            if (!valorInput.value || newValue < 0) {
              Swal.showValidationMessage("Por favor insira um valor valido")
              return false
            }
            if (newValue > valorCobranca) {
              Swal.showValidationMessage("O valor nao pode ser superior ao total")
              return false
            }
            return { valorPago: newValue }
          }
        })
        if (!editResult.isConfirmed || !editResult.value) return
        const newValorPago = editResult.value.valorPago
        const isParcial = newValorPago > 0 && newValorPago < valorCobranca
        const isPago = newValorPago >= valorCobranca
        try {
          const res = await fetch(`/api/cobrancas/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              pago: isPago,
              valorPago: newValorPago > 0 ? newValorPago : null,
              estado: isPago ? "PAGO" : isParcial ? "PARCIAL" : "PENDENTE"
            })
          })
          if (res.ok) router.refresh()
        } catch {
          Swal.fire({ icon: "error", title: "Erro", text: "Erro ao editar pagamento", confirmButtonColor: "#b8860b" })
        }
        return
      }

      // If action is 'add', continue to add payment flow below
    }

    const result = await Swal.fire({
      title: "",
      html: `
        <div style="text-align: left; padding: 0;">
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="width: 64px; height: 64px; background: linear-gradient(135deg, ${isPartialPayment ? '#eab308' : '#10b981'} 0%, ${isPartialPayment ? '#ca8a04' : '#059669'} 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px;">
              <svg width="32" height="32" fill="none" stroke="white" viewBox="0 0 24 24" style="stroke-width: 2.5;">
                <path stroke-linecap="round" stroke-linejoin="round" d="${isPartialPayment ? 'M12 6v6m0 0v6m0-6h6m-6 0H6' : 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z'}"/>
              </svg>
            </div>
            <h2 style="font-size: 1.5rem; font-weight: 700; color: #1f2937; margin: 0;">${isPartialPayment ? 'Adicionar Pagamento' : 'Registar Pagamento'}</h2>
          </div>

          <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 12px; padding: 16px; margin-bottom: 16px; border: 1px solid #bbf7d0;">
            <p style="font-size: 0.875rem; color: #166534; margin: 0 0 4px 0; font-weight: 500;">Valor total</p>
            <p style="font-size: 1.75rem; font-weight: 700; color: #15803d; margin: 0;">${formatCurrency(valorCobranca)} €</p>
          </div>

          ${isPartialPayment ? `
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
            <div style="background: #fef3c7; border-radius: 10px; padding: 12px; border: 1px solid #fde68a;">
              <p style="font-size: 0.75rem; color: #92400e; margin: 0 0 2px 0; font-weight: 500;">Ja pago</p>
              <p style="font-size: 1.25rem; font-weight: 700; color: #b45309; margin: 0;">${formatCurrency(currentValorPago)} €</p>
            </div>
            <div style="background: #fef2f2; border-radius: 10px; padding: 12px; border: 1px solid #fecaca;">
              <p style="font-size: 0.75rem; color: #dc2626; margin: 0 0 2px 0; font-weight: 500;">Em falta</p>
              <p style="font-size: 1.25rem; font-weight: 700; color: #dc2626; margin: 0;">${formatCurrency(valorRestante)} €</p>
            </div>
          </div>
          ` : ''}

          <div style="margin-bottom: 16px;">
            <label style="display: block; font-size: 0.875rem; font-weight: 600; color: #374151; margin-bottom: 8px;">
              ${isPartialPayment ? 'Valor a adicionar' : 'Valor efetivamente pago'}
            </label>
            <div style="position: relative;">
              <input type="number" step="0.01" id="valorPago" value="${isPartialPayment ? valorRestante.toFixed(2) : valorCobranca.toFixed(2)}"
                style="width: 100%; padding: 14px 40px 14px 16px; font-size: 1.125rem; font-weight: 600; border: 2px solid #e5e7eb; border-radius: 12px; outline: none; transition: border-color 0.2s; box-sizing: border-box;"
                onfocus="this.style.borderColor='#10b981'" onblur="this.style.borderColor='#e5e7eb'">
              <span style="position: absolute; right: 16px; top: 50%; transform: translateY(-50%); font-size: 1.125rem; font-weight: 600; color: #6b7280;">€</span>
            </div>
          </div>

          <div style="margin-bottom: 20px;">
            <label style="display: block; font-size: 0.875rem; font-weight: 600; color: #374151; margin-bottom: 8px;">
              Data de pagamento
            </label>
            <input type="date" id="dataPago" value="${today}" max="${today}"
              style="width: 100%; padding: 14px 16px; font-size: 1rem; border: 2px solid #e5e7eb; border-radius: 12px; outline: none; transition: border-color 0.2s; box-sizing: border-box;"
              onfocus="this.style.borderColor='#10b981'" onblur="this.style.borderColor='#e5e7eb'">
          </div>

          <div style="background: #f0f9ff; border-radius: 8px; padding: 12px; display: flex; align-items: flex-start; gap: 10px;">
            <svg width="20" height="20" fill="none" stroke="#0284c7" viewBox="0 0 24 24" style="flex-shrink: 0; margin-top: 1px;">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <p style="font-size: 0.8125rem; color: #0369a1; margin: 0; line-height: 1.4;">
              ${isPartialPayment
                ? 'Este valor sera <strong>adicionado</strong> ao pagamento ja efetuado.'
                : 'Se o valor pago for inferior ao total, sera marcado como <strong>pagamento parcial</strong>.'}
            </p>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#6b7280",
      confirmButtonText: '<span style="display: flex; align-items: center; gap: 8px; padding: 4px 8px;"><svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>Confirmar</span>',
      cancelButtonText: "Cancelar",
      width: '400px',
      padding: '24px',
      preConfirm: () => {
        const valorInput = document.getElementById("valorPago") as HTMLInputElement
        const dateInput = document.getElementById("dataPago") as HTMLInputElement
        if (!valorInput.value || parseFloat(valorInput.value) <= 0) {
          Swal.showValidationMessage("Por favor insira um valor valido")
          return false
        }
        if (!dateInput.value) {
          Swal.showValidationMessage("Por favor selecione uma data")
          return false
        }
        return { valorPago: parseFloat(valorInput.value), dataPago: dateInput.value }
      }
    })

    if (!result.isConfirmed || !result.value) return

    const novoPagamento = result.value.valorPago
    const dataPago = result.value.dataPago
    const totalPago = isPartialPayment ? currentValorPago + novoPagamento : novoPagamento
    const isParcial = totalPago < valorCobranca
    const estado = isParcial ? "PARCIAL" : "PAGO"

    try {
      const res = await fetch(`/api/cobrancas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pago: !isParcial, valorPago: totalPago, dataPago, estado })
      })
      if (res.ok) router.refresh()
    } catch {
      Swal.fire({ icon: "error", title: "Erro", text: "Erro ao atualizar cobranca", confirmButtonColor: "#b8860b" })
    }
  }

  async function handleToggleParcelaPaid(parcelaId: string, pago: boolean, cobrancaId: string, valorJaPago: number = 0) {
    const cobranca = cobrancas.find(c => c.id === cobrancaId)
    const parcela = cobranca?.parcelas.find(p => p.id === parcelaId)
    const isLate = parcela ? isParcelaAtrasada(parcela) : false
    const valorParcela = parcela ? Number(parcela.valor) : 0
    const numeroParcela = parcela?.numero || 0
    const currentValorPago = valorJaPago
    const isPartialPayment = currentValorPago > 0 && currentValorPago < valorParcela

    // If marking as unpaid (and not a partial payment click)
    if (pago && !isPartialPayment) {
      const result = await Swal.fire({
        title: "",
        html: `
          <div style="text-align: center; padding: 0;">
            <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
              <svg width="32" height="32" fill="none" stroke="white" viewBox="0 0 24 24" style="stroke-width: 2.5;">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h2 style="font-size: 1.25rem; font-weight: 700; color: #1f2937; margin: 0 0 8px 0;">Marcar como Pendente?</h2>
            <p style="font-size: 0.875rem; color: #6b7280; margin: 0;">Parcela ${numeroParcela} - ${formatCurrency(valorParcela)} €</p>
          </div>
        `,
        showCancelButton: true,
        confirmButtonColor: "#f97316",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Sim, marcar pendente",
        cancelButtonText: "Cancelar",
        width: '340px',
        padding: '24px'
      })
      if (!result.isConfirmed) return
      try {
        const res = await fetch(`/api/parcelas/${parcelaId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pago: false, dataPago: null, valorPago: null })
        })
        if (res.ok) router.refresh()
      } catch {
        Swal.fire({ icon: "error", title: "Erro", text: "Erro ao atualizar parcela", confirmButtonColor: "#b8860b" })
      }
      return
    }

    // Marking as paid (or adding to partial payment)
    const today = new Date().toISOString().split("T")[0]
    const emFalta = valorParcela - currentValorPago

    // If partial payment, show action selection menu first
    if (isPartialPayment) {
      const actionResult = await Swal.fire({
        title: "",
        html: `
          <div style="text-align: center; padding: 0;">
            <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
              <svg width="32" height="32" fill="none" stroke="white" viewBox="0 0 24 24" style="stroke-width: 2.5;">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h2 style="font-size: 1.25rem; font-weight: 700; color: #1f2937; margin: 0 0 4px 0;">Parcela ${numeroParcela} - Pagamento Parcial</h2>
            <p style="font-size: 0.875rem; color: #6b7280; margin: 0 0 16px 0;">Ja pago: <strong>${formatCurrency(currentValorPago)} €</strong> de ${formatCurrency(valorParcela)} €</p>

            <div style="display: flex; flex-direction: column; gap: 10px;">
              <button type="button" id="action-add" style="width: 100%; padding: 14px 20px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; border: none; border-radius: 12px; font-size: 1rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; transition: transform 0.1s;">
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
                Adicionar Pagamento
              </button>
              <button type="button" id="action-edit" style="width: 100%; padding: 14px 20px; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; border: none; border-radius: 12px; font-size: 1rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; transition: transform 0.1s;">
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                Editar Valor Pago
              </button>
              <button type="button" id="action-remove" style="width: 100%; padding: 14px 20px; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; border: none; border-radius: 12px; font-size: 1rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; transition: transform 0.1s;">
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                Remover Pagamento
              </button>
            </div>
          </div>
        `,
        showConfirmButton: false,
        showCancelButton: true,
        cancelButtonText: "Cancelar",
        cancelButtonColor: "#6b7280",
        width: '380px',
        padding: '24px',
        didOpen: () => {
          const addBtn = document.getElementById('action-add')
          const editBtn = document.getElementById('action-edit')
          const removeBtn = document.getElementById('action-remove')

          addBtn?.addEventListener('click', () => Swal.close({ isConfirmed: true, value: 'add' } as any))
          editBtn?.addEventListener('click', () => Swal.close({ isConfirmed: true, value: 'edit' } as any))
          removeBtn?.addEventListener('click', () => Swal.close({ isConfirmed: true, value: 'remove' } as any))
        }
      })

      if (!actionResult.isConfirmed) return

      const action = (actionResult as any).value

      // Handle remove action
      if (action === 'remove') {
        const confirmRemove = await Swal.fire({
          title: "",
          html: `
            <div style="text-align: center; padding: 0;">
              <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
                <svg width="32" height="32" fill="none" stroke="white" viewBox="0 0 24 24" style="stroke-width: 2.5;">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </div>
              <h2 style="font-size: 1.25rem; font-weight: 700; color: #1f2937; margin: 0 0 8px 0;">Remover Pagamento?</h2>
              <p style="font-size: 0.875rem; color: #6b7280; margin: 0;">Isto ira remover os ${formatCurrency(currentValorPago)} € ja pagos da parcela ${numeroParcela}.</p>
            </div>
          `,
          showCancelButton: true,
          confirmButtonColor: "#ef4444",
          cancelButtonColor: "#6b7280",
          confirmButtonText: "Sim, remover",
          cancelButtonText: "Cancelar",
          width: '380px',
          padding: '24px'
        })
        if (!confirmRemove.isConfirmed) return
        try {
          const res = await fetch(`/api/parcelas/${parcelaId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pago: false, dataPago: null, valorPago: null })
          })
          if (res.ok) router.refresh()
        } catch {
          Swal.fire({ icon: "error", title: "Erro", text: "Erro ao remover pagamento", confirmButtonColor: "#b8860b" })
        }
        return
      }

      // Handle edit action
      if (action === 'edit') {
        const editResult = await Swal.fire({
          title: "",
          html: `
            <div style="text-align: left; padding: 0;">
              <div style="text-align: center; margin-bottom: 20px;">
                <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px;">
                  <svg width="32" height="32" fill="none" stroke="white" viewBox="0 0 24 24" style="stroke-width: 2.5;">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                </div>
                <h2 style="font-size: 1.25rem; font-weight: 700; color: #1f2937; margin: 0;">Editar Valor Pago</h2>
                <p style="font-size: 0.875rem; color: #6b7280; margin: 4px 0 0 0;">Parcela ${numeroParcela}</p>
              </div>

              <div style="background: #f3f4f6; border-radius: 10px; padding: 12px; margin-bottom: 16px; text-align: center;">
                <p style="font-size: 0.75rem; color: #6b7280; margin: 0;">Valor total da parcela: <strong>${formatCurrency(valorParcela)} €</strong></p>
              </div>

              <div style="margin-bottom: 16px;">
                <label style="display: block; font-size: 0.875rem; font-weight: 600; color: #374151; margin-bottom: 8px;">
                  Novo valor pago
                </label>
                <div style="position: relative;">
                  <input type="number" step="0.01" id="valorPago" value="${currentValorPago.toFixed(2)}" min="0" max="${valorParcela.toFixed(2)}"
                    style="width: 100%; padding: 14px 40px 14px 16px; font-size: 1.125rem; font-weight: 600; border: 2px solid #e5e7eb; border-radius: 12px; outline: none; transition: border-color 0.2s; box-sizing: border-box;"
                    onfocus="this.style.borderColor='#3b82f6'" onblur="this.style.borderColor='#e5e7eb'">
                  <span style="position: absolute; right: 16px; top: 50%; transform: translateY(-50%); font-size: 1.125rem; font-weight: 600; color: #6b7280;">€</span>
                </div>
              </div>
            </div>
          `,
          showCancelButton: true,
          confirmButtonColor: "#3b82f6",
          cancelButtonColor: "#6b7280",
          confirmButtonText: '<span style="display: flex; align-items: center; gap: 8px; padding: 4px 8px;"><svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>Guardar</span>',
          cancelButtonText: "Cancelar",
          width: '380px',
          padding: '24px',
          preConfirm: () => {
            const valorInput = document.getElementById("valorPago") as HTMLInputElement
            const newValue = parseFloat(valorInput.value)
            if (!valorInput.value || newValue < 0) {
              Swal.showValidationMessage("Por favor insira um valor valido")
              return false
            }
            if (newValue > valorParcela) {
              Swal.showValidationMessage("O valor nao pode ser superior ao total")
              return false
            }
            return { valorPago: newValue }
          }
        })
        if (!editResult.isConfirmed || !editResult.value) return
        const newValorPago = editResult.value.valorPago
        const isParcial = newValorPago > 0 && newValorPago < valorParcela
        const isPago = newValorPago >= valorParcela
        try {
          const res = await fetch(`/api/parcelas/${parcelaId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              pago: isPago,
              valorPago: newValorPago > 0 ? newValorPago : null
            })
          })
          if (res.ok) router.refresh()
        } catch {
          Swal.fire({ icon: "error", title: "Erro", text: "Erro ao editar pagamento", confirmButtonColor: "#b8860b" })
        }
        return
      }

      // If action is 'add', continue to add payment flow below
    }

    const defaultValue = isPartialPayment ? emFalta : valorParcela

    const result = await Swal.fire({
      title: "",
      html: `
        <div style="text-align: left; padding: 0;">
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="width: 64px; height: 64px; background: linear-gradient(135deg, ${isPartialPayment ? '#10b981' : '#10b981'} 0%, ${isPartialPayment ? '#059669' : '#059669'} 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px;">
              <svg width="32" height="32" fill="none" stroke="white" viewBox="0 0 24 24" style="stroke-width: 2.5;">
                ${isPartialPayment
                  ? '<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>'
                  : '<path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>'}
              </svg>
            </div>
            <h2 style="font-size: 1.25rem; font-weight: 700; color: #1f2937; margin: 0;">${isPartialPayment ? 'Adicionar Pagamento' : `Pagar Parcela ${numeroParcela}`}</h2>
            ${isPartialPayment ? `<p style="font-size: 0.875rem; color: #6b7280; margin: 4px 0 0 0;">Parcela ${numeroParcela}</p>` : ''}
          </div>

          ${isLate && !isPartialPayment ? `
          <div style="background: #fef2f2; border-radius: 8px; padding: 12px; margin-bottom: 16px; display: flex; align-items: center; gap: 10px; border: 1px solid #fecaca;">
            <svg width="20" height="20" fill="none" stroke="#dc2626" viewBox="0 0 24 24" style="flex-shrink: 0;">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
            <p style="font-size: 0.8125rem; color: #dc2626; margin: 0; font-weight: 500;">Esta parcela esta em atraso</p>
          </div>
          ` : ''}

          ${isPartialPayment ? `
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
            <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 12px; padding: 14px; border: 1px solid #bbf7d0;">
              <p style="font-size: 0.75rem; color: #166534; margin: 0 0 4px 0; font-weight: 500;">Ja pago</p>
              <p style="font-size: 1.25rem; font-weight: 700; color: #15803d; margin: 0;">${formatCurrency(currentValorPago)} €</p>
            </div>
            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; padding: 14px; border: 1px solid #fcd34d;">
              <p style="font-size: 0.75rem; color: #92400e; margin: 0 0 4px 0; font-weight: 500;">Em falta</p>
              <p style="font-size: 1.25rem; font-weight: 700; color: #b45309; margin: 0;">${formatCurrency(emFalta)} €</p>
            </div>
          </div>
          <div style="background: #f3f4f6; border-radius: 8px; padding: 10px; margin-bottom: 16px; text-align: center;">
            <p style="font-size: 0.75rem; color: #6b7280; margin: 0;">Valor total da parcela: <strong>${formatCurrency(valorParcela)} €</strong></p>
          </div>
          ` : `
          <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 12px; padding: 16px; margin-bottom: 20px; border: 1px solid #bbf7d0;">
            <p style="font-size: 0.875rem; color: #166534; margin: 0 0 4px 0; font-weight: 500;">Valor da parcela</p>
            <p style="font-size: 1.5rem; font-weight: 700; color: #15803d; margin: 0;">${formatCurrency(valorParcela)} €</p>
          </div>
          `}

          <div style="margin-bottom: 16px;">
            <label style="display: block; font-size: 0.875rem; font-weight: 600; color: #374151; margin-bottom: 8px;">
              ${isPartialPayment ? 'Valor a adicionar' : 'Valor pago'}
            </label>
            <div style="position: relative;">
              <input type="number" step="0.01" id="valorPago" value="${defaultValue.toFixed(2)}"
                style="width: 100%; padding: 14px 40px 14px 16px; font-size: 1.125rem; font-weight: 600; border: 2px solid #e5e7eb; border-radius: 12px; outline: none; transition: border-color 0.2s; box-sizing: border-box;"
                onfocus="this.style.borderColor='${isPartialPayment ? '#8b5cf6' : '#10b981'}'" onblur="this.style.borderColor='#e5e7eb'">
              <span style="position: absolute; right: 16px; top: 50%; transform: translateY(-50%); font-size: 1.125rem; font-weight: 600; color: #6b7280;">€</span>
            </div>
          </div>

          <div style="margin-bottom: 16px;">
            <label style="display: block; font-size: 0.875rem; font-weight: 600; color: #374151; margin-bottom: 8px;">
              Data de pagamento
            </label>
            <input type="date" id="dataPago" value="${today}" max="${today}"
              style="width: 100%; padding: 14px 16px; font-size: 1rem; border: 2px solid #e5e7eb; border-radius: 12px; outline: none; transition: border-color 0.2s; box-sizing: border-box;"
              onfocus="this.style.borderColor='${isPartialPayment ? '#8b5cf6' : '#10b981'}'" onblur="this.style.borderColor='#e5e7eb'">
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonColor: isPartialPayment ? "#8b5cf6" : "#10b981",
      cancelButtonColor: "#6b7280",
      confirmButtonText: `<span style="display: flex; align-items: center; gap: 8px; padding: 4px 8px;"><svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${isPartialPayment ? 'M12 4v16m8-8H4' : 'M5 13l4 4L19 7'}"/></svg>${isPartialPayment ? 'Adicionar' : 'Confirmar'}</span>`,
      cancelButtonText: "Cancelar",
      width: '380px',
      padding: '24px',
      preConfirm: () => {
        const valorInput = document.getElementById("valorPago") as HTMLInputElement
        const dateInput = document.getElementById("dataPago") as HTMLInputElement
        if (!valorInput.value || parseFloat(valorInput.value) <= 0) {
          Swal.showValidationMessage("Por favor insira um valor valido")
          return false
        }
        if (!dateInput.value) {
          Swal.showValidationMessage("Por favor selecione uma data")
          return false
        }
        return { valorPago: parseFloat(valorInput.value), dataPago: dateInput.value }
      }
    })

    if (!result.isConfirmed || !result.value) return

    const novoPagamento = result.value.valorPago
    const dataPago = result.value.dataPago
    const totalPago = isPartialPayment ? currentValorPago + novoPagamento : novoPagamento
    const isParcial = totalPago < valorParcela

    try {
      const res = await fetch(`/api/parcelas/${parcelaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pago: !isParcial, valorPago: totalPago, dataPago })
      })
      if (res.ok) router.refresh()
    } catch {
      Swal.fire({ icon: "error", title: "Erro", text: "Erro ao atualizar parcela", confirmButtonColor: "#b8860b" })
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
    setEditingId(cobranca.id)
    setValorTotal(String(cobranca.valor))
    if (cobranca.parcelas.length > 0) {
      setTipoParcelado(true)
      setNumeroParcelas(cobranca.numeroParcelas || cobranca.parcelas.length)
      if (cobranca.dataInicioVencimento) {
        setDataInicioVencimento(new Date(cobranca.dataInicioVencimento).toISOString().split("T")[0])
      } else if (cobranca.parcelas[0]?.dataVencimento) {
        const firstDate = cobranca.parcelas[0].dataVencimento instanceof Date
          ? cobranca.parcelas[0].dataVencimento
          : new Date(cobranca.parcelas[0].dataVencimento)
        setDataInicioVencimento(firstDate.toISOString().split("T")[0])
      }
    } else {
      setTipoParcelado(false)
      setNumeroParcelas(2)
      setDataInicioVencimento("")
      // Set prazo from existing cobranca
      if (cobranca.prazoVencimentoDias === 4 || cobranca.prazoVencimentoDias === 30) {
        setPrazoVencimento(cobranca.prazoVencimentoDias)
      } else {
        setPrazoVencimento(30) // default
      }
    }
    setShowModal(true)
  }

  const editingCobranca = editingId ? cobrancas.find(c => c.id === editingId) : null

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

  function getParcelasStatus(cobranca: Cobranca): string {
    if (cobranca.parcelas.length === 0) return "-"
    const pagas = cobranca.parcelas.filter(p => p.pago).length
    return `${pagas}/${cobranca.parcelas.length}`
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <span className="text-muted-foreground/50 ml-1">↕</span>
    return <span className="text-primary ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
  }

  // Render cobranca row (reusable for both grouped and ungrouped views)
  const renderCobrancaRow = (cobranca: Cobranca) => {
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
            <div className="flex items-center gap-2">
              <Link href={`/clientes/${cobranca.cliente.id}`} className="font-semibold text-foreground hover:text-primary transition">
                {cobranca.cliente.nome}
              </Link>
              {cobranca.tipoDocumento === "CONSUMO_INTERNO" && (
                <span className="px-1.5 py-0.5 text-xs font-bold bg-orange-500/10 text-orange-600 rounded">C.I.</span>
              )}
            </div>
            {cobranca.cliente.codigo && (
              <span className="text-muted-foreground text-sm">({cobranca.cliente.codigo})</span>
            )}
          </td>
          <td className="px-4 py-4 text-foreground font-medium">{cobranca.fatura || "-"}</td>
          <td className="px-4 py-4 text-right font-bold text-foreground">
            {formatCurrency(Number(cobranca.valor))} €
          </td>
          <td className="px-4 py-4 text-right text-muted-foreground font-medium">
            {cobranca.valorSemIva ? formatCurrency(Number(cobranca.valorSemIva)) : "-"} €
          </td>
          <td className="px-4 py-4 text-right">
            <div className="flex flex-col items-end">
              <span className="text-primary font-semibold">
                {formatCurrency(cobranca.comissao ? Number(cobranca.comissao) : Number(cobranca.valorSemIva || 0) * 0.035)} €
              </span>
              {(cobranca.pago || cobranca.estado === "PAGO") ? (
                <span className="text-xs text-green-600 font-medium">
                  ✓ Ganha: {formatCurrency(cobranca.comissao ? Number(cobranca.comissao) : Number(cobranca.valorSemIva || 0) * 0.035)}€
                </span>
              ) : cobranca.estado === "PARCIAL" && Number(cobranca.valorPago || 0) > 0 ? (
                <span className="text-xs text-green-600 font-medium">
                  ✓ Ganha: {formatCurrency((cobranca.comissao ? Number(cobranca.comissao) : Number(cobranca.valorSemIva || 0) * 0.035) * (Number(cobranca.valorPago) / Number(cobranca.valor)))}€
                </span>
              ) : null}
            </div>
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
                onClick={() => handleTogglePaid(
                  cobranca.id,
                  cobranca.pago || cobranca.estado === "PAGO",
                  Number(cobranca.valor),
                  cobranca.valorPago ? Number(cobranca.valorPago) : 0
                )}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2 mx-auto ${
                  cobranca.pago || cobranca.estado === "PAGO"
                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                    : cobranca.estado === "PARCIAL" && isCobrancaAtrasada(cobranca)
                      ? "bg-red-100 text-red-700 hover:bg-red-200"
                      : cobranca.estado === "PARCIAL"
                        ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                        : isCobrancaAtrasada(cobranca)
                          ? "bg-red-100 text-red-700 hover:bg-red-200"
                          : "bg-orange-100 text-orange-700 hover:bg-orange-200"
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={
                    cobranca.pago || cobranca.estado === "PAGO"
                      ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      : cobranca.estado === "PARCIAL"
                        ? "M12 6v6m0 0v6m0-6h6m-6 0H6"
                        : isCobrancaAtrasada(cobranca)
                          ? "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                          : "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  } />
                </svg>
                <span className="flex flex-col items-start">
                  <span className="flex items-center gap-1">
                    {cobranca.pago || cobranca.estado === "PAGO" ? "Pago" : cobranca.estado === "PARCIAL" ? "Pagamento" : isCobrancaAtrasada(cobranca) ? "Atrasado" : "Pendente"}
                    {cobranca.estado === "PARCIAL" && cobranca.valorPago != null && Number(cobranca.valorPago) > 0 && (
                      <span className="text-xs">({formatCurrency(Number(cobranca.valorPago))}€)</span>
                    )}
                  </span>
                  {cobranca.estado === "PARCIAL" && isCobrancaAtrasada(cobranca) && (
                    <span className="text-xs font-medium">Atrasado</span>
                  )}
                </span>
              </button>
            ) : (
              <button
                onClick={() => toggleRowExpanded(cobranca.id)}
                className={`px-4 py-2 rounded-xl text-sm font-bold inline-flex items-center gap-2 cursor-pointer hover:opacity-80 transition ${
                cobranca.pago
                  ? "bg-green-100 text-green-700"
                  : hasOverdue
                    ? "bg-red-100 text-red-700"
                    : "bg-orange-100 text-orange-700"
              }`}
                title={cobranca.pago ? "" : "Clique para ver parcelas"}
              >
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
              </button>
            )}
          </td>
          <td className="px-4 py-4">
            <div className="flex justify-center gap-1">
              <button
                onClick={() => startEdit(cobranca)}
                className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                title="Editar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={() => handleDelete(cobranca.id)}
                className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition"
                title="Eliminar"
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
          const valorParcela = Number(parcela.valor)
          const valorPagoParcela = parcela.valorPago ? Number(parcela.valorPago) : 0
          const isParcelaParcial = !parcela.pago && valorPagoParcela > 0 && valorPagoParcela < valorParcela
          return (
            <tr
              key={parcela.id}
              className={`${
                isAtrasada
                  ? "bg-red-50 dark:bg-red-900/10"
                  : parcela.pago
                    ? "bg-green-50 dark:bg-green-900/10"
                    : isParcelaParcial
                      ? "bg-purple-50 dark:bg-purple-900/10"
                      : "bg-secondary/30"
              }`}
            >
              <td className="px-2 py-3"></td>
              <td className="px-4 py-3" colSpan={2}>
                <div className="flex items-center gap-3 pl-4">
                  <div className={`w-2 h-2 rounded-full ${
                    parcela.pago
                      ? "bg-green-500"
                      : isParcelaParcial
                        ? "bg-purple-500"
                        : isAtrasada
                          ? "bg-red-500"
                          : "bg-orange-500"
                  }`}></div>
                  <span className="font-medium text-foreground">Parcela {parcela.numero}</span>
                  {isParcelaParcial && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-semibold">
                      PARCIAL ({formatCurrency(valorPagoParcela)}€)
                    </span>
                  )}
                  {isAtrasada && !isParcelaParcial && (
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
                  <div className="flex flex-col items-center">
                    <span className="text-sm text-muted-foreground">
                      Pago em {formatDate(parcela.dataPago)}
                    </span>
                    <span className="text-xs text-green-600 font-medium">
                      Comissão: {formatCurrency(Number(parcela.valor) / 1.23 * 0.035)}€
                    </span>
                  </div>
                )}
              </td>
              <td className="px-4 py-3 text-center">
                <button
                  onClick={() => handleToggleParcelaPaid(parcela.id, parcela.pago, cobranca.id, valorPagoParcela)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${
                    parcela.pago
                      ? "bg-green-100 text-green-700 hover:bg-green-200"
                      : isParcelaParcial && isAtrasada
                        ? "bg-red-100 text-red-700 hover:bg-red-200"
                        : isParcelaParcial
                          ? "bg-purple-100 text-purple-700 hover:bg-purple-200"
                          : isAtrasada
                            ? "bg-red-100 text-red-700 hover:bg-red-200"
                            : "bg-orange-100 text-orange-700 hover:bg-orange-200"
                  }`}
                >
                  <span className="flex flex-col">
                    {parcela.pago ? "Pago" : isParcelaParcial ? "Pagamento" : "Marcar Pago"}
                    {isParcelaParcial && isAtrasada && <span className="text-xs">Atrasado</span>}
                  </span>
                </button>
              </td>
              <td className="px-4 py-3"></td>
            </tr>
          )
        })}
      </>
    )
  }

  return (
    <div>
      {/* Year Selector */}
      <div className="bg-card rounded-2xl shadow-sm p-3 md:p-4 mb-4 md:mb-6 border border-border">
        <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4">
          <div className="flex items-center gap-2 bg-secondary px-3 py-1.5 rounded-xl border border-border">
            <label className="text-xs md:text-sm font-semibold text-muted-foreground">Ano:</label>
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
              className="px-2 md:px-3 py-1.5 md:py-2 border-0 rounded-lg text-primary font-bold focus:ring-2 focus:ring-primary outline-none bg-card text-sm md:text-base"
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
        <div className="bg-white dark:bg-card rounded-2xl shadow-sm p-4 md:p-5 border-l-4 border-orange-500 border border-border">
          <div className="flex items-center gap-2 md:gap-3 mb-2">
            <div className="p-2 md:p-2.5 bg-orange-500/10 rounded-xl">
              <svg className="w-5 h-5 md:w-6 md:h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xs md:text-sm font-bold text-orange-600 uppercase tracking-wide">Pendente</h3>
          </div>
          <p className="text-xl md:text-3xl font-bold text-orange-600">{formatCurrency(totalPendente)} €</p>
          <p className="text-xs md:text-sm text-muted-foreground mt-1 hidden md:block">Por receber {ano ? `(${ano})` : ""}</p>
        </div>
        <div className="bg-white dark:bg-card rounded-2xl shadow-sm p-4 md:p-5 border-l-4 border-green-500 border border-border">
          <div className="flex items-center gap-2 md:gap-3 mb-2">
            <div className="p-2 md:p-2.5 bg-green-500/10 rounded-xl">
              <svg className="w-5 h-5 md:w-6 md:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xs md:text-sm font-bold text-green-600 uppercase tracking-wide">Pago</h3>
          </div>
          <p className="text-xl md:text-3xl font-bold text-green-600">{formatCurrency(totalPago)} €</p>
          <div className="text-xs text-muted-foreground mt-1 hidden md:flex md:gap-2">
            <span>Este mês: {formatCurrency(pagoEsteMes)}€</span>
            <span>•</span>
            <span>Mês passado: {formatCurrency(pagoMesPassado)}€</span>
          </div>
        </div>
        <div className="bg-white dark:bg-card rounded-2xl shadow-sm p-4 md:p-5 border-l-4 border-primary border border-border">
          <div className="flex items-center gap-2 md:gap-3 mb-2">
            <div className="p-2 md:p-2.5 bg-primary/10 rounded-xl">
              <svg className="w-5 h-5 md:w-6 md:h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xs md:text-sm font-bold text-primary uppercase tracking-wide">Comissões</h3>
          </div>
          <p className="text-xl md:text-3xl font-bold text-primary">{formatCurrency(comissoesGanhasMesAtual)} €</p>
          <p className="text-xs md:text-sm text-muted-foreground mt-1 hidden md:block">Ganhas este mês</p>
        </div>
        {totalAtrasadas > 0 && (
          <div className="bg-white dark:bg-card rounded-2xl shadow-sm p-4 md:p-5 border-l-4 border-red-500 border border-border col-span-2 md:col-span-1 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 md:gap-3 mb-2">
              <div className="p-2 md:p-2.5 bg-red-500/15 rounded-xl">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xs md:text-sm font-bold text-red-600 uppercase tracking-wide">Em Atraso</h3>
            </div>
            <p className="text-xl md:text-3xl font-bold text-red-600">{formatCurrency(valorEmAtraso)} €</p>
            <p className="text-xs md:text-sm text-muted-foreground mt-1 hidden md:block">{totalAtrasadas} parcela{totalAtrasadas !== 1 ? "s" : ""} atrasada{totalAtrasadas !== 1 ? "s" : ""}</p>
          </div>
        )}
      </div>

      {/* Commission Breakdown by Document Type */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 md:mb-6">
        {/* Faturas Commission Card */}
        <div
          className={`bg-white dark:bg-card rounded-2xl shadow-sm p-4 md:p-5 border-2 transition-all cursor-pointer ${
            filterTipoDoc === "FATURA"
              ? "border-blue-500 shadow-lg shadow-blue-500/10"
              : "border-border hover:border-blue-300"
          }`}
          onClick={() => setFilterTipoDoc(filterTipoDoc === "FATURA" ? "all" : "FATURA")}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-blue-500/10 rounded-xl">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wide">Comissões Faturas</h3>
              <p className="text-xs text-muted-foreground">{comissoesPorTipo.faturas.count} cobranças</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-green-500/5 rounded-lg p-2.5">
              <p className="text-xs text-muted-foreground">Ganhas</p>
              <p className="text-lg font-bold text-green-600">{formatCurrency(comissoesPorTipo.faturas.ganha)} €</p>
            </div>
            <div className="bg-orange-500/5 rounded-lg p-2.5">
              <p className="text-xs text-muted-foreground">Pendentes</p>
              <p className="text-lg font-bold text-orange-600">{formatCurrency(comissoesPorTipo.faturas.pendente)} €</p>
            </div>
          </div>
          {filterTipoDoc === "FATURA" && (
            <div className="mt-3 pt-2 border-t border-blue-200 text-xs text-blue-600 font-medium">
              A mostrar apenas faturas
            </div>
          )}
        </div>

        {/* C.I. Commission Card */}
        <div
          className={`bg-white dark:bg-card rounded-2xl shadow-sm p-4 md:p-5 border-2 transition-all cursor-pointer ${
            filterTipoDoc === "CI"
              ? "border-orange-500 shadow-lg shadow-orange-500/10"
              : "border-border hover:border-orange-300"
          }`}
          onClick={() => setFilterTipoDoc(filterTipoDoc === "CI" ? "all" : "CI")}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-orange-500/10 rounded-xl">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-orange-600 uppercase tracking-wide">Comissões C.I.</h3>
              <p className="text-xs text-muted-foreground">{comissoesPorTipo.ci.count} cobranças</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-green-500/5 rounded-lg p-2.5">
              <p className="text-xs text-muted-foreground">Ganhas</p>
              <p className="text-lg font-bold text-green-600">{formatCurrency(comissoesPorTipo.ci.ganha)} €</p>
            </div>
            <div className="bg-orange-500/5 rounded-lg p-2.5">
              <p className="text-xs text-muted-foreground">Pendentes</p>
              <p className="text-lg font-bold text-orange-600">{formatCurrency(comissoesPorTipo.ci.pendente)} €</p>
            </div>
          </div>
          {filterTipoDoc === "CI" && (
            <div className="mt-3 pt-2 border-t border-orange-200 text-xs text-orange-600 font-medium">
              A mostrar apenas C.I.
            </div>
          )}
        </div>
      </div>

      {/* Filter Status Bar */}
      {filterTipoDoc !== "all" && (
        <div className={`flex items-center justify-between px-4 py-3 rounded-xl mb-4 ${
          filterTipoDoc === "FATURA" ? "bg-blue-500/10" : "bg-orange-500/10"
        }`}>
          <span className={`font-medium ${filterTipoDoc === "FATURA" ? "text-blue-700" : "text-orange-700"}`}>
            {filterTipoDoc === "FATURA" ? "A mostrar apenas Faturas" : "A mostrar apenas Consumo Interno (C.I.)"}
          </span>
          <button
            onClick={() => setFilterTipoDoc("all")}
            className={`px-3 py-1 rounded-lg text-sm font-medium ${
              filterTipoDoc === "FATURA"
                ? "bg-blue-500/20 text-blue-700 hover:bg-blue-500/30"
                : "bg-orange-500/20 text-orange-700 hover:bg-orange-500/30"
            }`}
          >
            Mostrar Todos
          </button>
        </div>
      )}

      {/* AI Risk Analysis */}
      <div className="mb-4">
        <CobrancaAIRisk />
      </div>
      {/* Search, Filter, Sort Controls */}
      <div className="bg-card rounded-xl shadow-sm p-4 mb-4 border border-border space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Pesquisar por cliente, fatura ou notas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-primary outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap gap-2 items-center">
          {/* Status Filter */}
          <div className="flex gap-1 flex-wrap">
            {[
              { value: "pending", label: "Pendentes", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
              { value: "paid", label: "Pagas", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
              { value: "overdue", label: "Atrasadas", icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" },
              { value: "all", label: "Todas", icon: "M4 6h16M4 10h16M4 14h16M4 18h16" }
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value as typeof filter)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition text-sm ${
                  filter === f.value
                    ? f.value === "overdue"
                      ? "bg-red-600 text-white"
                      : "bg-primary text-primary-foreground"
                    : "bg-secondary text-foreground hover:bg-muted"
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={f.icon} />
                </svg>
                {f.label}
                {f.value === "overdue" && totalAtrasadas > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    filter === "overdue" ? "bg-white/20" : "bg-red-100 text-red-700"
                  }`}>
                    {totalAtrasadas}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="h-6 w-px bg-border hidden sm:block" />

          {/* Month Filter */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-1.5 border border-border rounded-lg bg-card text-sm focus:ring-2 focus:ring-primary outline-none"
          >
            <option value="">Todos os meses</option>
            {availableMonths.map((m) => (
              <option key={m} value={m}>{getMonthLabel(m)}</option>
            ))}
          </select>

          {/* Client Filter */}
          <select
            value={selectedCliente}
            onChange={(e) => setSelectedCliente(e.target.value)}
            className="px-3 py-1.5 border border-border rounded-lg bg-card text-sm focus:ring-2 focus:ring-primary outline-none"
          >
            <option value="">Todos os clientes</option>
            {clientesComCobrancas.map((c) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>

          {/* Sort Dropdown */}
          <select
            value={`${sortField}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split("-") as [SortField, SortOrder]
              setSortField(field)
              setSortOrder(order)
            }}
            className="px-3 py-1.5 border border-border rounded-lg bg-card text-sm focus:ring-2 focus:ring-primary outline-none"
          >
            <option value="cliente-asc">Cliente A-Z</option>
            <option value="cliente-desc">Cliente Z-A</option>
            <option value="valor-desc">Valor (maior)</option>
            <option value="valor-asc">Valor (menor)</option>
            <option value="dataEmissao-desc">Data (recente)</option>
            <option value="dataEmissao-asc">Data (antiga)</option>
            <option value="fatura-asc">Fatura A-Z</option>
          </select>

          {/* Clear Filters */}
          {(searchQuery || selectedCliente || selectedMonth || filter !== "pending" || sortField !== "cliente") && (
            <button
              onClick={clearFilters}
              className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Limpar
            </button>
          )}

          {/* Results count */}
          <span className="text-sm text-muted-foreground ml-auto">
            {filtered.length} {filtered.length === 1 ? "resultado" : "resultados"}
          </span>
        </div>

        {/* View Toggle and Month Controls */}
        <div className="flex flex-wrap gap-2 items-center pt-2 border-t border-border">
          <span className="text-sm font-medium text-muted-foreground">Vista:</span>
          <button
            onClick={() => setGroupByMonth(true)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
              groupByMonth ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground hover:bg-muted"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Por Mes
          </button>
          <button
            onClick={() => setGroupByMonth(false)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
              !groupByMonth ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground hover:bg-muted"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            Lista
          </button>

          {groupByMonth && (
            <>
              <div className="h-6 w-px bg-border hidden sm:block" />
              <button
                onClick={expandAllMonths}
                className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                Expandir todos
              </button>
              <button
                onClick={collapseAllMonths}
                className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
                Recolher todos
              </button>
            </>
          )}
        </div>
      </div>

      {/* Add Button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => { setShowForm(true); setEditingId(null); resetForm(); setShowModal(false); }}
          className="bg-primary text-white px-4 md:px-6 py-2.5 md:py-3 rounded-xl font-semibold hover:bg-primary-hover transition flex items-center justify-center gap-2 shadow-lg shadow-primary/20 text-sm md:text-base"
        >
          <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="hidden sm:inline">Adicionar Cobranca</span>
          <span className="sm:hidden">Nova</span>
        </button>
      </div>

      {/* Add Form (inline for new cobrancas) */}
      {showForm && !showModal && (
        <div className="bg-card rounded-xl shadow-sm p-4 md:p-6 mb-4 md:mb-6 border-2 border-primary/20">
          <h3 className="text-lg md:text-xl font-bold text-foreground mb-4 md:mb-6 flex items-center gap-2">
            <svg className="w-5 h-5 md:w-6 md:h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Nova Cobranca
          </h3>
          <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
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
                    value={editingCobranca?.valor ? String(editingCobranca.valor) : valorTotal}
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

            {/* Installment Options */}
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

              {!tipoParcelado && (
                <div className="bg-secondary/50 rounded-xl p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-foreground mb-2">Prazo de Vencimento</label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setPrazoVencimento(4)}
                        className={`flex-1 py-2 px-4 rounded-lg font-medium transition border-2 ${
                          prazoVencimento === 4
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-card text-foreground border-border hover:bg-secondary"
                        }`}
                      >
                        4 dias
                      </button>
                      <button
                        type="button"
                        onClick={() => setPrazoVencimento(30)}
                        className={`flex-1 py-2 px-4 rounded-lg font-medium transition border-2 ${
                          prazoVencimento === 30
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-card text-foreground border-border hover:bg-secondary"
                        }`}
                      >
                        30 dias
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      O pagamento sera considerado em atraso apos {prazoVencimento} dias da data de emissao.
                    </p>
                  </div>
                </div>
              )}

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
                onClick={closeModal}
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

      {/* Edit Modal */}
      {showModal && editingCobranca && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-card border-b border-border p-4 md:p-6 flex items-center justify-between">
              <h3 className="text-lg md:text-xl font-bold text-foreground flex items-center gap-2">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Editar Cobranca
              </h3>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-secondary rounded-lg transition"
              >
                <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-foreground mb-2">Cliente *</label>
                  <select
                    name="clienteId"
                    required
                    defaultValue={editingCobranca.clienteId}
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
                    defaultValue={editingCobranca.fatura || ""}
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
                    defaultValue={editingCobranca.dataEmissao ? new Date(editingCobranca.dataEmissao).toISOString().split("T")[0] : ""}
                    className="w-full px-4 py-3 border-2 border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none text-foreground font-medium bg-card"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-foreground mb-2">Notas</label>
                  <input
                    name="notas"
                    type="text"
                    defaultValue={editingCobranca.notas || ""}
                    className="w-full px-4 py-3 border-2 border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none text-foreground font-medium bg-card"
                    placeholder="Notas adicionais..."
                  />
                </div>
              </div>

              {/* Parcelas Section */}
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

                {!tipoParcelado && (
                  <div className="bg-secondary/50 rounded-xl p-4 space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-foreground mb-2">Prazo de Vencimento</label>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setPrazoVencimento(4)}
                          className={`flex-1 py-2 px-4 rounded-lg font-medium transition border-2 ${
                            prazoVencimento === 4
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-card text-foreground border-border hover:bg-secondary"
                          }`}
                        >
                          4 dias
                        </button>
                        <button
                          type="button"
                          onClick={() => setPrazoVencimento(30)}
                          className={`flex-1 py-2 px-4 rounded-lg font-medium transition border-2 ${
                            prazoVencimento === 30
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-card text-foreground border-border hover:bg-secondary"
                          }`}
                        >
                          30 dias
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        O pagamento será considerado em atraso após {prazoVencimento} dias da data de emissão.
                      </p>
                    </div>
                  </div>
                )}

                {tipoParcelado && (
                  <div className="bg-secondary/50 rounded-xl p-4 space-y-4">
                    {editingCobranca.parcelas.length > 0 && (
                      <div className="bg-orange-100 dark:bg-orange-900/20 border border-orange-300 dark:border-orange-700 rounded-lg p-3 mb-4">
                        <p className="text-sm text-black dark:text-white font-medium">
                          <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          Esta cobranca tem {editingCobranca.parcelas.length} parcelas existentes. Alterar o numero de parcelas ira regenerar todas as parcelas (parcelas pagas serao perdidas).
                        </p>
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-foreground mb-2">Numero de Parcelas *</label>
                        <select
                          value={numeroParcelas}
                          onChange={(e) => setNumeroParcelas(parseInt(e.target.value))}
                          className="w-full px-4 py-3 border-2 border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none text-foreground font-medium bg-card"
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                            <option key={n} value={n}>{n} parcela{n > 1 ? "s" : ""}</option>
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

                    {valorTotal && dataInicioVencimento && (
                      <div className="mt-4">
                        <h4 className="text-sm font-bold text-foreground mb-2">Pre-visualizacao das Parcelas:</h4>
                        <div className="bg-card rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
                          {Array.from({ length: numeroParcelas }, (_, i) => {
                            const date = new Date(dataInicioVencimento)
                            date.setMonth(date.getMonth() + i)
                            return (
                              <div key={i} className="flex justify-between items-center text-sm py-1 border-b border-border last:border-0">
                                <span className="font-medium text-foreground">Parcela {i + 1}</span>
                                <span className="text-muted-foreground">
                                  {formatCurrency(parseFloat(valorTotal) / numeroParcelas)} € - {date.toLocaleDateString("pt-PT")}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4 border-t border-border">
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
                      Guardar Alteracoes
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
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
        </div>
      )}

      {/* Cobrancas Display */}
      {groupByMonth ? (
        /* Grouped by Month View */
        <div className="space-y-4">
          {groupedByMonth.map((group) => {
            const isMonthExpanded = expandedMonths.has(group.monthKey)
            return (
              <div key={group.monthKey} className="bg-card rounded-xl shadow-sm overflow-hidden border border-border">
                {/* Month Header */}
                <button
                  onClick={() => toggleMonthExpanded(group.monthKey)}
                  className="w-full px-4 py-4 flex items-center justify-between bg-secondary hover:bg-muted transition"
                >
                  <div className="flex items-center gap-3">
                    <svg
                      className={`w-5 h-5 text-muted-foreground transition-transform ${isMonthExpanded ? "rotate-90" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-lg font-bold text-foreground">{group.monthLabel}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">({group.cobrancas.length} cobranca{group.cobrancas.length !== 1 ? "s" : ""})</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-orange-600 font-semibold">Pendente: {formatCurrency(group.totalPendente)}€</span>
                      <span className="text-muted-foreground">|</span>
                      <span className="text-green-600 font-semibold">Pago: {formatCurrency(group.totalPago)}€</span>
                      <span className="text-muted-foreground">|</span>
                      <span className="text-primary font-semibold">Comissão Ganha: {formatCurrency(group.comissaoGanha)}€</span>
                    </div>
                  </div>
                </button>

                {/* Month Content */}
                {isMonthExpanded && (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-secondary/50 border-b border-border">
                        <tr>
                          <th className="px-2 py-3 text-left text-sm font-bold text-foreground w-8"></th>
                          <th 
                            className="px-4 py-3 text-left text-sm font-bold text-foreground cursor-pointer hover:text-primary"
                            onClick={() => handleSort("cliente")}
                          >
                            Cliente <SortIcon field="cliente" />
                          </th>
                          <th 
                            className="px-4 py-3 text-left text-sm font-bold text-foreground cursor-pointer hover:text-primary"
                            onClick={() => handleSort("fatura")}
                          >
                            Fatura <SortIcon field="fatura" />
                          </th>
                          <th 
                            className="px-4 py-3 text-right text-sm font-bold text-foreground cursor-pointer hover:text-primary"
                            onClick={() => handleSort("valor")}
                          >
                            Valor c/IVA <SortIcon field="valor" />
                          </th>
                          <th className="px-4 py-3 text-right text-sm font-bold text-foreground">Sem IVA</th>
                          <th className="px-4 py-3 text-right text-sm font-bold text-primary">Comissao</th>
                          <th className="px-4 py-3 text-center text-sm font-bold text-foreground">Parcelas</th>
                          <th className="px-4 py-3 text-center text-sm font-bold text-foreground">Estado</th>
                          <th className="px-4 py-3 text-center text-sm font-bold text-foreground">Acoes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {group.cobrancas.map((cobranca) => renderCobrancaRow(cobranca))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })}

          {groupedByMonth.length === 0 && (
            <div className="bg-card rounded-xl shadow-sm p-16 text-center border border-border">
              <svg className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-muted-foreground text-lg font-medium">
                {searchQuery || selectedCliente || selectedMonth ? "Nenhuma cobranca encontrada com esses filtros" : "Nenhuma cobranca encontrada"}
              </p>
              {(searchQuery || selectedCliente || selectedMonth) && (
                <button
                  onClick={clearFilters}
                  className="mt-2 text-primary hover:underline text-sm"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Flat List View */
        <div className="bg-card rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary border-b-2 border-border">
                <tr>
                  <th className="px-2 py-4 text-left text-sm font-bold text-foreground w-8"></th>
                  <th 
                    className="px-4 py-4 text-left text-sm font-bold text-foreground cursor-pointer hover:text-primary"
                    onClick={() => handleSort("cliente")}
                  >
                    Cliente <SortIcon field="cliente" />
                  </th>
                  <th 
                    className="px-4 py-4 text-left text-sm font-bold text-foreground cursor-pointer hover:text-primary"
                    onClick={() => handleSort("fatura")}
                  >
                    Fatura <SortIcon field="fatura" />
                  </th>
                  <th 
                    className="px-4 py-4 text-right text-sm font-bold text-foreground cursor-pointer hover:text-primary"
                    onClick={() => handleSort("valor")}
                  >
                    Valor c/IVA <SortIcon field="valor" />
                  </th>
                  <th className="px-4 py-4 text-right text-sm font-bold text-foreground">Sem IVA</th>
                  <th className="px-4 py-4 text-right text-sm font-bold text-primary">Comissao</th>
                  <th className="px-4 py-4 text-center text-sm font-bold text-foreground">Parcelas</th>
                  <th className="px-4 py-4 text-center text-sm font-bold text-foreground">Estado</th>
                  <th className="px-4 py-4 text-center text-sm font-bold text-foreground">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((cobranca) => renderCobrancaRow(cobranca))}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-16">
              <svg className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-muted-foreground text-lg font-medium">
                {searchQuery || selectedCliente || selectedMonth ? "Nenhuma cobranca encontrada com esses filtros" : "Nenhuma cobranca encontrada"}
              </p>
              {(searchQuery || selectedCliente || selectedMonth) && (
                <button
                  onClick={clearFilters}
                  className="mt-2 text-primary hover:underline text-sm"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
