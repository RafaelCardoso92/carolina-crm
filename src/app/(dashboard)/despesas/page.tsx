"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { isAdminOrHigher } from "@/lib/permissions"
import SellerTabs from "@/components/SellerTabs"
import Swal from "sweetalert2"
import { Suspense } from "react"

const MESES = [
  "", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
]

const TIPOS = [
  { value: "HOTEL", label: "Hotel", icon: "🏨", defaultValue: 70 },
  { value: "COMBUSTIVEL", label: "Combustível", icon: "⛽", defaultValue: 0 },
  { value: "GLP", label: "GLP", icon: "🔥", defaultValue: 0 },
  { value: "ESTACIONAMENTO", label: "Estacionamento", icon: "🅿️", defaultValue: 0 },
  { value: "PORTAGENS", label: "Portagens", icon: "🛣️", defaultValue: 0 },
  { value: "RESTAURANTE", label: "Restaurante", icon: "🍽️", defaultValue: 0 },
  { value: "OUTRO", label: "Outro", icon: "📦", defaultValue: 0 }
]

type Despesa = {
  id: string
  tipo: string
  valor: number
  data: string
  descricao: string | null
  mes: number
  ano: number
  imagens: Array<{
    id: string
    filename: string
    storedName: string
    mimeType: string
  }>
  user?: {
    id: string
    name: string | null
    email: string
  }
}

function DespesasContent() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const seller = searchParams.get("seller")
  const showSellerTabs = session?.user?.role && isAdminOrHigher(session.user.role)

  const currentDate = new Date()
  const [mes, setMes] = useState(currentDate.getMonth() + 1)
  const [ano, setAno] = useState(currentDate.getFullYear())
  const [despesas, setDespesas] = useState<Despesa[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Form state
  const [formTipo, setFormTipo] = useState("HOTEL")
  const [formValor, setFormValor] = useState("70")
  const [formData, setFormData] = useState(new Date().toISOString().split("T")[0])
  const [formDescricao, setFormDescricao] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchDespesas()
  }, [mes, ano, seller])

  async function fetchDespesas() {
    setLoading(true)
    try {
      const url = `/api/despesas?mes=${mes}&ano=${ano}${seller ? `&seller=${seller}` : ""}`
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setDespesas(data)
      }
    } catch (error) {
      console.error("Error fetching despesas:", error)
    } finally {
      setLoading(false)
    }
  }

  function handleTipoChange(tipo: string) {
    setFormTipo(tipo)
    const tipoConfig = TIPOS.find(t => t.value === tipo)
    if (tipoConfig && !editingId) {
      setFormValor(tipoConfig.defaultValue.toString())
    }
  }

  function resetForm() {
    setFormTipo("HOTEL")
    setFormValor("70")
    setFormData(new Date().toISOString().split("T")[0])
    setFormDescricao("")
    setEditingId(null)
    setShowForm(false)
  }

  function handleEdit(despesa: Despesa) {
    setFormTipo(despesa.tipo)
    setFormValor(despesa.valor.toString())
    setFormData(despesa.data.split("T")[0])
    setFormDescricao(despesa.descricao || "")
    setEditingId(despesa.id)
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      const url = editingId ? `/api/despesas/${editingId}` : "/api/despesas"
      const method = editingId ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: formTipo,
          valor: parseFloat(formValor),
          data: formData,
          descricao: formDescricao || null
        })
      })

      if (res.ok) {
        const newDespesa = await res.json()
        
        // If creating and file is selected, upload it
        if (!editingId && fileInputRef.current?.files?.length) {
          await uploadImage(newDespesa.id, fileInputRef.current.files[0])
        }

        Swal.fire({
          icon: "success",
          title: editingId ? "Despesa atualizada!" : "Despesa criada!",
          timer: 1500,
          showConfirmButton: false
        })
        resetForm()
        fetchDespesas()
      } else {
        throw new Error("Erro ao guardar despesa")
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Erro",
        text: "Não foi possível guardar a despesa"
      })
    } finally {
      setSaving(false)
    }
  }

  async function uploadImage(despesaId: string, file: File) {
    const formData = new FormData()
    formData.append("file", file)

    await fetch(`/api/despesas/${despesaId}/imagens`, {
      method: "POST",
      body: formData
    })
  }

  async function handleDelete(id: string) {
    const result = await Swal.fire({
      icon: "warning",
      title: "Eliminar despesa?",
      text: "Esta ação não pode ser revertida.",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar"
    })

    if (result.isConfirmed) {
      const res = await fetch(`/api/despesas/${id}`, { method: "DELETE" })
      if (res.ok) {
        Swal.fire({ icon: "success", title: "Eliminada!", timer: 1500, showConfirmButton: false })
        fetchDespesas()
      }
    }
  }

  async function handleAddImage(despesaId: string) {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*,application/pdf"
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        await uploadImage(despesaId, file)
        Swal.fire({ icon: "success", title: "Imagem adicionada!", timer: 1500, showConfirmButton: false })
        fetchDespesas()
      }
    }
    input.click()
  }

  async function handleDeleteImage(despesaId: string, imagemId: string) {
    const res = await fetch(`/api/despesas/${despesaId}/imagens?imagemId=${imagemId}`, {
      method: "DELETE"
    })
    if (res.ok) {
      fetchDespesas()
    }
  }

  async function exportPdf() {
    const url = `/api/despesas/pdf?mes=${mes}&ano=${ano}${seller ? `&seller=${seller}` : ""}`
    const res = await fetch(url)
    
    if (!res.ok) {
      const data = await res.json()
      Swal.fire({ icon: "error", title: "Erro", text: data.error || "Erro ao gerar PDF" })
      return
    }

    const blob = await res.blob()
    const downloadUrl = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = downloadUrl
    a.download = `Despesas_${MESES[mes]}_${ano}.pdf`
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(downloadUrl)
  }

  // Calculate totals
  const totalByType: Record<string, number> = {}
  let grandTotal = 0
  for (const d of despesas) {
    totalByType[d.tipo] = (totalByType[d.tipo] || 0) + d.valor
    grandTotal += d.valor
  }

  const anosDisponiveis = [ano, ano - 1, ano - 2]

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Despesas</h1>
          <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold rounded-full">
            α ALPHA
          </span>
        </div>
        <p className="text-muted-foreground">Registe as suas despesas de trabalho</p>
      </div>

      {showSellerTabs && <SellerTabs />}

      {/* Month/Year Selector + Actions */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select
          value={mes}
          onChange={(e) => setMes(parseInt(e.target.value))}
          className="px-4 py-2 border border-border rounded-xl bg-background text-foreground"
        >
          {MESES.slice(1).map((m, i) => (
            <option key={i + 1} value={i + 1}>{m}</option>
          ))}
        </select>
        <select
          value={ano}
          onChange={(e) => setAno(parseInt(e.target.value))}
          className="px-4 py-2 border border-border rounded-xl bg-background text-foreground"
        >
          {anosDisponiveis.map(a => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <div className="flex-1" />
        <button
          onClick={exportPdf}
          disabled={despesas.length === 0}
          className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-foreground rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition disabled:opacity-50 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Exportar PDF
        </button>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nova Despesa
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {TIPOS.slice(0, 4).map(tipo => (
          <div key={tipo.value} className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{tipo.icon}</span>
              <span className="text-sm text-muted-foreground">{tipo.label}</span>
            </div>
            <p className="text-xl font-bold">€{(totalByType[tipo.value] || 0).toFixed(2)}</p>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-4 border border-primary/20 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-muted-foreground">Total {MESES[mes]} {ano}</p>
            <p className="text-3xl font-bold text-primary">€{grandTotal.toFixed(2)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">{despesas.length} despesas</p>
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl p-6 w-full max-w-md border border-border">
            <h2 className="text-xl font-bold mb-4">
              {editingId ? "Editar Despesa" : "Nova Despesa"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tipo</label>
                <div className="grid grid-cols-4 gap-2">
                  {TIPOS.map(tipo => (
                    <button
                      key={tipo.value}
                      type="button"
                      onClick={() => handleTipoChange(tipo.value)}
                      className={`p-2 rounded-xl border text-center transition ${
                        formTipo === tipo.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <span className="text-xl block">{tipo.icon}</span>
                      <span className="text-xs">{tipo.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Valor (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formValor}
                    onChange={(e) => setFormValor(e.target.value)}
                    className="w-full px-4 py-2 border border-border rounded-xl bg-background"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Data</label>
                  <input
                    type="date"
                    value={formData}
                    onChange={(e) => setFormData(e.target.value)}
                    className="w-full px-4 py-2 border border-border rounded-xl bg-background"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Descrição (opcional)</label>
                <textarea
                  value={formDescricao}
                  onChange={(e) => setFormDescricao(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2 border border-border rounded-xl bg-background resize-none"
                  placeholder="Ex: Jantar com cliente..."
                />
              </div>

              {!editingId && (
                <div>
                  <label className="block text-sm font-medium mb-1">Comprovativo (opcional)</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    className="w-full text-sm"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 border border-border rounded-xl hover:bg-muted transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition disabled:opacity-50"
                >
                  {saving ? "A guardar..." : editingId ? "Guardar" : "Criar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Despesas List */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">A carregar...</div>
      ) : despesas.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p>Sem despesas para {MESES[mes]} {ano}</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition"
          >
            Adicionar primeira despesa
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {despesas.map(despesa => {
            const tipoConfig = TIPOS.find(t => t.value === despesa.tipo)
            return (
              <div key={despesa.id} className="bg-card rounded-xl p-4 border border-border hover:border-primary/30 transition">
                <div className="flex items-start gap-4">
                  <div className="text-3xl">{tipoConfig?.icon || "📦"}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{tipoConfig?.label || despesa.tipo}</span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(despesa.data).toLocaleDateString("pt-PT")}
                      </span>
                      {showSellerTabs && despesa.user && (
                        <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                          {despesa.user.name || despesa.user.email}
                        </span>
                      )}
                    </div>
                    {despesa.descricao && (
                      <p className="text-sm text-muted-foreground mb-2">{despesa.descricao}</p>
                    )}
                    {despesa.imagens.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {despesa.imagens.map(img => (
                          <div key={img.id} className="relative group">
                            <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center text-2xl">
                              {img.mimeType.startsWith("image/") ? "🖼️" : "📄"}
                            </div>
                            <button
                              onClick={() => handleDeleteImage(despesa.id, img.id)}
                              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold">€{despesa.valor.toFixed(2)}</p>
                    <div className="flex gap-1 mt-2">
                      <button
                        onClick={() => handleAddImage(despesa.id)}
                        className="p-1.5 text-muted-foreground hover:text-primary transition"
                        title="Adicionar imagem"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleEdit(despesa)}
                        className="p-1.5 text-muted-foreground hover:text-primary transition"
                        title="Editar"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(despesa.id)}
                        className="p-1.5 text-muted-foreground hover:text-red-500 transition"
                        title="Eliminar"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function DespesasPage() {
  return (
    <Suspense fallback={<div className="p-6">A carregar...</div>}>
      <DespesasContent />
    </Suspense>
  )
}
