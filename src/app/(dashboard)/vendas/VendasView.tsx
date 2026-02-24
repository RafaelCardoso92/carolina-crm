"use client"
import VendasAITrends from "@/components/VendasAITrends"

import { useState, useEffect, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Swal from "sweetalert2"
import { formatCurrency } from "@/lib/utils"
import DevolucaoForm from "@/components/DevolucaoForm"
import DevolucaoList from "@/components/DevolucaoList"
import ProductPicker from "@/components/ProductPicker"
import type { DevolucaoWithRelations } from "@/types/devolucao"

type ItemDevolucaoRef = {
  id: string
  quantidade: unknown
}

type ItemVenda = {
  id: string
  produtoId: string
  quantidade: unknown
  precoUnit: unknown
  subtotal: unknown
  produto: {
    id: string
    nome: string
    codigo: string | null
  }
  devolucoes?: ItemDevolucaoRef[]
}

type ObjetivoVario = {
  id: string
  titulo: string
  mes: number
  ano: number
}

type Campanha = {
  id: string
  titulo: string
  mes: number
  ano: number
}

type Venda = {
  id: string
  clienteId: string
  objetivoVarioId: string | null
  objetivoVarioValor: number | null
  valor1: unknown
  valor2: unknown
  total: unknown
  mes: number
  ano: number
  notas: string | null
  tipoDocumento: "FATURA" | "CONSUMO_INTERNO"
  cliente: {
    id: string
    nome: string
    codigo: string | null
  }
  objetivoVario?: {
    id: string
    titulo: string
  } | null
  campanhas?: {
    id: string
    quantidade: number
    campanha: {
      id: string
      titulo: string
    }
  }[]
  itens?: ItemVenda[]
  devolucoes?: DevolucaoWithRelations[]
  incidencias?: {
    id: string
    valor: number
    motivo: string
    notas: string | null
    dataRegisto: string
  }[]
  cobranca?: {
    id: string
    valor: number
    pago: boolean
  } | null
}

type Cliente = {
  id: string
  nome: string
  codigo: string | null
}

type ProdutoItem = {
  id: string
  nome: string
  codigo: string | null
  categoria: string | null
  preco: string | null
}

type FormItem = {
  produtoId: string
  quantidade: string
  precoUnit: string
}

type Props = {
  vendas: Venda[]
  clientes: Cliente[]
  produtos: ProdutoItem[]
  objetivosVarios: ObjetivoVario[]
  campanhas: Campanha[]
  objetivo: number | null
  total: number
  mes: number
  ano: number
  meses: string[]
}

// VAT rate in Portugal
const IVA_RATE = 0.23

// Calculate VAT values from ex-VAT total
function calcularIVA(totalSemIVA: number) {
  const iva = totalSemIVA * IVA_RATE
  const comIVA = totalSemIVA + iva
  return { semIVA: totalSemIVA, iva, comIVA }
}

// Calculate net total for a venda (accounting for returns)
function calcularTotalLiquido(venda: Venda): number {
  const vendaTotal = Number(venda.total)
  
  const totalDevolvido = venda.devolucoes?.reduce((sum, d) => sum + Number(d.totalDevolvido), 0) || 0
  const totalSubstituido = venda.devolucoes?.reduce((sum, d) => sum + Number(d.totalSubstituido), 0) || 0
  const totalIncidencias = venda.incidencias?.reduce((sum, inc) => sum + Number(inc.valor), 0) || 0

  return vendaTotal - totalDevolvido + totalSubstituido - totalIncidencias
}

export default function VendasView({ vendas: initialVendas, clientes, produtos, objetivosVarios, campanhas, objetivo, total, mes, ano, meses }: Props) {
  const router = useRouter()
  // Local state for vendas to ensure immediate UI updates
  const [vendas, setVendas] = useState(initialVendas)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Sync local state when props change (e.g., month navigation)
  useEffect(() => {
    setVendas(initialVendas)
  }, [initialVendas])
  const [selectedClienteId, setSelectedClienteId] = useState<string>("")
  const [clienteSearch, setClienteSearch] = useState("")
  const [showClienteDropdown, setShowClienteDropdown] = useState(false)
  const clienteDropdownRef = useRef<HTMLDivElement>(null)

  // Close cliente dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (clienteDropdownRef.current && !clienteDropdownRef.current.contains(event.target as Node)) {
        setShowClienteDropdown(false)
      }
    }
    if (showClienteDropdown) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showClienteDropdown])

  const [selectedObjetivoVarioId, setSelectedObjetivoVarioId] = useState<string>("")
  const [objetivoVarioValor, setObjetivoVarioValor] = useState<string>("")
  const [selectedCampanhas, setSelectedCampanhas] = useState<{ id: string; quantidade: number }[]>([])
  const [formItems, setFormItems] = useState<FormItem[]>([])
  const [useItems, setUseItems] = useState(false) // Default to manual value mode
  const [notas, setNotas] = useState("")
  const [valor1, setValor1] = useState("")
  const [valor2, setValor2] = useState("")
  const [tipoDocumento, setTipoDocumento] = useState<"FATURA" | "CONSUMO_INTERNO">("FATURA")

  // Cobranca state
  const [criarCobranca, setCriarCobranca] = useState(true)
  const [cobrancaParcelas, setCobrancaParcelas] = useState("1")
  const [cobrancaDataEmissao, setCobrancaDataEmissao] = useState("")

  // Returns state
  const [showDevolucaoForm, setShowDevolucaoForm] = useState(false)
  const [selectedVendaForDevolucao, setSelectedVendaForDevolucao] = useState<Venda | null>(null)
  const [expandedDevolucoes, setExpandedDevolucoes] = useState<string | null>(null)

  // Incidencias state
  const [showIncidenciaForm, setShowIncidenciaForm] = useState(false)
  const [selectedVendaForIncidencia, setSelectedVendaForIncidencia] = useState<Venda | null>(null)
  const [incidenciaValor, setIncidenciaValor] = useState("")
  const [incidenciaMotivo, setIncidenciaMotivo] = useState("")
  const [incidenciaNotas, setIncidenciaNotas] = useState("")

  // Calculate total liquido (accounting for returns)
  const totalLiquido = useMemo(() => {
    return vendas.reduce((sum, v) => sum + calcularTotalLiquido(v), 0)
  }, [vendas])

  const progresso = objetivo ? (totalLiquido / objetivo) * 100 : 0
  const falta = objetivo ? objetivo - totalLiquido : 0

  // Calculate totals with VAT (totalLiquido is ex-VAT)
  const { semIVA: totalSemIVA, iva: totalIVA, comIVA: totalComIVA } = calcularIVA(totalLiquido)

  // Calculate items total
  const itemsTotal = useMemo(() => {
    return formItems.reduce((sum, item) => {
      const qty = parseFloat(item.quantidade) || 0
      const price = parseFloat(item.precoUnit) || 0
      return sum + (qty * price)
    }, 0)
  }, [formItems])

  // Calculate manual values total
  const manualTotal = useMemo(() => {
    return parseFloat(valor1) || 0
  }, [valor1])

  // Get last prices from previous sales (fallback when product has no price)
  const lastPrices = useMemo(() => {
    const prices: Record<string, string> = {}
    vendas.forEach(v => {
      if (v.itens) {
        v.itens.forEach(item => {
          prices[item.produtoId] = String(Number(item.precoUnit))
        })
      }
    })
    return prices
  }, [vendas])

  // Get recently used product IDs (most frequently used in recent sales)
  const recentProductIds = useMemo(() => {
    const productCounts: Record<string, number> = {}
    vendas.slice(0, 20).forEach(v => {
      if (v.itens) {
        v.itens.forEach(item => {
          productCounts[item.produtoId] = (productCounts[item.produtoId] || 0) + 1
        })
      }
    })
    // Sort by frequency and return top 8
    return Object.entries(productCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([id]) => id)
  }, [vendas])

  // Get client's purchase history for upsell suggestions
  const clientPurchaseHistory = useMemo(() => {
    if (!selectedClienteId) return { purchased: new Set<string>(), neverPurchased: [] as ProdutoItem[] }

    const purchasedProductIds = new Set<string>()
    vendas.forEach(v => {
      if (v.clienteId === selectedClienteId && v.itens) {
        v.itens.forEach(item => purchasedProductIds.add(item.produtoId))
      }
    })

    const neverPurchased = produtos.filter(p => !purchasedProductIds.has(p.id))

    return { purchased: purchasedProductIds, neverPurchased }
  }, [selectedClienteId, vendas, produtos])

  // Products with fallback prices for ProductPicker
  const produtosWithPrices = useMemo(() => {
    return produtos.map(p => ({
      ...p,
      preco: p.preco || lastPrices[p.id] || null
    }))
  }, [produtos, lastPrices])

  // Filtered clients for search
  const filteredClientes = useMemo(() => {
    if (!clienteSearch.trim()) return clientes
    const search = clienteSearch.toLowerCase()
    return clientes.filter(c =>
      c.nome.toLowerCase().includes(search) ||
      (c.codigo && c.codigo.toLowerCase().includes(search))
    )
  }, [clientes, clienteSearch])

  // Reset form when closing modal
  function resetForm() {
    setSelectedClienteId("")
    setClienteSearch("")
    setShowClienteDropdown(false)
    setSelectedObjetivoVarioId("")
    setObjetivoVarioValor("")
    setSelectedCampanhas([])
    setFormItems([])
    setUseItems(false)
    setNotas("")
    setValor1("")
    setValor2("")
    setTipoDocumento("FATURA")
    setCriarCobranca(true)
    setCobrancaParcelas("1")
    setCobrancaDataEmissao("")
    setEditingId(null)
  }

  function closeModal() {
    setShowModal(false)
    resetForm()
  }

  function openNewSale() {
    resetForm()
    setFormItems([{ produtoId: "", quantidade: "1", precoUnit: "" }]) // Start with one empty item
    setShowModal(true)
  }

  function openEditSale(venda: Venda) {
    setEditingId(venda.id)
    setSelectedClienteId(venda.clienteId)
    setSelectedObjetivoVarioId(venda.objetivoVarioId || "")
    setObjetivoVarioValor(venda.objetivoVarioValor ? String(venda.objetivoVarioValor) : "")
    setSelectedCampanhas(venda.campanhas?.map(c => ({ id: c.campanha.id, quantidade: c.quantidade || 1 })) || [])
    setNotas(venda.notas || "")
    setTipoDocumento(venda.tipoDocumento || "FATURA")

    if (venda.itens && venda.itens.length > 0) {
      setUseItems(true)
      setFormItems(venda.itens.map(item => ({
        produtoId: item.produtoId,
        quantidade: String(Number(item.quantidade)),
        precoUnit: String(Number(item.precoUnit))
      })))
      setValor1("")
      setValor2("")
    } else {
      setUseItems(false)
      setFormItems([])
      setValor1(venda.valor1 ? String(venda.valor1) : "")
      setValor2(venda.valor2 ? String(venda.valor2) : "")
    }

    setShowModal(true)
  }

  function addItem() {
    setFormItems([...formItems, { produtoId: "", quantidade: "1", precoUnit: "" }])
  }

  function removeItem(index: number) {
    setFormItems(formItems.filter((_, i) => i !== index))
  }

  function updateItem(index: number, field: keyof FormItem, value: string, price?: string | null) {
    const updated = [...formItems]
    updated[index] = { ...updated[index], [field]: value }

    // Auto-fill price when product is selected (only if price is empty)
    if (field === "produtoId" && value && !updated[index].precoUnit) {
      if (price) {
        updated[index].precoUnit = price
      } else {
        const produto = produtos.find(p => p.id === value)
        if (produto?.preco) {
          updated[index].precoUnit = produto.preco
        } else if (lastPrices[value]) {
          updated[index].precoUnit = lastPrices[value]
        }
      }
    }

    setFormItems(updated)
  }

  function navigateMonth(direction: number) {
    let newMes = mes + direction
    let newAno = ano

    if (newMes < 1) {
      newMes = 12
      newAno--
    } else if (newMes > 12) {
      newMes = 1
      newAno++
    }

    router.push(`/vendas?mes=${newMes}&ano=${newAno}`)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    // Build items array if using items mode
    const itens = useItems ? formItems
      .filter(item => item.produtoId && item.quantidade && item.precoUnit)
      .map(item => ({
        produtoId: item.produtoId,
        quantidade: parseFloat(item.quantidade),
        precoUnit: parseFloat(item.precoUnit)
      })) : []

    const data = {
      clienteId: selectedClienteId,
      tipoDocumento,
      objetivoVarioId: selectedObjetivoVarioId || null,
      objetivoVarioValor: selectedObjetivoVarioId && objetivoVarioValor ? parseFloat(objetivoVarioValor) : null,
      campanhas: selectedCampanhas.length > 0 ? selectedCampanhas : null,
      valor1: !useItems && valor1 ? parseFloat(valor1) : null,
      valor2: null,
      notas: notas || null,
      itens,
      mes,
      ano,
      // Cobranca data - for new vendas or editing vendas without cobranca
      criarCobranca: criarCobranca && (!editingId || !vendas.find(v => v.id === editingId)?.cobranca),
      cobranca: criarCobranca && (!editingId || !vendas.find(v => v.id === editingId)?.cobranca) ? {
        numeroParcelas: parseInt(cobrancaParcelas) || 1,
        dataEmissao: cobrancaDataEmissao || null,
        incluirObjetivoVario: selectedObjetivoVarioId && objetivoVarioValor ? true : false
      } : null
    }

    try {
      const url = editingId ? `/api/vendas/${editingId}` : "/api/vendas"
      const method = editingId ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })

      if (res.ok) {
        const updatedVenda = await res.json()
        // Update local state immediately
        if (editingId) {
          setVendas(prev => prev.map(v => v.id === editingId ? updatedVenda : v))
        } else {
          setVendas(prev => [...prev, updatedVenda])
        }
        closeModal()
        router.refresh() // Backup sync with server
        Swal.fire({
          icon: "success",
          title: editingId ? "Venda atualizada" : "Venda criada",
          text: editingId ? "A venda foi atualizada com sucesso." : "A venda foi criada com sucesso.",
          confirmButtonColor: "#b8860b",
          timer: 2000
        })
      } else {
        const error = await res.json()
        Swal.fire({
          icon: "error",
          title: "Erro",
          text: error.error || "Erro ao guardar venda",
          confirmButtonColor: "#b8860b"
        })
      }
    } catch {
      Swal.fire({
        icon: "error",
        title: "Erro",
        text: "Erro ao guardar venda",
        confirmButtonColor: "#b8860b"
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    const result = await Swal.fire({
      title: "Eliminar venda?",
      text: "Tem a certeza que quer eliminar esta venda?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#c41e3a",
      cancelButtonColor: "#666666",
      confirmButtonText: "Sim, eliminar",
      cancelButtonText: "Cancelar"
    })

    if (!result.isConfirmed) return

    try {
      const res = await fetch(`/api/vendas/${id}`, { method: "DELETE" })
      if (res.ok) {
        // Update local state immediately
        setVendas(prev => prev.filter(v => v.id !== id))
        router.refresh() // Backup sync with server
        Swal.fire({
          icon: "success",
          title: "Venda eliminada",
          text: "A venda foi eliminada com sucesso.",
          confirmButtonColor: "#b8860b",
          timer: 2000
        })
      } else {
        Swal.fire({
          icon: "error",
          title: "Erro",
          text: "Erro ao eliminar venda",
          confirmButtonColor: "#b8860b"
        })
      }
    } catch {
      Swal.fire({
        icon: "error",
        title: "Erro",
        text: "Erro ao eliminar venda",
        confirmButtonColor: "#b8860b"
      })
    }
  }

  // Returns handlers
  function openDevolucaoForm(venda: Venda) {
    setSelectedVendaForDevolucao(venda)
    setShowDevolucaoForm(true)
  }

  function closeDevolucaoForm() {
    setSelectedVendaForDevolucao(null)
    setShowDevolucaoForm(false)
  }

  function openIncidenciaForm(venda: Venda) {
    setSelectedVendaForIncidencia(venda)
    setIncidenciaValor("")
    setIncidenciaMotivo("")
    setIncidenciaNotas("")
    setShowIncidenciaForm(true)
  }

  function closeIncidenciaForm() {
    setSelectedVendaForIncidencia(null)
    setShowIncidenciaForm(false)
    setIncidenciaValor("")
    setIncidenciaMotivo("")
    setIncidenciaNotas("")
  }

  async function handleIncidenciaSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedVendaForIncidencia) return

    try {
      const res = await fetch("/api/incidencias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendaId: selectedVendaForIncidencia.id,
          valor: parseFloat(incidenciaValor),
          motivo: incidenciaMotivo,
          notas: incidenciaNotas || null
        })
      })

      if (!res.ok) throw new Error("Falha ao criar incidencia")

      closeIncidenciaForm()
      refetchVendas()
      Swal.fire({
        icon: "success",
        title: "Incidencia registada",
        text: "A incidencia foi registada com sucesso.",
        confirmButtonColor: "#b8860b",
        timer: 2000,
        showConfirmButton: false
      })
    } catch (error) {
      console.error("Error creating incidencia:", error)
      Swal.fire({
        icon: "error",
        title: "Erro",
        text: "Nao foi possivel registar a incidencia.",
        confirmButtonColor: "#b8860b"
      })
    }
  }

  async function handleDeleteIncidencia(incidenciaId: string) {
    const result = await Swal.fire({
      title: "Eliminar Incidencia?",
      text: "Esta acao nao pode ser revertida.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sim, eliminar",
      cancelButtonText: "Cancelar"
    })

    if (!result.isConfirmed) return

    try {
      const res = await fetch(`/api/incidencias/${incidenciaId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Falha ao eliminar")

      refetchVendas()
      Swal.fire({
        icon: "success",
        title: "Eliminada",
        text: "A incidencia foi eliminada.",
        confirmButtonColor: "#b8860b",
        timer: 1500,
        showConfirmButton: false
      })
    } catch (error) {
      console.error("Error deleting incidencia:", error)
      Swal.fire({
        icon: "error",
        title: "Erro",
        text: "Nao foi possivel eliminar a incidencia.",
        confirmButtonColor: "#b8860b"
      })
    }
  }


  // Refetch vendas from API (for complex updates like devolucoes)
  async function refetchVendas() {
    try {
      const res = await fetch(`/api/vendas?mes=${mes}&ano=${ano}`)
      if (res.ok) {
        const data = await res.json()
        setVendas(data)
      }
    } catch (err) {
      console.error("Error refetching vendas:", err)
    }
    router.refresh() // Backup sync
  }

  function handleDevolucaoSuccess() {
    closeDevolucaoForm()
    refetchVendas()
    Swal.fire({
      icon: "success",
      title: "Devolucao registada",
      text: "A devolucao foi registada com sucesso.",
      confirmButtonColor: "#b8860b",
      timer: 2000
    })
  }

  async function handleDevolucaoStatusChange(devolucaoId: string, estado: "PENDENTE" | "PROCESSADA" | "CANCELADA") {
    try {
      const res = await fetch(`/api/devolucoes/${devolucaoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado })
      })
      if (res.ok) {
        refetchVendas()
      }
    } catch (err) {
      console.error("Error updating devolucao status:", err)
    }
  }

  async function handleDevolucaoDelete(devolucaoId: string) {
    const result = await Swal.fire({
      title: "Eliminar devolucao?",
      text: "Tem a certeza que quer eliminar esta devolucao?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#c41e3a",
      cancelButtonColor: "#666666",
      confirmButtonText: "Sim, eliminar",
      cancelButtonText: "Cancelar"
    })

    if (!result.isConfirmed) return

    try {
      const res = await fetch(`/api/devolucoes/${devolucaoId}`, { method: "DELETE" })
      if (res.ok) {
        refetchVendas()
        Swal.fire({
          icon: "success",
          title: "Devolucao eliminada",
          text: "A devolucao foi eliminada com sucesso.",
          confirmButtonColor: "#b8860b",
          timer: 2000
        })
      }
    } catch (err) {
      console.error("Error deleting devolucao:", err)
    }
  }

  // Prepare items for devolucao form
  function prepareItensParaDevolucao(venda: Venda) {
    if (!venda.itens) return []

    return venda.itens.map(item => {
      const quantidadeDevolvida = (item.devolucoes || []).reduce(
        (sum, d) => sum + Number(d.quantidade),
        0
      )
      const quantidadeDisponivel = Number(item.quantidade) - quantidadeDevolvida

      return {
        id: item.id,
        produtoId: item.produtoId,
        produto: item.produto,
        quantidade: Number(item.quantidade),
        precoUnit: Number(item.precoUnit),
        subtotal: Number(item.subtotal),
        quantidadeDevolvida,
        quantidadeDisponivel
      }
    })
  }

  const currentTotal = useItems ? itemsTotal : manualTotal

  return (
    <div>
      {/* Navigation and Summary */}
      <div className="bg-card rounded-2xl shadow-sm p-4 md:p-6 mb-6 border border-border">
        {/* Year and Month Selectors */}
        <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 mb-4 md:mb-6">
          <div className="flex items-center gap-2 bg-secondary px-3 py-1.5 rounded-xl border border-border">
            <label className="text-xs md:text-sm font-semibold text-muted-foreground">Ano:</label>
            <select
              value={ano}
              onChange={(e) => router.push(`/vendas?mes=${mes}&ano=${e.target.value}`)}
              className="px-2 md:px-3 py-1.5 md:py-2 border-0 rounded-lg text-primary font-bold focus:ring-2 focus:ring-primary outline-none bg-card text-sm md:text-base"
            >
              {[2023, 2024, 2025, 2026].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 bg-secondary px-3 py-1.5 rounded-xl border border-border">
            <label className="text-xs md:text-sm font-semibold text-muted-foreground">Mes:</label>
            <select
              value={mes}
              onChange={(e) => router.push(`/vendas?mes=${e.target.value}&ano=${ano}`)}
              className="px-2 md:px-3 py-1.5 md:py-2 border-0 rounded-lg text-primary font-bold focus:ring-2 focus:ring-primary outline-none bg-card text-sm md:text-base"
            >
              {meses.slice(1).map((m, i) => (
                <option key={i + 1} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Month Navigation with Arrows */}
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <button
            onClick={() => navigateMonth(-1)}
            className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2 bg-card hover:bg-primary/5 rounded-xl transition text-foreground font-medium text-sm md:text-base border border-border/50 hover:border-primary/30"
          >
            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">Anterior</span>
          </button>
          <div className="text-center">
            <h2 className="text-lg md:text-xl font-bold text-foreground tracking-tight">{meses[mes]} {ano}</h2>
          </div>
          <button
            onClick={() => navigateMonth(1)}
            className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2 bg-card hover:bg-primary/5 rounded-xl transition text-foreground font-medium text-sm md:text-base border border-border/50 hover:border-primary/30"
          >
            <span className="hidden sm:inline">Seguinte</span>
            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* VAT Summary Cards */}
        <div className="grid grid-cols-3 gap-2 md:gap-4 mb-4 md:mb-6">
          <div className="bg-secondary rounded-xl p-3 md:p-4 text-center border border-border">
            <p className="text-xs md:text-sm font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Sem IVA</p>
            <p className="text-base md:text-2xl font-bold text-foreground">{formatCurrency(totalSemIVA)} EUR</p>
          </div>
          <div className="bg-white dark:bg-card rounded-xl p-3 md:p-4 text-center border border-border">
            <p className="text-xs md:text-sm font-semibold text-blue-600 dark:text-blue-400 mb-1 uppercase tracking-wide">IVA (23%)</p>
            <p className="text-base md:text-2xl font-bold text-blue-700 dark:text-blue-300">{formatCurrency(totalIVA)} EUR</p>
          </div>
          <div className="bg-white dark:bg-card rounded-xl p-3 md:p-4 text-center border border-border">
            <p className="text-xs md:text-sm font-semibold text-primary mb-1 uppercase tracking-wide">c/IVA</p>
            <p className="text-base md:text-2xl font-bold text-primary">{formatCurrency(totalComIVA)} EUR</p>
          </div>
        </div>

        {/* Progress Bar */}
        {objetivo && (
          <div className={`rounded-xl p-4 border bg-white dark:bg-card border-border`}>
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium text-foreground">Objetivo: {formatCurrency(objetivo)} EUR</span>
              <span className={`font-bold ${progresso >= 100 ? "text-emerald-600" : "text-orange-600"}`}>
                {progresso >= 100 ? "Objetivo atingido!" : `Falta: ${formatCurrency(falta)} EUR`}
              </span>
            </div>
            <div className="w-full bg-muted/50 rounded-full h-4 overflow-hidden">
              <div
                className={`h-4 rounded-full transition-all duration-500 ${progresso >= 100 ? "bg-gradient-to-r from-emerald-500 to-green-500" : "bg-gradient-to-r from-primary to-primary/80"}`}
                style={{ width: `${Math.min(progresso, 100)}%` }}
              />
            </div>
            <p className="text-center mt-2 text-sm font-semibold text-muted-foreground">{progresso.toFixed(1)}% do objetivo</p>
          </div>
        )}
      </div>


      {/* AI Trends Analysis */}
      <div className="mb-6">
        <VendasAITrends />
      </div>
      {/* Add Sale Button */}
      <div className="flex justify-end mb-4 md:mb-6">
        <button
          onClick={openNewSale}
          className="bg-gradient-to-r from-primary to-primary/90 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-xl font-semibold hover:from-primary-hover hover:to-primary transition-all flex items-center gap-2 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 text-sm md:text-base"
        >
          <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="hidden sm:inline">Adicionar Venda</span>
          <span className="sm:hidden">Nova</span>
        </button>
      </div>

      {/* Sales Table - Desktop */}
      <div className="hidden md:block bg-card rounded-2xl shadow-sm overflow-hidden border border-border/50">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-secondary to-secondary/80 border-b border-border">
              <tr>
                <th className="px-4 lg:px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Cliente</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Produtos</th>
                <th className="px-4 py-4 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Sem IVA</th>
                <th className="px-4 py-4 text-right text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider hidden lg:table-cell">IVA</th>
                <th className="px-4 py-4 text-right text-xs font-bold text-primary uppercase tracking-wider">Total</th>
                <th className="px-4 py-4 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {vendas.map((venda) => {
                const vendaTotal = Number(venda.total)
                const netTotal = calcularTotalLiquido(venda)
                const { semIVA, iva, comIVA } = calcularIVA(netTotal)
                const vendaTotalComIVA = calcularIVA(vendaTotal).comIVA
                const hasItems = venda.itens && venda.itens.length > 0
                const hasDevolucoes = venda.devolucoes && venda.devolucoes.length > 0
                const hasItemsForReturn = hasItems && venda.itens!.some(item => {
                  const devolvido = (item.devolucoes || []).reduce((sum, d) => sum + Number(d.quantidade), 0)
                  return Number(item.quantidade) > devolvido
                })
                const isExpanded = expandedDevolucoes === venda.id

                return (
                  <>
                    <tr key={venda.id} className={`hover:bg-primary/5 transition cursor-pointer ${hasDevolucoes ? "bg-orange-50/30 dark:bg-orange-900/5" : ""}`} onClick={() => openEditSale(venda)}>
                      <td className="px-4 lg:px-6 py-4">
                        <div className="font-semibold text-foreground">
                          {venda.cliente.nome}
                        </div>
                        {venda.cliente.codigo && (
                          <span className="text-muted-foreground text-sm">({venda.cliente.codigo})</span>
                        )}
                        {hasDevolucoes && (
                          <span className="ml-2 px-1.5 py-0.5 text-xs font-medium bg-warning/10 text-warning rounded">
                            {venda.devolucoes!.length} dev.
                          </span>
                        )}
                        {venda.tipoDocumento === "CONSUMO_INTERNO" && (
                          <span className="ml-2 px-1.5 py-0.5 text-xs font-bold bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded">
                            C.I.
                          </span>
                        )}
                        {venda.objetivoVario && (
                          <div className="mt-1">
                            <span className="px-2 py-0.5 text-xs font-medium bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-full">
                              {venda.objetivoVario.titulo}
                              {venda.objetivoVarioValor && (
                                <span className="ml-1 font-bold">{formatCurrency(venda.objetivoVarioValor)} EUR</span>
                              )}
                            </span>
                          </div>
                        )}
                        {venda.campanhas && venda.campanhas.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {venda.campanhas.map((cv) => (
                              <span key={cv.id} className="px-2 py-0.5 text-xs font-medium bg-success/10 text-success rounded-full">
                                {cv.campanha.titulo}
                                {cv.quantidade > 1 && (
                                  <span className="ml-1 font-bold">x{cv.quantidade}</span>
                                )}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                        {hasItems ? (
                          <div className="space-y-1">
                            {venda.itens!.slice(0, 3).map((item, idx) => (
                              <div key={idx} className="text-sm">
                                <span className="font-medium text-foreground">{item.produto.nome}</span>
                                <span className="text-muted-foreground ml-1">
                                  ({Number(item.quantidade)} x {formatCurrency(Number(item.precoUnit))} EUR)
                                </span>
                              </div>
                            ))}
                            {venda.itens!.length > 3 && (
                              <div className="text-sm text-primary font-medium">+{venda.itens!.length - 3} mais</div>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            {venda.valor1 ? <div>{formatCurrency(Number(venda.valor1))} EUR</div> : <span>-</span>}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right text-muted-foreground font-medium hidden lg:table-cell">
                        {formatCurrency(semIVA)} EUR
                      </td>
                      <td className="px-4 py-4 text-right text-blue-600 font-medium hidden lg:table-cell">
                        {formatCurrency(iva)} EUR
                      </td>
                      <td className="px-4 py-4 text-right">
                        {hasDevolucoes ? (
                          <div>
                            <span className="text-sm text-muted-foreground line-through">{formatCurrency(vendaTotalComIVA)} EUR</span>
                            <br />
                            <span className="font-bold text-primary">{formatCurrency(comIVA)} EUR</span>
                          </div>
                        ) : (
                          <span className="font-bold text-primary">{formatCurrency(comIVA)} EUR</span>
                        )}
                      </td>
                      <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-center gap-1">
                          {hasDevolucoes && (
                            <button
                              onClick={() => setExpandedDevolucoes(isExpanded ? null : venda.id)}
                              className={`p-2 rounded-lg transition ${isExpanded ? "bg-warning/10 text-warning" : "text-warning hover:bg-warning/10"}`}
                              title="Ver devolucoes"
                            >
                              <svg className={`w-5 h-5 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          )}
                          {hasItemsForReturn && (
                            <button
                              onClick={() => openDevolucaoForm(venda)}
                              className="p-2 text-orange-600 hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded-lg transition"
                              title="Registar devolucao"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
                              </svg>
                            </button>
                          )}
                          <button
                            onClick={() => openIncidenciaForm(venda)}
                            className="p-2 text-purple-600 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition"
                            title="Registar incidencia"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => openEditSale(venda)}
                            className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition"
                            title="Editar"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(venda.id)}
                            className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition"
                            title="Eliminar"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && hasDevolucoes && (
                      <tr key={`${venda.id}-devolucoes`}>
                        <td colSpan={6} className="px-4 lg:px-6 py-4 bg-orange-50/50 dark:bg-orange-900/10">
                          <DevolucaoList
                            devolucoes={venda.devolucoes as DevolucaoWithRelations[]}
                            vendaTotal={vendaTotal}
                            onStatusChange={handleDevolucaoStatusChange}
                            onDelete={handleDevolucaoDelete}
                          />
                        </td>
                      </tr>
                    )}
                    {venda.incidencias && venda.incidencias.length > 0 && (
                      <tr key={`${venda.id}-incidencias`}>
                        <td colSpan={6} className="px-4 lg:px-6 py-4 bg-purple-50/50 dark:bg-purple-900/10">
                          <div>
                            <h4 className="text-sm font-semibold text-purple-700 dark:text-purple-300 mb-3 flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Incidencias ({venda.incidencias.length})
                            </h4>
                            <div className="space-y-2">
                              {venda.incidencias.map(inc => (
                                <div key={inc.id} className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                                  <div className="flex-1">
                                    <p className="font-medium text-gray-800 dark:text-gray-200">{inc.motivo}</p>
                                    {inc.notas && <p className="text-sm text-gray-500">{inc.notas}</p>}
                                    <p className="text-xs text-gray-400">{new Date(inc.dataRegisto).toLocaleDateString("pt-PT")}</p>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="font-bold text-purple-600 dark:text-purple-400">-{formatCurrency(Number(inc.valor))} EUR</span>
                                    <button
                                      onClick={() => handleDeleteIncidencia(inc.id)}
                                      className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
            </tbody>
            {vendas.length > 0 && (
              <tfoot className="bg-gradient-to-r from-primary/5 to-primary/10 border-t-2 border-primary/20">
                <tr>
                  <td className="px-4 lg:px-6 py-4 font-bold text-foreground uppercase text-sm">Totais</td>
                  <td className="px-4 py-4 text-muted-foreground text-sm font-medium">{vendas.length} vendas</td>
                  <td className="px-4 py-4 text-right text-foreground font-bold hidden lg:table-cell">
                    {formatCurrency(totalSemIVA)} EUR
                  </td>
                  <td className="px-4 py-4 text-right text-blue-700 dark:text-blue-400 font-bold hidden lg:table-cell">
                    {formatCurrency(totalIVA)} EUR
                  </td>
                  <td className="px-4 py-4 text-right font-bold text-primary text-lg">
                    {formatCurrency(totalComIVA)} EUR
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {vendas.length === 0 && (
          <div className="text-center py-16">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-muted-foreground text-lg font-medium">Nenhuma venda em {meses[mes]} {ano}</p>
            <p className="text-gray-400 mt-1">Clique em &quot;Adicionar Venda&quot; para comecar</p>
          </div>
        )}
      </div>

      {/* Sales Cards - Mobile */}
      <div className="md:hidden space-y-3">
        {vendas.map((venda) => {
          const vendaTotal = Number(venda.total)
          const netTotal = calcularTotalLiquido(venda)
          const { semIVA, comIVA } = calcularIVA(netTotal)
          const vendaTotalComIVA = calcularIVA(vendaTotal).comIVA
          const hasItems = venda.itens && venda.itens.length > 0
          const hasDevolucoes = venda.devolucoes && venda.devolucoes.length > 0
          const hasItemsForReturn = hasItems && venda.itens!.some(item => {
            const devolvido = (item.devolucoes || []).reduce((sum, d) => sum + Number(d.quantidade), 0)
            return Number(item.quantidade) > devolvido
          })
          const isExpanded = expandedDevolucoes === venda.id

          return (
            <div
              key={venda.id}
              className={`bg-card rounded-2xl shadow-sm border overflow-hidden ${hasDevolucoes ? "border-orange-300 dark:border-orange-700" : "border-border"}`}
            >
              {/* Card Header - Cliente */}
              <div
                className="p-4 cursor-pointer active:bg-muted/30 transition"
                onClick={() => openEditSale(venda)}
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-foreground text-base leading-tight">
                      {venda.cliente.nome}
                    </h3>
                    {venda.cliente.codigo && (
                      <p className="text-sm text-muted-foreground">Cod: {venda.cliente.codigo}</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    {hasDevolucoes ? (
                      <>
                        <p className="text-sm text-muted-foreground line-through">{formatCurrency(vendaTotalComIVA)} EUR</p>
                        <p className="text-xl font-bold text-primary">{formatCurrency(comIVA)} EUR</p>
                      </>
                    ) : (
                      <p className="text-xl font-bold text-primary">{formatCurrency(comIVA)} EUR</p>
                    )}
                    <p className="text-xs text-muted-foreground">c/IVA</p>
                  </div>
                </div>

                {/* Tags - Objetivo Vario & Campanhas */}
                {(venda.objetivoVario || (venda.campanhas && venda.campanhas.length > 0) || hasDevolucoes || venda.tipoDocumento === "CONSUMO_INTERNO") && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {venda.tipoDocumento === "CONSUMO_INTERNO" && (
                      <span className="px-2.5 py-1 text-xs font-bold bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-lg">
                        C.I.
                      </span>
                    )}
                    {hasDevolucoes && (
                      <span className="px-2.5 py-1 text-xs font-semibold bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300 rounded-lg">
                        {venda.devolucoes!.length} devolucao
                      </span>
                    )}
                    {venda.objetivoVario && (
                      <span className="px-2.5 py-1 text-xs font-semibold bg-purple-100 text-purple-700 dark:bg-purple-800 dark:text-purple-100 rounded-lg">
                        {venda.objetivoVario.titulo}
                        {venda.objetivoVarioValor && (
                          <span className="ml-1">{formatCurrency(venda.objetivoVarioValor)} EUR</span>
                        )}
                      </span>
                    )}
                    {venda.campanhas?.map((cv) => (
                      <span key={cv.id} className="px-2.5 py-1 text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 rounded-lg">
                        {cv.campanha.titulo}
                        {cv.quantidade > 1 && <span className="ml-1">x{cv.quantidade}</span>}
                      </span>
                    ))}
                  </div>
                )}

                {/* Products List */}
                {hasItems && (
                  <div className="mt-3 pt-3 border-t border-border space-y-1.5">
                    {venda.itens!.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm">
                        <span className="text-foreground">{item.produto.nome}</span>
                        <span className="text-muted-foreground font-medium">
                          {Number(item.quantidade)}x {formatCurrency(Number(item.precoUnit))} EUR
                        </span>
                      </div>
                    ))}
                    {venda.itens!.length > 3 && (
                      <p className="text-sm text-primary font-medium">+{venda.itens!.length - 3} mais produtos</p>
                    )}
                  </div>
                )}

                {/* Sem IVA info */}
                <div className="mt-3 pt-3 border-t border-border flex justify-between text-sm">
                  <span className="text-muted-foreground">Total s/IVA</span>
                  <span className="font-semibold text-foreground">{formatCurrency(semIVA)} EUR</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex border-t border-border divide-x divide-border" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => openEditSale(venda)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Editar
                </button>
                {hasItemsForReturn && (
                  <button
                    onClick={() => openDevolucaoForm(venda)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
                    </svg>
                    Devolver
                  </button>
                )}
                <button
                  onClick={() => openIncidenciaForm(venda)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Inc.
                </button>
                {hasDevolucoes && (
                  <button
                    onClick={() => setExpandedDevolucoes(isExpanded ? null : venda.id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition ${isExpanded ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30" : "text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20"}`}
                  >
                    <svg className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    Dev.
                  </button>
                )}
                <button
                  onClick={() => handleDelete(venda.id)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              {/* Expanded Devolucoes */}
              {isExpanded && hasDevolucoes && (
                <div className="p-4 bg-orange-50/50 dark:bg-orange-900/10 border-t border-orange-200 dark:border-orange-800" onClick={(e) => e.stopPropagation()}>
                  <DevolucaoList
                    devolucoes={venda.devolucoes as DevolucaoWithRelations[]}
                    vendaTotal={vendaTotal}
                    onStatusChange={handleDevolucaoStatusChange}
                    onDelete={handleDevolucaoDelete}
                  />
                </div>
              )}

              {/* Incidencias Display */}
              {venda.incidencias && venda.incidencias.length > 0 && (
                <div className="p-4 bg-purple-50/50 dark:bg-purple-900/10 border-t border-purple-200 dark:border-purple-800">
                  <h4 className="text-sm font-semibold text-purple-700 dark:text-purple-300 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Incidencias ({venda.incidencias.length})
                  </h4>
                  <div className="space-y-2">
                    {venda.incidencias.map(inc => (
                      <div key={inc.id} className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                        <div className="flex-1">
                          <p className="font-medium text-gray-800 dark:text-gray-200">{inc.motivo}</p>
                          {inc.notas && <p className="text-sm text-gray-500">{inc.notas}</p>}
                          <p className="text-xs text-gray-400">{new Date(inc.dataRegisto).toLocaleDateString("pt-PT")}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-purple-600 dark:text-purple-400">-{formatCurrency(Number(inc.valor))} EUR</span>
                          <button
                            onClick={() => handleDeleteIncidencia(inc.id)}
                            className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {vendas.length === 0 && (
          <div className="text-center py-16 bg-card rounded-2xl border border-border">
            <svg className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-foreground text-lg font-semibold">Nenhuma venda</p>
            <p className="text-muted-foreground mt-1">{meses[mes]} {ano}</p>
            <button
              onClick={openNewSale}
              className="mt-4 bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-hover transition inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Adicionar Venda
            </button>
          </div>
        )}
      </div>

      {/* Sale Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-3xl my-8">
            {/* Modal Header */}
            <div className="sticky top-0 bg-card border-b border-border px-6 py-4 rounded-t-2xl flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">{editingId ? "Editar Venda" : "Nova Venda"}</h2>
                  <p className="text-sm text-muted-foreground">{meses[mes]} {ano}</p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-2 text-muted-foreground hover:bg-secondary rounded-lg transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Client Selection - Most Important */}
              <div className="bg-secondary/50 rounded-xl p-4 border border-border">
                <label className="block text-sm font-bold text-foreground mb-2">
                  Cliente *
                </label>
                <div className="relative" ref={clienteDropdownRef}>
                  <div className="relative">
                    <input
                      type="text"
                      value={selectedClienteId ? clientes.find(c => c.id === selectedClienteId)?.nome || clienteSearch : clienteSearch}
                      onChange={(e) => {
                        setClienteSearch(e.target.value)
                        setSelectedClienteId("")
                        setShowClienteDropdown(true)
                      }}
                      onFocus={() => setShowClienteDropdown(true)}
                      placeholder="Pesquisar cliente por nome ou código..."
                      className="w-full px-4 py-3 border-2 border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none text-foreground font-medium bg-card text-lg pr-10"
                    />
                    <svg className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  {showClienteDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-card border-2 border-border rounded-xl shadow-lg max-h-60 overflow-y-auto">
                      {filteredClientes.length === 0 ? (
                        <div className="px-4 py-3 text-muted-foreground text-sm">
                          Nenhum cliente encontrado
                        </div>
                      ) : (
                        filteredClientes.slice(0, 50).map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setSelectedClienteId(c.id)
                              setClienteSearch("")
                              setShowClienteDropdown(false)
                            }}
                            className={`w-full px-4 py-3 text-left hover:bg-secondary transition flex items-center justify-between ${
                              selectedClienteId === c.id ? "bg-primary/10" : ""
                            }`}
                          >
                            <span className="font-medium text-foreground">{c.nome}</span>
                            {c.codigo && <span className="text-sm text-muted-foreground">({c.codigo})</span>}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
                {/* Hidden required input for form validation */}
                <input type="hidden" required value={selectedClienteId} />
              </div>

              {/* Document Type Selection */}
              <div className="flex gap-3 items-center bg-secondary/50 rounded-xl p-4 border border-border">
                <label className="text-sm font-bold text-foreground">
                  Tipo:
                </label>
                <button
                  type="button"
                  onClick={() => setTipoDocumento("FATURA")}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    tipoDocumento === "FATURA"
                      ? "bg-primary text-white"
                      : "bg-card border-2 border-border text-foreground hover:border-primary"
                  }`}
                >
                  Fatura
                </button>
                <button
                  type="button"
                  onClick={() => setTipoDocumento("CONSUMO_INTERNO")}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    tipoDocumento === "CONSUMO_INTERNO"
                      ? "bg-orange-500 text-white"
                      : "bg-card border-2 border-border text-foreground hover:border-orange-500"
                  }`}
                >
                  C.I. (Consumo Interno)
                </button>
              </div>

              {/* Products Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">Produtos</h3>
                  <div className="flex items-center gap-2 text-sm">
                    <button
                      type="button"
                      onClick={() => { setUseItems(true); if (formItems.length === 0) addItem(); }}
                      className={`px-3 py-1.5 rounded-lg font-medium transition ${useItems ? "bg-primary text-white" : "bg-secondary text-muted-foreground hover:bg-muted"}`}
                    >
                      Por produtos
                    </button>
                    <button
                      type="button"
                      onClick={() => setUseItems(false)}
                      className={`px-3 py-1.5 rounded-lg font-medium transition ${!useItems ? "bg-primary text-white" : "bg-secondary text-muted-foreground hover:bg-muted"}`}
                    >
                      Valor manual
                    </button>
                  </div>
                </div>

                {useItems ? (
                  <div className="space-y-3">
                    {formItems.map((item, index) => {
                      const subtotal = (parseFloat(item.quantidade) || 0) * (parseFloat(item.precoUnit) || 0)
                      return (
                        <div key={index} className="bg-secondary/30 rounded-xl p-3 border border-border">
                          <div className="grid grid-cols-12 gap-2 items-center">
                            <div className="col-span-12 md:col-span-5">
                              <ProductPicker
                                products={produtosWithPrices}
                                selectedProductId={item.produtoId}
                                onSelect={(productId, price) => updateItem(index, "produtoId", productId, price)}
                                placeholder="Procurar produto..."
                                recentProductIds={recentProductIds}
                              />
                            </div>
                            <div className="col-span-4 md:col-span-2">
                              <label className="block text-xs text-muted-foreground mb-1 md:hidden">Qtd</label>
                              <input
                                type="number"
                                step="1"
                                min="1"
                                value={item.quantidade}
                                onChange={(e) => updateItem(index, "quantidade", e.target.value)}
                                className="w-full px-3 py-2 border-2 border-border rounded-lg text-sm text-center focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-card"
                                placeholder="Qtd"
                              />
                            </div>
                            <div className="col-span-4 md:col-span-2">
                              <label className="block text-xs text-muted-foreground mb-1 md:hidden">Preco</label>
                              <div className="relative">
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={item.precoUnit}
                                  onChange={(e) => updateItem(index, "precoUnit", e.target.value)}
                                  className="w-full px-3 py-2 border-2 border-border rounded-lg text-sm text-center focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-card"
                                  placeholder="0.00"
                                />
                              </div>
                            </div>
                            <div className="col-span-3 md:col-span-2 text-right">
                              <label className="block text-xs text-muted-foreground mb-1 md:hidden">Subtotal</label>
                              <span className="text-sm font-bold text-primary">{formatCurrency(subtotal)} EUR</span>
                            </div>
                            <div className="col-span-1 flex justify-end">
                              <button
                                type="button"
                                onClick={() => removeItem(index)}
                                className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}

                    <button
                      type="button"
                      onClick={addItem}
                      className="w-full py-3 border-2 border-dashed border-border rounded-xl text-muted-foreground hover:border-primary hover:text-primary transition flex items-center justify-center gap-2 font-medium"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Adicionar produto
                    </button>

                    {/* Upsell Suggestions */}
                    {selectedClienteId && clientPurchaseHistory.neverPurchased.length > 0 && (
                      <div className="bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-700 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <svg className="w-5 h-5 text-amber-600 dark:text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                          <span className="text-sm font-bold text-amber-800 dark:text-amber-100">Sugestoes de Upsell</span>
                          <span className="text-xs text-amber-600 dark:text-amber-200">- Cliente nunca comprou:</span>
                        </div>
                        <div className="space-y-2">
                          {clientPurchaseHistory.neverPurchased.slice(0, 5).map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                setFormItems([...formItems, { produtoId: p.id, quantidade: "1", precoUnit: p.preco || "" }])
                              }}
                              className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-600 rounded-xl text-left hover:bg-amber-100 dark:hover:bg-amber-900/50 hover:border-amber-400 transition group"
                              title={p.nome}
                            >
                              <span className="text-sm font-medium text-amber-900 dark:text-amber-50 truncate">{p.nome}</span>
                              <span className="flex-shrink-0 px-3 py-1 bg-amber-200 dark:bg-amber-700 text-amber-800 dark:text-amber-50 rounded-lg text-xs font-bold group-hover:bg-amber-300 dark:group-hover:bg-amber-600 transition">
                                + Adicionar
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Valor 1 (sem IVA)</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          value={valor1}
                          onChange={(e) => setValor1(e.target.value)}
                          className="w-full px-4 py-3 border-2 border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none text-foreground font-medium pr-12"
                          placeholder="0.00"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">EUR</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Total Display */}
                <div className="mt-4 flex justify-end">
                  <div className="bg-primary/10 rounded-xl px-6 py-3 text-right">
                    <span className="text-sm text-muted-foreground">Total (sem IVA): </span>
                    <span className="text-2xl font-bold text-primary">{formatCurrency(currentTotal)} EUR</span>
                  </div>
                </div>
              </div>

              {/* Campanhas Section */}
              {campanhas.length > 0 && (
                <div className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800">
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                    </svg>
                    Campanhas
                    <span className="text-xs font-normal text-emerald-600 dark:text-emerald-400">(adiciona ao total da venda)</span>
                  </h3>
                  <div className="space-y-2">
                    {campanhas.map((c) => {
                      const selectedCampanha = selectedCampanhas.find(sc => sc.id === c.id)
                      const isSelected = !!selectedCampanha
                      return (
                        <div key={c.id} className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setSelectedCampanhas(selectedCampanhas.filter(sc => sc.id !== c.id))
                              } else {
                                setSelectedCampanhas([...selectedCampanhas, { id: c.id, quantidade: 1 }])
                              }
                            }}
                            className={`flex-1 px-4 py-3 rounded-xl text-sm font-semibold transition text-left flex items-center gap-2 ${
                              isSelected
                                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                                : "bg-white dark:bg-card border-2 border-emerald-200 dark:border-emerald-700 text-foreground hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                            }`}
                          >
                            {isSelected ? (
                              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5 flex-shrink-0 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                            )}
                            {c.titulo}
                          </button>
                          {isSelected && (
                            <div className="flex items-center gap-2 bg-emerald-100 dark:bg-emerald-900/50 px-3 py-2 rounded-xl sm:w-auto w-fit">
                              <label className="text-sm font-medium text-emerald-700 dark:text-emerald-300 whitespace-nowrap">Qtd:</label>
                              <input
                                type="number"
                                min="1"
                                value={selectedCampanha.quantidade}
                                onChange={(e) => {
                                  const newQtd = Math.max(1, parseInt(e.target.value) || 1)
                                  setSelectedCampanhas(selectedCampanhas.map(sc =>
                                    sc.id === c.id ? { ...sc, quantidade: newQtd } : sc
                                  ))
                                }}
                                className="w-16 px-2 py-1.5 border-2 border-emerald-300 dark:border-emerald-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-foreground font-bold bg-card text-center"
                              />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Objetivos Varios Section - Separate from Campanhas */}
              {objetivosVarios.length > 0 && (
                <div className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    Objetivos Varios
                  </h3>
                  <p className="text-xs text-purple-600 dark:text-purple-400 mb-3 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    O valor vai para a cobranca, NAO para o total da venda
                  </p>
                  <div className="flex flex-col gap-3">
                    <select
                      value={selectedObjetivoVarioId}
                      onChange={(e) => {
                        setSelectedObjetivoVarioId(e.target.value)
                        if (!e.target.value) setObjetivoVarioValor("")
                      }}
                      className="w-full px-4 py-3 border-2 border-purple-200 dark:border-purple-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-foreground font-medium bg-card"
                    >
                      <option value="">Selecionar objetivo...</option>
                      {objetivosVarios.map((o) => (
                        <option key={o.id} value={o.id}>{o.titulo}</option>
                      ))}
                    </select>
                    {selectedObjetivoVarioId && (
                      <div className="flex items-center gap-3 bg-purple-100 dark:bg-purple-900/50 p-3 rounded-xl">
                        <label className="text-sm font-semibold text-purple-700 dark:text-purple-300 whitespace-nowrap">Valor (EUR):</label>
                        <div className="relative flex-1">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={objetivoVarioValor}
                            onChange={(e) => setObjetivoVarioValor(e.target.value)}
                            placeholder="0.00"
                            className="w-full px-4 py-2.5 border-2 border-purple-300 dark:border-purple-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-foreground font-bold bg-card"
                          />
                        </div>
                        {objetivoVarioValor && parseFloat(objetivoVarioValor) > 0 && (
                          <span className="text-sm font-bold text-purple-700 dark:text-purple-300 whitespace-nowrap">
                            + {formatCurrency(parseFloat(objetivoVarioValor))} na cobranca
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Other Optional Sections */}
              <div className="space-y-4">

                {/* Notas */}
                <div>
                  <label className="block text-sm font-bold text-foreground uppercase tracking-wide mb-2">Notas</label>
                  <input
                    type="text"
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none text-foreground font-medium"
                    placeholder="Notas adicionais (opcional)"
                  />
                </div>

                {/* Cobranca Section */}
                <div className="border-t border-border pt-4">
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Cobranca
                  </h3>

                  {/* Show existing cobranca when editing */}
                  {editingId && vendas.find(v => v.id === editingId)?.cobranca ? (
                    <div className="bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-700 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-blue-800 dark:text-blue-100">
                            Cobranca existente
                          </p>
                          <p className="text-lg font-bold text-blue-900 dark:text-blue-50">
                            {formatCurrency(Number(vendas.find(v => v.id === editingId)?.cobranca?.valor || 0))} EUR
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          vendas.find(v => v.id === editingId)?.cobranca?.pago
                            ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-50"
                            : "bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-50"
                        }`}>
                          {vendas.find(v => v.id === editingId)?.cobranca?.pago ? "Paga" : "Pendente"}
                        </span>
                      </div>
                      <Link
                        href="/cobrancas"
                        className="mt-3 inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Ver detalhes da cobranca
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  ) : editingId ? (
                    /* Show option to create cobranca when editing and no cobranca exists */
                    <div className="space-y-4">
                      <div className="bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-700 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-amber-600 dark:text-amber-300 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-amber-800 dark:text-amber-100">
                              Esta venda nao tem cobranca associada
                            </p>
                          </div>
                        </div>
                      </div>

                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={criarCobranca}
                          onChange={(e) => setCriarCobranca(e.target.checked)}
                          className="w-5 h-5 text-primary rounded border-border focus:ring-primary"
                        />
                        <span className="text-sm font-medium text-foreground">Criar cobranca agora</span>
                      </label>

                      {criarCobranca && (
                        <div className="grid grid-cols-2 gap-4 p-4 bg-secondary/50 rounded-xl">
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Parcelas</label>
                            <select
                              value={cobrancaParcelas}
                              onChange={(e) => setCobrancaParcelas(e.target.value)}
                              className="w-full px-4 py-3 border-2 border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none text-foreground font-medium bg-card"
                            >
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                                <option key={n} value={n}>{n}x</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Data Emissao</label>
                            <input
                              type="date"
                              value={cobrancaDataEmissao}
                              onChange={(e) => setCobrancaDataEmissao(e.target.value)}
                              className="w-full px-4 py-3 border-2 border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none text-foreground font-medium bg-card"
                            />
                          </div>
                          {/* Show objetivo vario value will be included */}
                          {selectedObjetivoVarioId && objetivoVarioValor && parseFloat(objetivoVarioValor) > 0 && (
                            <div className="col-span-2 bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-600 rounded-lg p-3">
                              <p className="text-sm text-purple-700 dark:text-purple-100">
                                <span className="font-medium">Nota:</span> O valor do objetivo vario ({formatCurrency(parseFloat(objetivoVarioValor))} EUR) sera incluido na cobranca
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* New sale - option to create cobranca */
                    <>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={criarCobranca}
                          onChange={(e) => setCriarCobranca(e.target.checked)}
                          className="w-5 h-5 text-primary rounded border-border focus:ring-primary"
                        />
                        <span className="text-sm font-medium text-foreground">Criar cobranca para esta venda</span>
                      </label>

                      {criarCobranca && (
                        <div className="mt-4 grid grid-cols-2 gap-4 p-4 bg-secondary/50 rounded-xl">
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Parcelas</label>
                            <select
                              value={cobrancaParcelas}
                              onChange={(e) => setCobrancaParcelas(e.target.value)}
                              className="w-full px-4 py-3 border-2 border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none text-foreground font-medium bg-card"
                            >
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                                <option key={n} value={n}>{n}x</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Data Emissao</label>
                            <input
                              type="date"
                              value={cobrancaDataEmissao}
                              onChange={(e) => setCobrancaDataEmissao(e.target.value)}
                              className="w-full px-4 py-3 border-2 border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none text-foreground font-medium bg-card"
                            />
                          </div>
                          {/* Show objetivo vario value will be included */}
                          {selectedObjetivoVarioId && objetivoVarioValor && parseFloat(objetivoVarioValor) > 0 && (
                            <div className="col-span-2 bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-600 rounded-lg p-3">
                              <p className="text-sm text-purple-700 dark:text-purple-100">
                                <span className="font-medium">Nota:</span> O valor do objetivo vario ({formatCurrency(parseFloat(objetivoVarioValor))} EUR) sera incluido na cobranca
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-6 py-3 border-2 border-border rounded-xl font-bold text-foreground hover:bg-secondary transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || !selectedClienteId || currentTotal <= 0}
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
                      {editingId ? "Atualizar" : "Criar Venda"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Devolucao Form Modal */}
      {showDevolucaoForm && selectedVendaForDevolucao && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <DevolucaoForm
              vendaId={selectedVendaForDevolucao.id}
              clienteNome={selectedVendaForDevolucao.cliente.nome}
              itensVenda={prepareItensParaDevolucao(selectedVendaForDevolucao)}
              produtos={produtos.map(p => ({ id: p.id, nome: p.nome, codigo: p.codigo, ativo: true }))}
              onSuccess={handleDevolucaoSuccess}
              onCancel={closeDevolucaoForm}
            />
          </div>
        </div>
      )}

      {/* Incidencia Form Modal */}
      {showIncidenciaForm && selectedVendaForIncidencia && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl shadow-xl max-w-md w-full">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-foreground">Nova Incidencia</h2>
                <p className="text-sm text-muted-foreground">{selectedVendaForIncidencia.cliente.nome}</p>
              </div>
              <button
                onClick={closeIncidenciaForm}
                className="p-2 text-muted-foreground hover:bg-secondary rounded-lg transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleIncidenciaSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Valor (EUR) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={incidenciaValor}
                  onChange={(e) => setIncidenciaValor(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Motivo *</label>
                <input
                  type="text"
                  value={incidenciaMotivo}
                  onChange={(e) => setIncidenciaMotivo(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Ex: Produto danificado, Desconto comercial..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Notas (opcional)</label>
                <textarea
                  value={incidenciaNotas}
                  onChange={(e) => setIncidenciaNotas(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Detalhes adicionais..."
                  rows={3}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeIncidenciaForm}
                  className="flex-1 px-4 py-2 border border-input rounded-lg hover:bg-secondary transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
                >
                  Registar Incidencia
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
