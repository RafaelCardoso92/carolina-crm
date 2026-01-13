"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

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
  cliente: {
    id: string
    nome: string
    codigo: string | null
  }
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

export default function CobrancasView({ cobrancas, clientes, totalPendente, totalComissao, ano }: Props) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<"all" | "pending" | "paid">("pending")

  const filtered = cobrancas.filter(c => {
    if (filter === "pending") return !c.pago
    if (filter === "paid") return c.pago
    return true
  })

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const valor = parseFloat(formData.get("valor") as string)
    const comissaoPercent = 3.5 // Default commission percentage

    const data = {
      clienteId: formData.get("clienteId") as string,
      fatura: formData.get("fatura") as string || null,
      valor,
      valorSemIva: valor / 1.23, // Assuming 23% VAT
      comissao: (valor / 1.23) * (comissaoPercent / 100),
      dataEmissao: formData.get("dataEmissao") as string || null,
      notas: formData.get("notas") as string || null
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
        router.refresh()
      } else {
        const error = await res.json()
        alert(error.error || "Erro ao guardar cobranca")
      }
    } catch {
      alert("Erro ao guardar cobranca")
    } finally {
      setLoading(false)
    }
  }

  async function handleTogglePaid(id: string, pago: boolean) {
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
      alert("Erro ao atualizar cobranca")
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem a certeza que quer eliminar esta cobranca?")) return

    try {
      const res = await fetch(`/api/cobrancas/${id}`, { method: "DELETE" })
      if (res.ok) {
        router.refresh()
      } else {
        alert("Erro ao eliminar cobranca")
      }
    } catch {
      alert("Erro ao eliminar cobranca")
    }
  }

  function startEdit(cobranca: Cobranca) {
    setEditingId(cobranca.id)
    setShowForm(true)
  }

  const editingCobranca = editingId ? cobrancas.find(c => c.id === editingId) : null

  return (
    <div>
      {/* Year Selector */}
      <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
        <div className="flex flex-wrap items-center justify-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-gray-700">Filtrar por ano:</label>
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
              className="px-4 py-2.5 border-2 border-gray-200 rounded-xl text-gray-900 font-semibold focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none bg-white"
            >
              <option value="">Todos os anos</option>
              {[2023, 2024, 2025, 2026].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl shadow-sm p-6 border-l-4 border-orange-500">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-100 rounded-lg">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-gray-700">Total Pendente {ano ? `(${ano})` : ""}</h3>
          </div>
          <p className="text-3xl font-bold text-orange-600">{totalPendente.toFixed(2)} €</p>
          <p className="text-sm text-gray-500 mt-1">Por receber</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-6 border-l-4 border-purple-500">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-gray-700">Comissao a Receber {ano ? `(${ano})` : ""}</h3>
          </div>
          <p className="text-3xl font-bold text-purple-600">{totalComissao.toFixed(2)} €</p>
          <p className="text-sm text-gray-500 mt-1">3.5% das vendas pendentes</p>
        </div>
      </div>

      {/* Filter and Add Button */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div className="flex gap-2">
          {[
            { value: "pending", label: "Pendentes", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
            { value: "paid", label: "Pagas", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
            { value: "all", label: "Todas", icon: "M4 6h16M4 10h16M4 14h16M4 18h16" }
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value as typeof filter)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition ${
                filter === f.value
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-200"
                  : "bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={f.icon} />
              </svg>
              {f.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); }}
          className="bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-700 transition flex items-center gap-2 shadow-lg shadow-purple-200"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Adicionar Cobranca
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border-2 border-purple-100">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {editingId ? "Editar Cobranca" : "Nova Cobranca"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">Cliente *</label>
                <select
                  name="clienteId"
                  required
                  defaultValue={editingCobranca?.clienteId || ""}
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
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Numero da Fatura</label>
                <input
                  name="fatura"
                  type="text"
                  defaultValue={editingCobranca?.fatura || ""}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-gray-900 font-medium"
                  placeholder="Ex: FA2025/001"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Valor Total (com IVA) *</label>
                <div className="relative">
                  <input
                    name="valor"
                    type="number"
                    step="0.01"
                    required
                    defaultValue={editingCobranca?.valor ? String(editingCobranca.valor) : ""}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-gray-900 font-medium pr-10"
                    placeholder="0.00"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">€</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Data de Emissao</label>
                <input
                  name="dataEmissao"
                  type="date"
                  defaultValue={editingCobranca?.dataEmissao ? new Date(editingCobranca.dataEmissao).toISOString().split("T")[0] : ""}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-gray-900 font-medium"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Notas</label>
                <input
                  name="notas"
                  type="text"
                  defaultValue={editingCobranca?.notas || ""}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-gray-900 font-medium"
                  placeholder="Notas adicionais..."
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

      {/* Cobrancas Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b-2 border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Cliente</th>
                <th className="px-4 py-4 text-left text-sm font-bold text-gray-700">Fatura</th>
                <th className="px-4 py-4 text-right text-sm font-bold text-gray-700">Valor c/IVA</th>
                <th className="px-4 py-4 text-right text-sm font-bold text-gray-700">Sem IVA</th>
                <th className="px-4 py-4 text-right text-sm font-bold text-purple-700">Comissao</th>
                <th className="px-4 py-4 text-center text-sm font-bold text-gray-700">Estado</th>
                <th className="px-4 py-4 text-center text-sm font-bold text-gray-700">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((cobranca) => (
                <tr key={cobranca.id} className={`hover:bg-purple-50 transition ${cobranca.pago ? "bg-green-50/50" : ""}`}>
                  <td className="px-6 py-4">
                    <Link href={`/clientes/${cobranca.cliente.id}`} className="font-semibold text-gray-900 hover:text-purple-600 transition">
                      {cobranca.cliente.nome}
                    </Link>
                    {cobranca.cliente.codigo && (
                      <span className="text-gray-500 text-sm ml-2">({cobranca.cliente.codigo})</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-gray-700 font-medium">{cobranca.fatura || "-"}</td>
                  <td className="px-4 py-4 text-right font-bold text-gray-900">
                    {Number(cobranca.valor).toFixed(2)} €
                  </td>
                  <td className="px-4 py-4 text-right text-gray-600 font-medium">
                    {cobranca.valorSemIva ? Number(cobranca.valorSemIva).toFixed(2) : "-"} €
                  </td>
                  <td className="px-4 py-4 text-right text-purple-600 font-semibold">
                    {cobranca.comissao ? Number(cobranca.comissao).toFixed(2) : "-"} €
                  </td>
                  <td className="px-4 py-4 text-center">
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
                      {cobranca.pago ? "Pago" : "Pendente"}
                    </button>
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
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500 text-lg font-medium">Nenhuma cobranca encontrada</p>
            <p className="text-gray-400 mt-1">Clique em &quot;Adicionar Cobranca&quot; para comecar</p>
          </div>
        )}
      </div>
    </div>
  )
}
