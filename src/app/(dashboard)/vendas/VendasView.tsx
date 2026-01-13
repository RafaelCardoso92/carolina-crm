"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

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
}

type Venda = {
  id: string
  clienteId: string
  valor1: unknown
  valor2: unknown
  total: unknown
  mes: number
  ano: number
  notas: string | null
  cliente: {
    id: string
    nome: string
    codigo: string | null
  }
  itens?: ItemVenda[]
}

type Cliente = {
  id: string
  nome: string
  codigo: string | null
}

type Produto = {
  id: string
  nome: string
  codigo: string | null
  categoria: string | null
}

type FormItem = {
  produtoId: string
  quantidade: string
  precoUnit: string
}

type Props = {
  vendas: Venda[]
  clientes: Cliente[]
  produtos: Produto[]
  objetivo: number | null
  total: number
  mes: number
  ano: number
  meses: string[]
}

// VAT rate in Portugal
const IVA_RATE = 0.23

// Calculate VAT values
function calcularIVA(totalComIVA: number) {
  const semIVA = totalComIVA / (1 + IVA_RATE)
  const iva = totalComIVA - semIVA
  return { semIVA, iva }
}

export default function VendasView({ vendas, clientes, produtos, objetivo, total, mes, ano, meses }: Props) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedClienteId, setSelectedClienteId] = useState<string>("")
  const [formItems, setFormItems] = useState<FormItem[]>([])
  const [useItems, setUseItems] = useState(false)

  const progresso = objetivo ? (total / objetivo) * 100 : 0
  const falta = objetivo ? objetivo - total : 0

  // Calculate totals with VAT
  const { semIVA: totalSemIVA, iva: totalIVA } = calcularIVA(total)

  // Calculate items total
  const itemsTotal = useMemo(() => {
    return formItems.reduce((sum, item) => {
      const qty = parseFloat(item.quantidade) || 0
      const price = parseFloat(item.precoUnit) || 0
      return sum + (qty * price)
    }, 0)
  }, [formItems])

  // Get client's purchase history for upsell suggestions
  const clientPurchaseHistory = useMemo(() => {
    if (!selectedClienteId) return { purchased: new Set<string>(), neverPurchased: [] as Produto[] }

    const purchasedProductIds = new Set<string>()
    vendas.forEach(v => {
      if (v.clienteId === selectedClienteId && v.itens) {
        v.itens.forEach(item => purchasedProductIds.add(item.produtoId))
      }
    })

    const neverPurchased = produtos.filter(p => !purchasedProductIds.has(p.id))

    return { purchased: purchasedProductIds, neverPurchased }
  }, [selectedClienteId, vendas, produtos])

  // Reset form when closing
  useEffect(() => {
    if (!showForm) {
      setSelectedClienteId("")
      setFormItems([])
      setUseItems(false)
    }
  }, [showForm])

  // Initialize form when editing
  useEffect(() => {
    if (editingId) {
      const venda = vendas.find(v => v.id === editingId)
      if (venda) {
        setSelectedClienteId(venda.clienteId)
        if (venda.itens && venda.itens.length > 0) {
          setUseItems(true)
          setFormItems(venda.itens.map(item => ({
            produtoId: item.produtoId,
            quantidade: String(Number(item.quantidade)),
            precoUnit: String(Number(item.precoUnit))
          })))
        } else {
          setUseItems(false)
          setFormItems([])
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

  function updateItem(index: number, field: keyof FormItem, value: string) {
    const updated = [...formItems]
    updated[index] = { ...updated[index], [field]: value }
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

    const formData = new FormData(e.currentTarget)

    // Build items array if using items mode
    const itens = useItems ? formItems
      .filter(item => item.produtoId && item.quantidade && item.precoUnit)
      .map(item => ({
        produtoId: item.produtoId,
        quantidade: parseFloat(item.quantidade),
        precoUnit: parseFloat(item.precoUnit)
      })) : []

    const data = {
      clienteId: formData.get("clienteId") as string,
      valor1: !useItems && formData.get("valor1") ? parseFloat(formData.get("valor1") as string) : null,
      valor2: !useItems && formData.get("valor2") ? parseFloat(formData.get("valor2") as string) : null,
      notas: formData.get("notas") as string || null,
      itens,
      mes,
      ano
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
        alert(error.error || "Erro ao guardar venda")
      }
    } catch {
      alert("Erro ao guardar venda")
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem a certeza que quer eliminar esta venda?")) return

    try {
      const res = await fetch(`/api/vendas/${id}`, { method: "DELETE" })
      if (res.ok) {
        router.refresh()
      } else {
        alert("Erro ao eliminar venda")
      }
    } catch {
      alert("Erro ao eliminar venda")
    }
  }

  function startEdit(venda: Venda) {
    setEditingId(venda.id)
    setShowForm(true)
  }

  const editingVenda = editingId ? vendas.find(v => v.id === editingId) : null

  return (
    <div>
      {/* Navigation and Summary */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
        {/* Year and Month Selectors */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-gray-700">Ano:</label>
            <select
              value={ano}
              onChange={(e) => router.push(`/vendas?mes=${mes}&ano=${e.target.value}`)}
              className="px-4 py-2.5 border-2 border-gray-200 rounded-xl text-gray-900 font-semibold focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none bg-white"
            >
              {[2023, 2024, 2025, 2026].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-gray-700">Mes:</label>
            <select
              value={mes}
              onChange={(e) => router.push(`/vendas?mes=${e.target.value}&ano=${ano}`)}
              className="px-4 py-2.5 border-2 border-gray-200 rounded-xl text-gray-900 font-semibold focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none bg-white"
            >
              {meses.slice(1).map((m, i) => (
                <option key={i + 1} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Month Navigation with Arrows */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigateMonth(-1)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition text-gray-700 font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">Anterior</span>
          </button>
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-800">{meses[mes]} {ano}</h2>
          </div>
          <button
            onClick={() => navigateMonth(1)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition text-gray-700 font-medium"
          >
            <span className="hidden sm:inline">Seguinte</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* VAT Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <p className="text-sm font-medium text-gray-500 mb-1">Total sem IVA</p>
            <p className="text-2xl font-bold text-gray-700">{totalSemIVA.toFixed(2)} €</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-4 text-center">
            <p className="text-sm font-medium text-blue-600 mb-1">IVA (23%)</p>
            <p className="text-2xl font-bold text-blue-700">{totalIVA.toFixed(2)} €</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-4 text-center">
            <p className="text-sm font-medium text-purple-600 mb-1">Total com IVA</p>
            <p className="text-2xl font-bold text-purple-700">{total.toFixed(2)} €</p>
          </div>
        </div>

        {/* Progress Bar */}
        {objetivo && (
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium text-gray-700">Objetivo: {objetivo.toFixed(2)} €</span>
              <span className={`font-bold ${progresso >= 100 ? "text-green-600" : "text-orange-600"}`}>
                {progresso >= 100 ? "Objetivo atingido!" : `Falta: ${falta.toFixed(2)} €`}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className={`h-4 rounded-full transition-all ${progresso >= 100 ? "bg-green-500" : "bg-purple-500"}`}
                style={{ width: `${Math.min(progresso, 100)}%` }}
              />
            </div>
            <p className="text-center mt-2 text-sm font-medium text-gray-600">{progresso.toFixed(1)}% do objetivo</p>
          </div>
        )}
      </div>

      {/* Add Sale Button */}
      <div className="flex justify-end mb-6">
        <button
          onClick={() => { setShowForm(true); setEditingId(null); }}
          className="bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-700 transition flex items-center gap-2 shadow-lg shadow-purple-200"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Adicionar Venda
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border-2 border-purple-100">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            {editingId ? "Editar Venda" : "Nova Venda"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Cliente *
                </label>
                <select
                  name="clienteId"
                  required
                  value={selectedClienteId}
                  onChange={(e) => setSelectedClienteId(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-gray-900 font-medium bg-white"
                >
                  <option value="">Escolher cliente...</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome} {c.codigo ? `(${c.codigo})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mode Toggle */}
              <div className="md:col-span-2">
                <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                  <span className="text-sm font-semibold text-gray-700">Modo de entrada:</span>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={!useItems}
                      onChange={() => setUseItems(false)}
                      className="w-4 h-4 text-purple-600"
                    />
                    <span className="text-sm text-gray-700">Valores manuais</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={useItems}
                      onChange={() => { setUseItems(true); if (formItems.length === 0) addItem(); }}
                      className="w-4 h-4 text-purple-600"
                    />
                    <span className="text-sm text-gray-700">Por produtos</span>
                  </label>
                </div>
              </div>

              {/* Manual Values Mode */}
              {!useItems && (
                <>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Valor 1 (com IVA)
                    </label>
                    <div className="relative">
                      <input
                        name="valor1"
                        type="number"
                        step="0.01"
                        defaultValue={editingVenda?.valor1 ? String(editingVenda.valor1) : ""}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-gray-900 font-medium pr-10"
                        placeholder="0.00"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">€</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Valor 2 (com IVA)
                    </label>
                    <div className="relative">
                      <input
                        name="valor2"
                        type="number"
                        step="0.01"
                        defaultValue={editingVenda?.valor2 ? String(editingVenda.valor2) : ""}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-gray-900 font-medium pr-10"
                        placeholder="0.00"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">€</span>
                    </div>
                  </div>
                </>
              )}

              {/* Products Mode */}
              {useItems && (
                <div className="md:col-span-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-bold text-gray-700">
                      Itens da Venda
                    </label>
                    <button
                      type="button"
                      onClick={addItem}
                      className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-sm font-semibold hover:bg-purple-200 transition flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Adicionar
                    </button>
                  </div>

                  {formItems.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">Clique em &quot;Adicionar&quot; para adicionar produtos</p>
                  ) : (
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="grid grid-cols-12 gap-2 text-xs font-bold text-gray-500 px-1">
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
                              <select
                                value={item.produtoId}
                                onChange={(e) => updateItem(index, "produtoId", e.target.value)}
                                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none bg-white"
                              >
                                <option value="">Selecionar...</option>
                                {produtos.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.nome} {p.codigo ? `(${p.codigo})` : ""}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="col-span-2">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.quantidade}
                                onChange={(e) => updateItem(index, "quantidade", e.target.value)}
                                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm text-center focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
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
                                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm text-center focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                                placeholder="0.00"
                              />
                            </div>
                            <div className="col-span-2 text-right text-sm font-semibold text-gray-700">
                              {subtotal.toFixed(2)} €
                            </div>
                            <div className="col-span-1 flex justify-center">
                              <button
                                type="button"
                                onClick={() => removeItem(index)}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        )
                      })}

                      {/* Total */}
                      <div className="flex justify-end pt-2 border-t border-gray-200">
                        <div className="text-right">
                          <span className="text-sm text-gray-500">Total: </span>
                          <span className="text-lg font-bold text-purple-700">{itemsTotal.toFixed(2)} €</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Upsell Suggestions */}
                  {selectedClienteId && clientPurchaseHistory.neverPurchased.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        <span className="text-sm font-bold text-amber-800">Sugestões de Upsell</span>
                      </div>
                      <p className="text-xs text-amber-700 mb-2">Este cliente nunca comprou:</p>
                      <div className="flex flex-wrap gap-2">
                        {clientPurchaseHistory.neverPurchased.slice(0, 6).map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setFormItems([...formItems, { produtoId: p.id, quantidade: "1", precoUnit: "" }])
                            }}
                            className="px-3 py-1 bg-white border border-amber-300 rounded-full text-xs font-medium text-amber-800 hover:bg-amber-100 transition"
                          >
                            + {p.nome}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Notas
                </label>
                <input
                  name="notas"
                  type="text"
                  defaultValue={editingVenda?.notas || ""}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-gray-900 font-medium"
                  placeholder="Notas adicionais"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-purple-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
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
                onClick={() => { setShowForm(false); setEditingId(null); }}
                className="px-6 py-3 border-2 border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition flex items-center gap-2"
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

      {/* Sales Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b-2 border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Cliente</th>
                <th className="px-4 py-4 text-left text-sm font-bold text-gray-700">Produtos</th>
                <th className="px-4 py-4 text-right text-sm font-bold text-gray-700">Sem IVA</th>
                <th className="px-4 py-4 text-right text-sm font-bold text-blue-700">IVA (23%)</th>
                <th className="px-4 py-4 text-right text-sm font-bold text-purple-700">Total c/IVA</th>
                <th className="px-4 py-4 text-left text-sm font-bold text-gray-700">Notas</th>
                <th className="px-4 py-4 text-center text-sm font-bold text-gray-700">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {vendas.map((venda) => {
                const vendaTotal = Number(venda.total)
                const { semIVA, iva } = calcularIVA(vendaTotal)
                const hasItems = venda.itens && venda.itens.length > 0
                return (
                  <tr key={venda.id} className="hover:bg-purple-50 transition">
                    <td className="px-6 py-4">
                      <Link href={`/clientes/${venda.cliente.id}`} className="font-semibold text-gray-900 hover:text-purple-600 transition">
                        {venda.cliente.nome}
                      </Link>
                      {venda.cliente.codigo && (
                        <span className="text-gray-500 text-sm ml-2">({venda.cliente.codigo})</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {hasItems ? (
                        <div className="space-y-1">
                          {venda.itens!.map((item, idx) => (
                            <div key={idx} className="text-sm">
                              <span className="font-medium text-gray-700">{item.produto.nome}</span>
                              <span className="text-gray-500 ml-1">
                                ({Number(item.quantidade)} × {Number(item.precoUnit).toFixed(2)}€)
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">
                          {venda.valor1 ? <div>V1: {Number(venda.valor1).toFixed(2)}€</div> : null}
                          {venda.valor2 ? <div>V2: {Number(venda.valor2).toFixed(2)}€</div> : null}
                          {!venda.valor1 && !venda.valor2 ? <span>-</span> : null}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right text-gray-600 font-medium">
                      {semIVA.toFixed(2)} €
                    </td>
                    <td className="px-4 py-4 text-right text-blue-600 font-medium">
                      {iva.toFixed(2)} €
                    </td>
                    <td className="px-4 py-4 text-right font-bold text-purple-700">
                      {vendaTotal.toFixed(2)} €
                    </td>
                    <td className="px-4 py-4 text-gray-600 text-sm">{venda.notas || "-"}</td>
                    <td className="px-4 py-4">
                      <div className="flex justify-center gap-1">
                        <button
                          onClick={() => startEdit(venda)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                          title="Editar"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(venda.id)}
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
                )
              })}
            </tbody>
            {vendas.length > 0 && (
              <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                <tr>
                  <td className="px-6 py-4 font-bold text-gray-900">TOTAIS</td>
                  <td className="px-4 py-4 text-gray-500 text-sm">{vendas.length} vendas</td>
                  <td className="px-4 py-4 text-right text-gray-700 font-bold">
                    {totalSemIVA.toFixed(2)} €
                  </td>
                  <td className="px-4 py-4 text-right text-blue-700 font-bold">
                    {totalIVA.toFixed(2)} €
                  </td>
                  <td className="px-4 py-4 text-right font-bold text-purple-700 text-lg">
                    {total.toFixed(2)} €
                  </td>
                  <td colSpan={2}></td>
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
            <p className="text-gray-500 text-lg font-medium">Nenhuma venda em {meses[mes]} {ano}</p>
            <p className="text-gray-400 mt-1">Clique em &quot;Adicionar Venda&quot; para comecar</p>
          </div>
        )}
      </div>
    </div>
  )
}
