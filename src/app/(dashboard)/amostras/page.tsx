"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Swal from "sweetalert2"
import { formatCurrency } from "@/lib/utils"

type Amostra = {
  id: string
  tipo: "AMOSTRA" | "BRINDE" | "DEMONSTRACAO"
  descricao: string | null
  quantidade: number
  valorEstimado: string | null
  dataEntrega: string
  notas: string | null
  cliente: { id: string; nome: string } | null
  prospecto: { id: string; nomeEmpresa: string } | null
  produto: { id: string; nome: string; codigo: string | null } | null
}

type Cliente = {
  id: string
  nome: string
}

type Prospecto = {
  id: string
  nomeEmpresa: string
}

type Produto = {
  id: string
  nome: string
  codigo: string | null
}

const tipoLabels: Record<string, string> = {
  AMOSTRA: "Amostra",
  BRINDE: "Brinde",
  DEMONSTRACAO: "Demonstração"
}

const tipoColors: Record<string, string> = {
  AMOSTRA: "bg-blue-100 text-blue-700",
  BRINDE: "bg-purple-100 text-purple-700",
  DEMONSTRACAO: "bg-green-100 text-green-700"
}

export default function AmostrasPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const seller = searchParams.get("seller")
  
  const [amostras, setAmostras] = useState<Amostra[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [prospectos, setProspectos] = useState<Prospecto[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState<string>("all")
  const [search, setSearch] = useState("")

  const [formData, setFormData] = useState({
    tipo: "AMOSTRA",
    clienteId: "",
    prospectoId: "",
    produtoId: "",
    descricao: "",
    quantidade: "1",
    valorEstimado: "",
    dataEntrega: new Date().toISOString().split("T")[0],
    notas: ""
  })

  useEffect(() => {
    fetchData()
  }, [seller])

  async function fetchData() {
    setLoading(true)
    try {
      const [amostrasRes, clientesRes, prospectosRes, produtosRes] = await Promise.all([
        fetch(`/api/amostras?limit=200${seller ? `&seller=${seller}` : ""}`),
        fetch("/api/clientes?limit=500"),
        fetch("/api/prospectos?limit=500"),
        fetch("/api/produtos?limit=500")
      ])

      if (amostrasRes.ok) setAmostras(await amostrasRes.json())
      if (clientesRes.ok) {
        const data = await clientesRes.json()
        setClientes(data.clientes || data)
      }
      if (prospectosRes.ok) {
        const data = await prospectosRes.json()
        setProspectos(data.prospectos || data)
      }
      if (produtosRes.ok) setProdutos(await produtosRes.json())
    } catch (error) {
      console.error("Error fetching data:", error)
    }
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!formData.clienteId && !formData.prospectoId) {
      Swal.fire({
        icon: "warning",
        title: "Atencao",
        text: "Selecione um cliente ou prospecto",
        confirmButtonColor: "#b8860b"
      })
      return
    }

    try {
      const res = await fetch("/api/amostras", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          clienteId: formData.clienteId || null,
          prospectoId: formData.prospectoId || null,
          produtoId: formData.produtoId || null,
          quantidade: parseInt(formData.quantidade),
          valorEstimado: formData.valorEstimado || null
        })
      })

      if (res.ok) {
        setShowForm(false)
        setFormData({
          tipo: "AMOSTRA",
          clienteId: "",
          prospectoId: "",
          produtoId: "",
          descricao: "",
          quantidade: "1",
          valorEstimado: "",
          dataEntrega: new Date().toISOString().split("T")[0],
          notas: ""
        })
        fetchData()
        Swal.fire({
          icon: "success",
          title: "Sucesso",
          text: "Amostra registada com sucesso",
          confirmButtonColor: "#b8860b"
        })
      } else {
        Swal.fire({
          icon: "error",
          title: "Erro",
          text: "Erro ao registar amostra",
          confirmButtonColor: "#b8860b"
        })
      }
    } catch (error) {
      console.error("Error:", error)
      Swal.fire({
        icon: "error",
        title: "Erro",
        text: "Erro ao registar amostra",
        confirmButtonColor: "#b8860b"
      })
    }
  }

  async function handleDelete(id: string) {
    const result = await Swal.fire({
      title: "Eliminar amostra?",
      text: "Tem a certeza que quer eliminar este registo?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#c41e3a",
      cancelButtonColor: "#666666",
      confirmButtonText: "Sim, eliminar",
      cancelButtonText: "Cancelar"
    })

    if (!result.isConfirmed) return

    try {
      const res = await fetch(`/api/amostras/${id}`, { method: "DELETE" })
      if (res.ok) {
        fetchData()
      } else {
        Swal.fire({
          icon: "error",
          title: "Erro",
          text: "Erro ao eliminar amostra",
          confirmButtonColor: "#b8860b"
        })
      }
    } catch (error) {
      console.error("Error:", error)
    }
  }

  const filteredAmostras = amostras.filter(a => {
    const matchFilter = filter === "all" || a.tipo === filter
    const matchSearch = search === "" || 
      a.cliente?.nome.toLowerCase().includes(search.toLowerCase()) ||
      a.prospecto?.nomeEmpresa.toLowerCase().includes(search.toLowerCase()) ||
      a.produto?.nome.toLowerCase().includes(search.toLowerCase()) ||
      a.descricao?.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  // Stats
  const totalAmostras = amostras.filter(a => a.tipo === "AMOSTRA").length
  const totalBrindes = amostras.filter(a => a.tipo === "BRINDE").length
  const totalDemos = amostras.filter(a => a.tipo === "DEMONSTRACAO").length
  const valorTotal = amostras.reduce((sum, a) => sum + (a.valorEstimado ? parseFloat(a.valorEstimado) * a.quantidade : 0), 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Amostras & Brindes</h1>
          <p className="text-muted-foreground text-sm mt-1">Controlo de amostras, brindes e demonstracoes</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-primary text-primary-foreground px-4 md:px-6 py-2.5 md:py-3 rounded-xl font-semibold hover:bg-primary-hover transition flex items-center justify-center gap-2 shadow-lg shadow-primary/20 text-sm md:text-base"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="hidden sm:inline">Nova Amostra</span>
          <span className="sm:hidden">Nova</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground uppercase font-medium">Amostras</p>
          <p className="text-2xl font-bold text-blue-600">{totalAmostras}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground uppercase font-medium">Brindes</p>
          <p className="text-2xl font-bold text-purple-600">{totalBrindes}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground uppercase font-medium">Demonstracoes</p>
          <p className="text-2xl font-bold text-green-600">{totalDemos}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground uppercase font-medium">Valor Estimado</p>
          <p className="text-2xl font-bold text-primary">{formatCurrency(valorTotal)}€</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl border border-border p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Pesquisar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-card text-foreground"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {["all", "AMOSTRA", "BRINDE", "DEMONSTRACAO"].map(tipo => (
              <button
                key={tipo}
                onClick={() => setFilter(tipo)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  filter === tipo
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {tipo === "all" ? "Todas" : tipoLabels[tipo]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">Nova Amostra</h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-secondary rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Tipo *</label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                  className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none bg-card"
                >
                  <option value="AMOSTRA">Amostra</option>
                  <option value="BRINDE">Brinde</option>
                  <option value="DEMONSTRACAO">Demonstracao</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Cliente</label>
                <select
                  value={formData.clienteId}
                  onChange={(e) => setFormData({ ...formData, clienteId: e.target.value, prospectoId: "" })}
                  className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none bg-card"
                >
                  <option value="">Selecionar cliente...</option>
                  {clientes.map(c => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Ou Prospecto</label>
                <select
                  value={formData.prospectoId}
                  onChange={(e) => setFormData({ ...formData, prospectoId: e.target.value, clienteId: "" })}
                  className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none bg-card"
                >
                  <option value="">Selecionar prospecto...</option>
                  {prospectos.map(p => (
                    <option key={p.id} value={p.id}>{p.nomeEmpresa}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Produto</label>
                <select
                  value={formData.produtoId}
                  onChange={(e) => setFormData({ ...formData, produtoId: e.target.value })}
                  className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none bg-card"
                >
                  <option value="">Selecionar produto...</option>
                  {produtos.map(p => (
                    <option key={p.id} value={p.id}>{p.nome} {p.codigo ? `(${p.codigo})` : ""}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Quantidade</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.quantidade}
                    onChange={(e) => setFormData({ ...formData, quantidade: e.target.value })}
                    className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none bg-card"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Valor Estimado</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.valorEstimado}
                    onChange={(e) => setFormData({ ...formData, valorEstimado: e.target.value })}
                    className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none bg-card"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Data de Entrega</label>
                <input
                  type="date"
                  value={formData.dataEntrega}
                  onChange={(e) => setFormData({ ...formData, dataEntrega: e.target.value })}
                  className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none bg-card"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Descrição</label>
                <input
                  type="text"
                  placeholder="Descricao da amostra..."
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none bg-card"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Notas</label>
                <textarea
                  placeholder="Notas adicionais..."
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none bg-card resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold hover:bg-primary-hover transition"
                >
                  Guardar
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-3 border border-border rounded-xl font-bold text-foreground hover:bg-secondary transition"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {filteredAmostras.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-8 text-center text-muted-foreground">
            Nenhuma amostra encontrada
          </div>
        ) : (
          filteredAmostras.map(amostra => (
            <div
              key={amostra.id}
              className="bg-card rounded-xl border border-border p-4 hover:border-primary/30 transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${tipoColors[amostra.tipo]}`}>
                      {tipoLabels[amostra.tipo]}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(amostra.dataEntrega).toLocaleDateString("pt-PT")}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-1">
                    {amostra.cliente ? (
                      <Link href={`/clientes/${amostra.cliente.id}`} className="font-medium text-foreground hover:text-primary">
                        {amostra.cliente.nome}
                      </Link>
                    ) : amostra.prospecto ? (
                      <Link href={`/prospectos/${amostra.prospecto.id}`} className="font-medium text-foreground hover:text-primary">
                        {amostra.prospecto.nomeEmpresa}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">Sem destinatario</span>
                    )}
                  </div>

                  {amostra.produto && (
                    <p className="text-sm text-muted-foreground">
                      Produto: {amostra.produto.nome} {amostra.produto.codigo ? `(${amostra.produto.codigo})` : ""}
                    </p>
                  )}
                  {amostra.descricao && (
                    <p className="text-sm text-muted-foreground">{amostra.descricao}</p>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Qtd: {amostra.quantidade}</p>
                    {amostra.valorEstimado && (
                      <p className="font-semibold text-foreground">
                        {formatCurrency(parseFloat(amostra.valorEstimado) * amostra.quantidade)}€
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(amostra.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Eliminar"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
