"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Swal from "sweetalert2"
import { formatCurrency } from "@/lib/utils"
import DevolucaoForm from "@/components/DevolucaoForm"
import DevolucaoList from "@/components/DevolucaoList"
import ProductPicker from "@/components/ProductPicker"
import type { DevolucaoWithRelations } from "@/types/devolucao"
import type { Produto } from "@prisma/client"

type ItemDevolucaoRef = {
  id: string
  quantidade: string
}

type ItemVenda = {
  id: string
  produtoId: string
  quantidade: string
  precoUnit: string
  subtotal: string
  produto: {
    id: string
    nome: string
    codigo: string | null
  }
  devolucoes?: ItemDevolucaoRef[]
}

type Venda = {
  id: string
  clienteId: string
  valor1: string | null
  valor2: string | null
  total: string
  mes: number
  ano: number
  notas: string | null
  cliente: {
    id: string
    nome: string
    codigo: string | null
  }
  itens?: ItemVenda[]
  devolucoes?: DevolucaoWithRelations[]
  cobranca?: Cobranca | null
  campanhas?: CampanhaVenda[]
}


type Parcela = {
  id: string
  numero: number
  valor: string
  dataVencimento: Date | string
  dataPago: Date | string | null
  pago: boolean
}

type Cobranca = {
  id: string
  fatura: string | null
  valor: string
  valorSemIva: string | null
  comissao: string | null
  dataEmissao: Date | string | null
  dataPago: Date | string | null
  pago: boolean
  numeroParcelas: number
  dataInicioVencimento: Date | string | null
  parcelas: Parcela[]
}


type Campanha = {
  id: string
  titulo: string
  descricao: string | null
  mes: number
  ano: number
  ativo: boolean
}

type CampanhaVenda = {
  id: string
  campanhaId: string
  quantidade: number
  campanha: Campanha
}

type Cliente = {
  id: string
  nome: string
  codigo: string | null
}

type ProdutoItem = {
  tipo: string | null
  ativo: boolean
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
  objetivo: number | null
  total: number
  mes: number
  ano: number
  meses: string[]
  campanhas: Campanha[]
}

// VAT rate in Portugal
const IVA_RATE = 0.23

// Calculate VAT values
function calcularIVA(totalSemIVA: number) {
  const comIVA = totalSemIVA * (1 + IVA_RATE)
  const iva = comIVA - totalSemIVA
  return { semIVA: totalSemIVA, comIVA, iva }
}

// Calculate net total for a venda (accounting for returns)
function calcularTotalLiquido(venda: Venda): number {
  const vendaTotal = Number(venda.total)
  if (!venda.devolucoes || venda.devolucoes.length === 0) return vendaTotal

  const totalDevolvido = venda.devolucoes.reduce((sum, d) => sum + Number(d.totalDevolvido), 0)
  const totalSubstituido = venda.devolucoes.reduce((sum, d) => sum + Number(d.totalSubstituido), 0)

  return vendaTotal - totalDevolvido + totalSubstituido
}

export default function VendasView({ vendas, clientes, produtos, objetivo, total, mes, ano, meses, campanhas }: Props) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedClienteId, setSelectedClienteId] = useState<string>("")
  const [clienteSearch, setClienteSearch] = useState("")
  const [showClienteDropdown, setShowClienteDropdown] = useState(false)
  const [formItems, setFormItems] = useState<FormItem[]>([])
  const [variosItems, setVariosItems] = useState<FormItem[]>([])
  const [manualValor1, setManualValor1] = useState("")
  const [manualValor2, setManualValor2] = useState("")
  const [fatura, setFatura] = useState("")
  const [numeroParcelas, setNumeroParcelas] = useState("1")
  const [dataInicioVencimento, setDataInicioVencimento] = useState("")
  const [selectedCampanhas, setSelectedCampanhas] = useState<{campanhaId: string, quantidade: number}[]>([])
  
  // Search and Sort state
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"nome" | "total" | "data">("nome")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  // Removed: useItems state - now both modes work together

  // Filter clients based on search
  const filteredClientes = useMemo(() => {
    if (!clienteSearch.trim()) return clientes
    const search = clienteSearch.toLowerCase()
    return clientes.filter(c => 
      c.nome.toLowerCase().includes(search) ||
      (c.codigo && c.codigo.toLowerCase().includes(search))
    )
  }, [clientes, clienteSearch])

  // Get selected client name for display
  const selectedClienteName = useMemo(() => {
    const client = clientes.find(c => c.id === selectedClienteId)
    return client ? `${client.nome}${client.codigo ? " (" + client.codigo + ")" : ""}` : ""
  }, [clientes, selectedClienteId])

  // Returns state
  const [showDevolucaoForm, setShowDevolucaoForm] = useState(false)
  const [selectedVendaForDevolucao, setSelectedVendaForDevolucao] = useState<Venda | null>(null)
  const [expandedDevolucoes, setExpandedDevolucoes] = useState<string | null>(null)

  // Calculate total liquido (accounting for returns)
  const totalLiquido = useMemo(() => {
    return vendas.reduce((sum, v) => sum + calcularTotalLiquido(v), 0)
  }, [vendas])

  // Filter and sort vendas
  const filteredAndSortedVendas = useMemo(() => {
    let result = [...vendas]
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(v => 
        v.cliente.nome.toLowerCase().includes(query) ||
        (v.cliente.codigo && v.cliente.codigo.toLowerCase().includes(query)) ||
        (v.notas && v.notas.toLowerCase().includes(query)) ||
        (v.cobranca?.fatura && v.cobranca.fatura.toLowerCase().includes(query))
      )
    }
    
    // Sort
    result.sort((a, b) => {
      let comparison = 0
      if (sortBy === "nome") {
        comparison = a.cliente.nome.localeCompare(b.cliente.nome)
      } else if (sortBy === "total") {
        comparison = Number(a.total) - Number(b.total)
      } else if (sortBy === "data") {
        const dateA = a.cobranca?.dataEmissao ? new Date(a.cobranca.dataEmissao).getTime() : 0
        const dateB = b.cobranca?.dataEmissao ? new Date(b.cobranca.dataEmissao).getTime() : 0
        comparison = dateA - dateB
      }
      return sortOrder === "asc" ? comparison : -comparison
    })
    
    return result
  }, [vendas, searchQuery, sortBy, sortOrder])

  const progresso = objetivo ? (totalLiquido / objetivo) * 100 : 0
  const falta = objetivo ? objetivo - totalLiquido : 0

  // Calculate totals with VAT
  const { semIVA: totalSemIVA, comIVA: totalComIVA, iva: totalIVA } = calcularIVA(totalLiquido)

  // Calculate items total
  const itemsTotal = useMemo(() => {
    return formItems.reduce((sum, item) => {
      const qty = parseFloat(item.quantidade) || 0
      const price = parseFloat(item.precoUnit) || 0
      return sum + (qty * price)
    }, 0)
  }, [formItems])

  // Calculate varios total
  const variosTotal = useMemo(() => {
    return variosItems.reduce((sum, item) => {
      const qty = parseFloat(item.quantidade) || 0
      const price = parseFloat(item.precoUnit) || 0
      return sum + (qty * price)
    }, 0)
  }, [variosItems])

  // Calculate combined total (manual + items)
  const combinedTotal = useMemo(() => {
    const v1 = parseFloat(manualValor1) || 0
    const v2 = parseFloat(manualValor2) || 0
    return v1 + v2 + itemsTotal + variosTotal
  }, [manualValor1, manualValor2, itemsTotal, variosTotal])

  // Get last prices from previous sales (fallback when product has no price)
  const lastPrices = useMemo(() => {
    const prices: Record<string, string> = {}
    vendas.forEach(v => {
      if (v.itens) {
        v.itens.forEach(item => {
          // Always use the most recent price (vendas are typically ordered)
          prices[item.produtoId] = String(Number(item.precoUnit))
        })
      }
    })
    return prices
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

  // Filter out Varios products from main product picker
  const regularProducts = useMemo(() => {
    return produtosWithPrices.filter(p => p.tipo !== "Varios")
  }, [produtosWithPrices])

  // Varios products only
  const variosProducts = useMemo(() => {
    return produtosWithPrices.filter(p => p.tipo === "Varios" && p.ativo)
  }, [produtosWithPrices])

  // Reset form when closing
  useEffect(() => {
    if (!showForm) {
      setSelectedClienteId("")
      setClienteSearch("")
      setShowClienteDropdown(false)
      setFormItems([])
      setVariosItems([])
      setManualValor1("")
      setManualValor2("")
      setFatura("")
      setNumeroParcelas("1")
      setDataInicioVencimento("")
      setSelectedCampanhas([])
      // Removed: setUseItems(false)
    }
  }, [showForm])

  // Initialize form when editing
  useEffect(() => {
    if (editingId) {
      const venda = vendas.find(v => v.id === editingId)
      if (venda) {
        setSelectedClienteId(venda.clienteId)
        setManualValor1(venda.valor1 ? String(venda.valor1) : "")
        setManualValor2(venda.valor2 ? String(venda.valor2) : "")
        if (venda.itens && venda.itens.length > 0) {
          // Removed: setUseItems(true)
          // Separate regular items from varios items
          const regularItems = venda.itens.filter(item => {
            const prod = produtos.find(p => p.id === item.produtoId)
            return prod?.tipo !== "Varios"
          })
          const varios = venda.itens.filter(item => {
            const prod = produtos.find(p => p.id === item.produtoId)
            return prod?.tipo === "Varios"
          })
          setFormItems(regularItems.map(item => ({
            produtoId: item.produtoId,
            quantidade: String(Number(item.quantidade)),
            precoUnit: String(Number(item.precoUnit))
          })))
          setVariosItems(varios.map(item => ({
            produtoId: item.produtoId,
            quantidade: String(Number(item.quantidade)),
            precoUnit: String(Number(item.precoUnit))
          })))
        } else {
          // Removed: setUseItems(false)
          setFormItems([])
        }
        // Initialize payment fields from cobranca
        if (venda.cobranca) {
          setFatura(venda.cobranca.fatura || "")
          setNumeroParcelas(String(venda.cobranca.numeroParcelas || 1))
          if (venda.cobranca.dataInicioVencimento) {
            const d = new Date(venda.cobranca.dataInicioVencimento)
            setDataInicioVencimento(d.toISOString().split("T")[0])
          }
        } else {
          setFatura("")
          setNumeroParcelas("1")
          setDataInicioVencimento("")
        }
        // Initialize campanhas from venda
        if (venda.campanhas && venda.campanhas.length > 0) {
          setSelectedCampanhas(venda.campanhas.map(cv => ({
            campanhaId: cv.campanhaId,
            quantidade: cv.quantidade
          })))
        } else {
          setSelectedCampanhas([])
        }
      }
    }
  }, [editingId, vendas])

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
      // Priority: 1. Price from ProductPicker, 2. Product's default price, 3. Last sale price
      if (price) {
        updated[index].precoUnit = price
      } else {
        const produto = produtos.find(p => p.id === value)
        if (produto?.preco) {
          updated[index].precoUnit = produto.preco
        } else if (lastPrices[value]) {
          // Use last sale price as fallback
          updated[index].precoUnit = lastPrices[value]
        }
      }
    }

    setFormItems(updated)
  }

  // Varios item functions
  function addVariosItem() {
    setVariosItems([...variosItems, { produtoId: "", quantidade: "1", precoUnit: "" }])
  }

  function removeVariosItem(index: number) {
    setVariosItems(variosItems.filter((_, i) => i !== index))
  }

  function updateVariosItem(index: number, field: keyof FormItem, value: string, price?: string | null) {
    const updated = [...variosItems]
    updated[index] = { ...updated[index], [field]: value }

    if (field === "produtoId" && value && !updated[index].precoUnit) {
      const produto = produtos.find(p => p.id === value)
      if (produto?.preco) {
        updated[index].precoUnit = produto.preco
      }
    }

    setVariosItems(updated)
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

    const formData = new FormData(e.currentTarget)

    // Build items array - combine regular items and varios items
    const regularItens = formItems
      .filter(item => item.produtoId && item.quantidade && item.precoUnit)
      .map(item => ({
        produtoId: item.produtoId,
        quantidade: parseFloat(item.quantidade),
        precoUnit: parseFloat(item.precoUnit)
      }))
    const variosItens = variosItems
      .filter(item => item.produtoId && item.quantidade && item.precoUnit)
      .map(item => ({
        produtoId: item.produtoId,
        quantidade: parseFloat(item.quantidade),
        precoUnit: parseFloat(item.precoUnit)
      }))
    const itens = [...regularItens, ...variosItens]

    const data = {
      clienteId: formData.get("clienteId") as string,
      valor1: formData.get("valor1") ? parseFloat(formData.get("valor1") as string) : null,
      valor2: formData.get("valor2") ? parseFloat(formData.get("valor2") as string) : null,
      notas: formData.get("notas") as string || null,
      itens,
      mes,
      ano,
      fatura: fatura || null,
      numeroParcelas: parseInt(numeroParcelas) || 1,
      dataInicioVencimento: dataInicioVencimento || null,
      campanhas: selectedCampanhas.filter(c => c.quantidade > 0)
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
        setShowForm(false)
        setEditingId(null)
        router.refresh()
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
        router.refresh()
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

  async function handleTogglePago(vendaId: string, cobrancaId: string, currentPago: boolean) {
    const action = currentPago ? "marcar como pendente" : "marcar como pago"
    const result = await Swal.fire({
      title: currentPago ? "Marcar como pendente?" : "Marcar como pago?",
      text: "Tem a certeza que quer " + action + "?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: currentPago ? "#f59e0b" : "#10b981",
      cancelButtonColor: "#666666",
      confirmButtonText: "Sim, confirmar",
      cancelButtonText: "Cancelar"
    })

    if (!result.isConfirmed) return

    try {
      const res = await fetch("/api/cobrancas/" + cobrancaId, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pago: !currentPago,
          dataPago: !currentPago ? new Date().toISOString() : null
        })
      })

      if (res.ok) {
        router.refresh()
        Swal.fire({
          icon: "success",
          title: currentPago ? "Marcado como pendente" : "Marcado como pago",
          timer: 1500,
          showConfirmButton: false
        })
      }
    } catch (err) {
      console.error("Error toggling payment:", err)
    }
  }

  function startEdit(venda: Venda) {
    setEditingId(venda.id)
    setShowForm(true)
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

  function handleDevolucaoSuccess() {
    closeDevolucaoForm()
    router.refresh()
    Swal.fire({
      icon: "success",
      title: "Devolução registada",
      text: "A devolução foi registada com sucesso.",
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
        router.refresh()
      }
    } catch (err) {
      console.error("Error updating devolucao status:", err)
    }
  }

  async function handleDevolucaoDelete(devolucaoId: string) {
    const result = await Swal.fire({
      title: "Eliminar devolução?",
      text: "Tem a certeza que quer eliminar esta devolução?",
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
        router.refresh()
      }
    } catch (err) {
      console.error("Error deleting devolucao:", err)
    }
  }

  // Prepare items for devolucao form
  function prepareItensParaDevolucao(venda: Venda) {
    if (!venda.itens) return []

    return venda.itens.map(item => {
      // Calculate already returned quantity
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

  const editingVenda = editingId ? vendas.find(v => v.id === editingId) : null

  return (
    <div>
      {/* Navigation and Summary */}
      <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-xl shadow-sm p-3 md:p-4 mb-4 border border-indigo-100">
        {/* Year and Month Selectors */}
        <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 mb-3 md:mb-4">
          <div className="flex items-center gap-2">
            <label className="text-xs md:text-sm font-semibold text-foreground">Ano:</label>
            <select
              value={ano}
              onChange={(e) => router.push(`/vendas?mes=${mes}&ano=${e.target.value}`)}
              className="px-3 md:px-4 py-2 md:py-2.5 border-2 border-border rounded-xl text-foreground font-semibold focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-card text-sm md:text-base"
            >
              {[2023, 2024, 2025, 2026].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs md:text-sm font-semibold text-foreground">Mês:</label>
            <select
              value={mes}
              onChange={(e) => router.push(`/vendas?mes=${e.target.value}&ano=${ano}`)}
              className="px-3 md:px-4 py-2 md:py-2.5 border-2 border-border rounded-xl text-foreground font-semibold focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-card text-sm md:text-base"
            >
              {meses.slice(1).map((m, i) => (
                <option key={i + 1} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Month Navigation with Arrows */}
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <button
            onClick={() => navigateMonth(-1)}
            className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2 bg-secondary hover:bg-violet-100 rounded-xl transition text-foreground font-medium text-sm md:text-base"
          >
            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">Anterior</span>
          </button>
          <div className="text-center">
            <h2 className="text-lg md:text-xl font-bold text-foreground">{meses[mes]} {ano}</h2>
          </div>
          <button
            onClick={() => navigateMonth(1)}
            className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2 bg-secondary hover:bg-violet-100 rounded-xl transition text-foreground font-medium text-sm md:text-base"
          >
            <span className="hidden sm:inline">Seguinte</span>
            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* VAT Summary Cards */}
        <div className="grid grid-cols-3 gap-2 md:gap-3 mb-3 md:mb-4">
          <div className="bg-violet-50 border border-violet-200 rounded-xl p-3 md:p-4 text-center">
            <p className="text-xs md:text-sm font-medium text-muted-foreground mb-1">Sem IVA</p>
            <p className="text-base md:text-2xl font-bold text-foreground">{formatCurrency(totalSemIVA)} €</p>
          </div>
          <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 md:p-4 text-center">
            <p className="text-xs md:text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">IVA (23%)</p>
            <p className="text-base md:text-2xl font-bold text-blue-700 dark:text-blue-300">{formatCurrency(totalIVA)} €</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 md:p-4 text-center">
            <p className="text-xs md:text-sm font-medium text-primary mb-1">c/IVA Líquido</p>
            <p className="text-base md:text-2xl font-bold text-primary">{formatCurrency(totalComIVA)} €</p>
          </div>
        </div>

        {/* Progress Bar */}
        {objetivo && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium text-foreground">Objetivo: {formatCurrency(objetivo)} €</span>
              <span className={`font-bold ${progresso >= 100 ? "text-green-600" : "text-orange-600"}`}>
                {progresso >= 100 ? "Objetivo atingido!" : `Falta: ${formatCurrency(falta)} €`}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-4">
              <div
                className={`h-4 rounded-full transition-all ${progresso >= 100 ? "bg-green-500" : "bg-primary/50"}`}
                style={{ width: `${Math.min(progresso, 100)}%` }}
              />
            </div>
            <p className="text-center mt-2 text-sm font-medium text-muted-foreground">{progresso.toFixed(1)}% do objetivo</p>
          </div>
        )}
      </div>

      {/* Search, Sort and Add Sale */}
      <div className="bg-card rounded-xl shadow-sm p-4 mb-3 md:mb-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md w-full sm:w-auto">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Pesquisar por cliente, fatura..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
          
          {/* Sort Controls */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:inline">Ordenar:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "nome" | "total" | "data")}
              className="px-3 py-2 bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="nome">Nome</option>
              <option value="total">Valor</option>
              <option value="data">Data</option>
            </select>
            <button
              onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}
              className="p-2 bg-secondary border border-border rounded-lg hover:bg-secondary/80 transition"
              title={sortOrder === "asc" ? "Crescente" : "Decrescente"}
            >
              {sortOrder === "asc" ? (
                <svg className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
                </svg>
              )}
            </button>
          </div>
          
          {/* Add Button */}
          <button
            onClick={() => { setShowForm(true); setEditingId(null); }}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-5 py-2.5 rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-600 transition flex items-center gap-2 shadow-lg text-sm whitespace-nowrap"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">Nova Venda</span>
            <span className="sm:hidden">Nova</span>
          </button>
        </div>
        
        {/* Results count */}
        {searchQuery && (
          <p className="text-xs text-muted-foreground mt-2">
            {filteredAndSortedVendas.length} resultado{filteredAndSortedVendas.length !== 1 ? "s" : ""} encontrado{filteredAndSortedVendas.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 md:p-4">
          <div className="bg-card rounded-2xl shadow-xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
            {/* Form Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-4 md:px-5 py-3 md:py-4 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="text-base md:text-xl font-bold text-white flex items-center gap-2 md:gap-3">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <svg className="w-4 h-4 md:w-5 md:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={editingId ? "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" : "M12 4v16m8-8H4"} />
                    </svg>
                  </div>
                  {editingId ? "Editar Venda" : "Registar Nova Venda"}
                </h3>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditingId(null); }}
                  className="p-2 hover:bg-white/20 rounded-lg transition text-white"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            {/* Form Body */}
            <div className="p-4 md:p-6 overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Cliente <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input type="hidden" name="clienteId" value={selectedClienteId} required />
                  <div className="relative">
                    <input
                      type="text"
                      value={showClienteDropdown ? clienteSearch : selectedClienteName}
                      onChange={(e) => {
                        setClienteSearch(e.target.value)
                        setShowClienteDropdown(true)
                      }}
                      onFocus={() => {
                        setShowClienteDropdown(true)
                        setClienteSearch("")
                      }}
                      onBlur={() => {
                        setTimeout(() => setShowClienteDropdown(false), 200)
                      }}
                      placeholder="Pesquisar cliente..."
                      className="w-full px-4 py-3 border-2 border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none text-foreground font-medium bg-card pr-10"
                    />
                    <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  {showClienteDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-card border-2 border-border rounded-xl shadow-lg max-h-60 overflow-y-auto">
                      {filteredClientes.length === 0 ? (
                        <div className="px-4 py-3 text-muted-foreground text-sm">Nenhum cliente encontrado</div>
                      ) : (
                        filteredClientes.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setSelectedClienteId(c.id)
                              setClienteSearch("")
                              setShowClienteDropdown(false)
                            }}
                            className={`w-full px-4 py-3 text-left hover:bg-rose-200 transition flex items-center justify-between ${selectedClienteId === c.id ? "bg-rose-100" : ""}`}
                          >
                            <span className="font-medium text-foreground">{c.nome}</span>
                            {c.codigo && <span className="text-muted-foreground text-sm">({c.codigo})</span>}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Manual Values Mode */}
              {true && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Valor 1 <span className="text-xs text-muted-foreground font-normal">(sem IVA)</span>
                    </label>
                    <div className="relative">
                      <input
                        name="valor1"
                        type="number"
                        step="0.01"
                        value={manualValor1}
                        onChange={(e) => setManualValor1(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none text-foreground font-medium pr-10"
                        placeholder="0.00"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">€</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Valor 2 <span className="text-xs text-muted-foreground font-normal">(sem IVA)</span>
                    </label>
                    <div className="relative">
                      <input
                        name="valor2"
                        type="number"
                        step="0.01"
                        value={manualValor2}
                        onChange={(e) => setManualValor2(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none text-foreground font-medium pr-10"
                        placeholder="0.00"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">€</span>
                    </div>
                  </div>
                </>
              )}

              {/* Products Mode */}
              {true && (
                <div className="md:col-span-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-semibold text-foreground flex items-center gap-2">
                      <svg className="w-4 h-4 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      Produtos
                    </label>
                    <button
                      type="button"
                      onClick={addItem}
                      className="px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-lg text-sm font-semibold hover:from-violet-600 hover:to-purple-600 transition-all shadow-sm flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                      </svg>
                      Adicionar
                    </button>
                  </div>

                  {formItems.length === 0 ? (
                    <div className="text-center py-8 bg-secondary/30 rounded-xl border-2 border-dashed border-border">
                      <svg className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      <p className="text-sm text-muted-foreground">Nenhum produto adicionado</p>
                      <p className="text-xs text-muted-foreground/70 mt-1">Clique em &quot;Adicionar&quot; acima</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="grid grid-cols-12 gap-2 text-xs font-bold text-muted-foreground px-1">
                        <div className="col-span-5">Produto</div>
                        <div className="col-span-2 text-center">Qtd</div>
                        <div className="col-span-2 text-center">Preço €</div>
                        <div className="col-span-2 text-right">Subtotal</div>
                        <div className="col-span-1"></div>
                      </div>

                      {/* Items */}
                      {formItems.map((item, index) => {
                        const subtotal = (parseFloat(item.quantidade) || 0) * (parseFloat(item.precoUnit) || 0)
                        return (
                          <div key={index} className="grid grid-cols-12 gap-2 items-center">
                            <div className="col-span-5">
                              <ProductPicker
                                products={regularProducts}
                                selectedProductId={item.produtoId}
                                onSelect={(productId, price) => updateItem(index, "produtoId", productId, price)}
                                placeholder="Procurar produto..."
                              />
                            </div>
                            <div className="col-span-2">
                              <input
                                type="number"
                                step="1"
                                min="1"
                                value={item.quantidade}
                                onChange={(e) => updateItem(index, "quantidade", e.target.value)}
                                className="w-full px-3 py-2 border-2 border-border rounded-lg text-sm text-center focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                                placeholder="1"
                              />
                            </div>
                            <div className="col-span-2">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.precoUnit}
                                onChange={(e) => updateItem(index, "precoUnit", e.target.value)}
                                className="w-full px-3 py-2 border-2 border-border rounded-lg text-sm text-center focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                                placeholder="0.00"
                              />
                            </div>
                            <div className="col-span-2 text-right text-sm font-semibold text-foreground">
                              {formatCurrency(subtotal)} €
                            </div>
                            <div className="col-span-1 flex justify-center">
                              <button
                                type="button"
                                onClick={() => removeItem(index)}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        )
                      })}

                      {/* Total */}
                      <div className="flex justify-end pt-4 mt-2 border-t border-border">
                        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-5 py-3 rounded-xl border border-emerald-200">
                          <span className="text-sm text-emerald-700 font-medium">Total da Venda: </span>
                          <span className="text-xl font-bold text-emerald-600">{formatCurrency(combinedTotal)} €</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Upsell Suggestions */}
                  {selectedClienteId && clientPurchaseHistory.neverPurchased.length > 0 && (
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        <span className="text-sm font-bold text-amber-800">Sugestões de Upsell</span>
                      </div>
                      <p className="text-xs text-amber-700 mb-2">Este cliente nunca comprou:</p>
                      <div className="flex flex-wrap gap-2">
                        {clientPurchaseHistory.neverPurchased.filter(p => p.tipo !== "Varios").slice(0, 6).map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setFormItems([...formItems, { produtoId: p.id, quantidade: "1", precoUnit: p.preco || "" }])
                            }}
                            className="px-3 py-1 bg-card border border-amber-300 rounded-full text-xs font-medium text-amber-800 hover:bg-amber-200 transition"
                          >
                            + {p.nome}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              
              {/* Varios Section */}
              {variosProducts.length > 0 && (
                <div className="md:col-span-2 space-y-4 mt-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-semibold text-foreground flex items-center gap-2">
                      <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                      Varios
                      <span className="text-xs text-muted-foreground font-normal">(nao conta para objetivos)</span>
                    </label>
                    <button
                      type="button"
                      onClick={addVariosItem}
                      className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg text-sm font-semibold hover:from-orange-600 hover:to-amber-600 transition-all shadow-sm flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                      </svg>
                      Adicionar
                    </button>
                  </div>

                  {variosItems.length > 0 && (
                    <div className="space-y-3 bg-orange-50/50 rounded-xl p-4 border border-orange-200">
                      {/* Header */}
                      <div className="hidden md:grid grid-cols-12 gap-2 text-xs font-bold text-muted-foreground px-1">
                        <div className="col-span-5">Item</div>
                        <div className="col-span-2 text-center">Qtd</div>
                        <div className="col-span-2 text-center">Preco EUR</div>
                        <div className="col-span-2 text-right">Subtotal</div>
                        <div className="col-span-1"></div>
                      </div>

                      {/* Items */}
                      {variosItems.map((item, index) => {
                        const subtotal = (parseFloat(item.quantidade) || 0) * (parseFloat(item.precoUnit) || 0)
                        return (
                          <div key={index} className="bg-white rounded-lg p-3 border border-orange-100">
                            <div className="grid grid-cols-12 gap-2 items-center">
                              <div className="col-span-12 md:col-span-5">
                                <label className="block text-xs text-muted-foreground mb-1 md:hidden">Item</label>
                                <ProductPicker
                                  products={variosProducts}
                                  selectedProductId={item.produtoId}
                                  onSelect={(productId, price) => updateVariosItem(index, "produtoId", productId, price)}
                                  placeholder="Selecionar item varios..."
                                />
                              </div>
                              <div className="col-span-4 md:col-span-2">
                                <label className="block text-xs text-muted-foreground mb-1 md:hidden">Qtd</label>
                                <input
                                  type="number"
                                  step="1"
                                  min="1"
                                  value={item.quantidade}
                                  onChange={(e) => updateVariosItem(index, "quantidade", e.target.value)}
                                  className="w-full px-3 py-2 border-2 border-border rounded-lg text-sm text-center focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                                  placeholder="1"
                                />
                              </div>
                              <div className="col-span-4 md:col-span-2">
                                <label className="block text-xs text-muted-foreground mb-1 md:hidden">Preco</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={item.precoUnit}
                                  onChange={(e) => updateVariosItem(index, "precoUnit", e.target.value)}
                                  className="w-full px-3 py-2 border-2 border-border rounded-lg text-sm text-center focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                                  placeholder="0.00"
                                />
                              </div>
                              <div className="col-span-3 md:col-span-2 text-right text-sm font-semibold text-foreground">
                                <span className="md:hidden text-xs text-muted-foreground">Subtotal: </span>
                                {formatCurrency(subtotal)} EUR
                              </div>
                              <div className="col-span-1 flex justify-center">
                                <button
                                  type="button"
                                  onClick={() => removeVariosItem(index)}
                                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      })}

                      {/* Varios Total */}
                      <div className="flex justify-end pt-2">
                        <div className="bg-orange-100 px-4 py-2 rounded-lg">
                          <span className="text-sm text-orange-700 font-medium">Total Varios: </span>
                          <span className="text-lg font-bold text-orange-600">{formatCurrency(variosTotal)} EUR</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Payment Tracking Section */}
              <div className="md:col-span-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Pagamento
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">
                      Num Fatura
                    </label>
                    <input
                      type="text"
                      value={fatura}
                      onChange={(e) => setFatura(e.target.value)}
                      className="w-full px-3 py-2 border-2 border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                      placeholder="FA 2024/001"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">
                      Parcelas
                    </label>
                    <select
                      value={numeroParcelas}
                      onChange={(e) => setNumeroParcelas(e.target.value)}
                      className="w-full px-3 py-2 border-2 border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                    >
                      <option value="1">1x (Pronto)</option>
                      <option value="2">2x</option>
                      <option value="3">3x</option>
                      <option value="4">4x</option>
                      <option value="6">6x</option>
                      <option value="12">12x</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">
                      Data Emissão
                    </label>
                    <input
                      type="date"
                      value={dataInicioVencimento}
                      onChange={(e) => setDataInicioVencimento(e.target.value)}
                      className="w-full px-3 py-2 border-2 border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Campanhas Section */}
              {campanhas.length > 0 && (
                <div className="md:col-span-2 bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl p-4 border border-purple-200">
                  <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                    </svg>
                    Campanhas ({meses[mes]})
                  </h4>
                  <div className="space-y-2">
                    {campanhas.map((camp) => {
                      const selected = selectedCampanhas.find(sc => sc.campanhaId === camp.id)
                      const qty = selected?.quantidade || 0
                      return (
                        <div key={camp.id} className="flex items-center justify-between bg-white rounded-lg p-3 border border-purple-100">
                          <div className="flex-1 min-w-0">
                            <span className="font-medium text-foreground">{camp.titulo}</span>
                            {camp.descricao && (
                              <p className="text-xs text-muted-foreground truncate">{camp.descricao}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 ml-3">
                            <button
                              type="button"
                              onClick={() => {
                                if (qty > 0) {
                                  if (qty === 1) {
                                    setSelectedCampanhas(prev => prev.filter(sc => sc.campanhaId !== camp.id))
                                  } else {
                                    setSelectedCampanhas(prev => prev.map(sc => 
                                      sc.campanhaId === camp.id ? { ...sc, quantidade: sc.quantidade - 1 } : sc
                                    ))
                                  }
                                }
                              }}
                              className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold hover:bg-purple-200 transition flex items-center justify-center disabled:opacity-50"
                              disabled={qty === 0}
                            >
                              -
                            </button>
                            <span className={`w-8 text-center font-bold ${qty > 0 ? "text-purple-700" : "text-muted-foreground"}`}>
                              {qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                if (selected) {
                                  setSelectedCampanhas(prev => prev.map(sc =>
                                    sc.campanhaId === camp.id ? { ...sc, quantidade: sc.quantidade + 1 } : sc
                                  ))
                                } else {
                                  setSelectedCampanhas(prev => [...prev, { campanhaId: camp.id, quantidade: 1 }])
                                }
                              }}
                              className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold hover:bg-purple-200 transition flex items-center justify-center"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Notas
                </label>
                <input
                  name="notas"
                  type="text"
                  defaultValue={editingVenda?.notas || ""}
                  className="w-full px-4 py-3 border-2 border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none text-foreground font-medium"
                  placeholder="Notas adicionais"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-3.5 rounded-xl font-bold hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    Guardar
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditingId(null); }}
                className="px-6 py-3 border-2 border-border rounded-xl font-bold text-foreground hover:bg-secondary transition flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancelar
              </button>
            </div>
          </form>
            </div>
          </div>
        </div>
      )}

      {/* Sales Table - Desktop */}
      <div className="hidden md:block bg-card rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-violet-100 to-purple-100 border-b-2 border-violet-200">
              <tr>
                <th className="px-4 lg:px-6 py-4 text-left text-sm font-bold text-foreground">Cliente</th>
                <th className="px-4 py-4 text-left text-sm font-bold text-foreground">Produtos</th>
                <th className="px-4 py-4 text-right text-sm font-bold text-foreground hidden lg:table-cell">Sem IVA</th>
                <th className="px-4 py-4 text-right text-sm font-bold text-blue-700 hidden lg:table-cell">IVA</th>
                <th className="px-4 py-4 text-right text-sm font-bold text-primary">Total (sem IVA)</th>
                <th className="px-4 py-4 text-left text-sm font-bold text-foreground hidden xl:table-cell">Notas</th>
                <th className="px-4 py-4 text-right text-sm font-bold text-foreground">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAndSortedVendas.map((venda) => {
                const vendaTotal = Number(venda.total)
                const netTotal = calcularTotalLiquido(venda)
                const { semIVA, comIVA, iva } = calcularIVA(netTotal)
                const hasItems = venda.itens && venda.itens.length > 0
                const hasDevolucoes = venda.devolucoes && venda.devolucoes.length > 0
                const isPago = venda.cobranca?.pago || false
                const cobrancaId = venda.cobranca?.id
                const hasItemsForReturn = hasItems && venda.itens!.some(item => {
                  const devolvido = (item.devolucoes || []).reduce((sum, d) => sum + Number(d.quantidade), 0)
                  return Number(item.quantidade) > devolvido
                })
                const isExpanded = expandedDevolucoes === venda.id

                return (
                  <>
                    <tr key={venda.id} className={`hover:bg-pink-50 transition ${hasDevolucoes ? "bg-orange-50/30 dark:bg-orange-900/5" : ""}`}>
                      <td className="px-4 lg:px-6 py-4">
                        <div className="flex items-center gap-2">
                          {isPago ? (
                            <span className="px-2 py-0.5 text-xs font-bold bg-green-100 text-green-700 rounded-full">PAGO</span>
                          ) : (
                            <span className="px-2 py-0.5 text-xs font-bold bg-amber-100 text-amber-700 rounded-full">PEND</span>
                          )}
                          <div>
                            <Link href={`/clientes/${venda.cliente.id}`} className="font-semibold text-foreground hover:text-primary transition">
                              {venda.cliente.nome}
                            </Link>
                            {venda.cliente.codigo && (
                              <span className="text-muted-foreground text-sm ml-2">({venda.cliente.codigo})</span>
                            )}
                            {hasDevolucoes && (
                              <span className="ml-2 px-1.5 py-0.5 text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 rounded">
                                {venda.devolucoes!.length} dev.
                              </span>
                            )}
                            {venda.cobranca?.fatura && (
                              <span className="ml-2 text-xs text-blue-600">{venda.cobranca.fatura}</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {hasItems ? (
                          <div className="space-y-1">
                            {venda.itens!.map((item, idx) => (
                              <div key={idx} className="text-sm">
                                <span className="font-medium text-foreground">{item.produto.nome}</span>
                                <span className="text-muted-foreground ml-1">
                                  ({Number(item.quantidade)} × {formatCurrency(Number(item.precoUnit))}€)
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            {venda.valor1 ? <div>V1: {formatCurrency(Number(venda.valor1))}€</div> : null}
                            {venda.valor2 ? <div>V2: {formatCurrency(Number(venda.valor2))}€</div> : null}
                            {!venda.valor1 && !venda.valor2 ? <span>-</span> : null}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right text-muted-foreground font-medium hidden lg:table-cell whitespace-nowrap">
                        {formatCurrency(semIVA)} €
                      </td>
                      <td className="px-4 py-4 text-right text-blue-600 font-medium hidden lg:table-cell whitespace-nowrap">
                        {formatCurrency(iva)} €
                      </td>
                      <td className="px-4 py-4 text-right whitespace-nowrap">
                        {hasDevolucoes ? (
                          <div>
                            <span className="text-sm text-muted-foreground line-through">{formatCurrency(vendaTotal)} €</span>
                            <br />
                            <span className="font-bold text-primary">{formatCurrency(netTotal)} €</span>
                          </div>
                        ) : (
                          <span className="font-bold text-primary">{formatCurrency(vendaTotal)} €</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-muted-foreground text-sm hidden xl:table-cell">{venda.notas || "-"}</td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-1.5">
                          {/* Returns toggle button */}
                          {hasDevolucoes && (
                            <button
                              onClick={() => setExpandedDevolucoes(isExpanded ? null : venda.id)}
                              className={`p-2 transition ${isExpanded ? "text-orange-600 dark:text-orange-400" : "text-muted-foreground hover:text-foreground"}`}
                              title="Ver devoluções"
                            >
                              <svg className={`w-5 h-5 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          )}
                          {/* Add return button (only if sale has items and items available to return) */}
                          {hasItemsForReturn && (
                            <button
                              onClick={() => openDevolucaoForm(venda)}
                              className="p-2 text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 transition"
                              title="Registar devolução"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
                              </svg>
                            </button>
                          )}
                          
                          {cobrancaId && (
                            <button
                              onClick={() => handleTogglePago(venda.id, cobrancaId, isPago)}
                              className={`p-2 transition ${isPago ? "text-emerald-600 hover:text-emerald-700 dark:text-emerald-400" : "text-amber-600 hover:text-amber-700 dark:text-amber-400"}`}
                              title={isPago ? "Pago - clique para marcar pendente" : "Pendente - clique para marcar pago"}
                            >
                              {isPago ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => startEdit(venda)}
                            className="p-2 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition"
                            title="Editar" aria-label="Editar"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(venda.id)}
                            className="p-2 text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 transition"
                            title="Eliminar" aria-label="Eliminar"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                    {/* Expanded devolucoes row */}
                    {isExpanded && hasDevolucoes && (
                      <tr key={`${venda.id}-devolucoes`}>
                        <td colSpan={7} className="px-4 lg:px-6 py-4 bg-orange-50/50 dark:bg-orange-900/10">
                          <DevolucaoList
                            devolucoes={venda.devolucoes as DevolucaoWithRelations[]}
                            vendaTotal={vendaTotal}
                            onStatusChange={handleDevolucaoStatusChange}
                            onDelete={handleDevolucaoDelete}
                          />
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
            </tbody>
            {vendas.length > 0 && (
              <tfoot className="bg-secondary border-t-2 border-border">
                <tr>
                  <td className="px-4 lg:px-6 py-4 font-bold text-foreground">TOTAIS</td>
                  <td className="px-4 py-4 text-muted-foreground text-sm">{vendas.length} vendas</td>
                  <td className="px-4 py-4 text-right text-foreground font-bold hidden lg:table-cell">
                    {formatCurrency(totalSemIVA)} €
                  </td>
                  <td className="px-4 py-4 text-right text-blue-700 font-bold hidden lg:table-cell">
                    {formatCurrency(totalIVA)} €
                  </td>
                  <td className="px-4 py-4 text-right font-bold text-primary text-lg">
                    {formatCurrency(totalLiquido)} €
                  </td>
                  <td className="hidden xl:table-cell"></td>
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
            <p className="text-gray-400 mt-1">Clique em &quot;Adicionar Venda&quot; para começar</p>
          </div>
        )}
      </div>

      {/* Sales Cards - Mobile */}
      <div className="md:hidden space-y-3">
        {filteredAndSortedVendas.map((venda) => {
          const vendaTotal = Number(venda.total)
          const netTotal = calcularTotalLiquido(venda)
          const hasItems = venda.itens && venda.itens.length > 0
          const hasDevolucoes = venda.devolucoes && venda.devolucoes.length > 0
          const hasItemsForReturn = hasItems && venda.itens!.some(item => {
            const devolvido = (item.devolucoes || []).reduce((sum, d) => sum + Number(d.quantidade), 0)
            return Number(item.quantidade) > devolvido
          })
          const isExpanded = expandedDevolucoes === venda.id

          return (
            <div key={venda.id} className={`bg-white rounded-xl shadow-sm border-2 border-violet-100 overflow-hidden ${hasDevolucoes ? "border-orange-200 dark:border-orange-800" : ""}`}>
              <div className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 min-w-0">
                    <Link href={`/clientes/${venda.cliente.id}`} className="font-semibold text-foreground hover:text-primary transition block truncate">
                      {venda.cliente.nome}
                    </Link>
                    {venda.cliente.codigo && (
                      <span className="text-muted-foreground text-xs">({venda.cliente.codigo})</span>
                    )}
                    {hasDevolucoes && (
                      <span className="ml-2 px-1.5 py-0.5 text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 rounded">
                        {venda.devolucoes!.length} dev.
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1 ml-2">
                    {hasDevolucoes && (
                      <button
                        onClick={() => setExpandedDevolucoes(isExpanded ? null : venda.id)}
                        className={`p-2 transition ${isExpanded ? "text-orange-600" : "text-muted-foreground hover:text-foreground"}`}
                      >
                        <svg className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    )}
                    {hasItemsForReturn && (
                      <button
                        onClick={() => openDevolucaoForm(venda)}
                        className="p-2 text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 transition"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={() => startEdit(venda)}
                      className="p-2 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(venda.id)}
                      className="p-2 text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 transition"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {hasItems && (
                  <div className="text-xs text-muted-foreground mb-3 space-y-1">
                    {venda.itens!.slice(0, 2).map((item, idx) => (
                      <div key={idx}>{item.produto.nome} ({Number(item.quantidade)}x)</div>
                    ))}
                    {venda.itens!.length > 2 && (
                      <div className="text-primary">+{venda.itens!.length - 2} mais</div>
                    )}
                  </div>
                )}

                <div className="flex justify-between items-center pt-2 border-t border-border">
                  <span className="text-sm text-muted-foreground">Total</span>
                  {hasDevolucoes ? (
                    <div className="text-right">
                      <span className="text-sm text-muted-foreground line-through">{formatCurrency(vendaTotal)} €</span>
                      <br />
                      <span className="text-lg font-bold text-primary">{formatCurrency(netTotal)} €</span>
                    </div>
                  ) : (
                    <span className="text-lg font-bold text-primary">{formatCurrency(vendaTotal)} €</span>
                  )}
                </div>
              </div>

              {/* Expanded devolucoes section */}
              {isExpanded && hasDevolucoes && (
                <div className="px-4 pb-4 bg-orange-50/50 dark:bg-orange-900/10 border-t border-orange-200 dark:border-orange-800">
                  <DevolucaoList
                    devolucoes={venda.devolucoes as DevolucaoWithRelations[]}
                    vendaTotal={vendaTotal}
                    onStatusChange={handleDevolucaoStatusChange}
                    onDelete={handleDevolucaoDelete}
                  />
                </div>
              )}
            </div>
          )
        })}

        {vendas.length === 0 && (
          <div className="text-center py-16">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-muted-foreground text-lg font-medium">Nenhuma venda em {meses[mes]} {ano}</p>
            <p className="text-gray-400 mt-1">Clique em &quot;Adicionar Venda&quot; para começar</p>
          </div>
        )}
      </div>

      {/* Devolucao Form Modal */}
      {showDevolucaoForm && selectedVendaForDevolucao && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 md:p-4">
          <div className="bg-card rounded-xl shadow-xl max-w-2xl w-full max-h-[95vh] overflow-hidden flex flex-col">
            <div className="overflow-y-auto flex-1 p-4 md:p-6">
              <DevolucaoForm
              vendaId={selectedVendaForDevolucao.id}
              clienteNome={selectedVendaForDevolucao.cliente.nome}
              itensVenda={prepareItensParaDevolucao(selectedVendaForDevolucao)}
              produtos={produtos}
              onSuccess={handleDevolucaoSuccess}
              onCancel={closeDevolucaoForm}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
