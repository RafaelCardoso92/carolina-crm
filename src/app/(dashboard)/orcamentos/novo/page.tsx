"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { formatCurrency } from "@/lib/utils"

type Cliente = { id: string; nome: string; email: string | null }
type Prospecto = { id: string; nomeEmpresa: string; email: string | null }
type Produto = { id: string; nome: string; codigo: string | null; preco: string | null }

type ItemForm = {
  produtoId: string
  descricao: string
  quantidade: number
  precoUnit: number
  desconto: number
}

export default function NovoOrcamentoPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const clienteIdParam = searchParams.get("clienteId")
  const prospectoIdParam = searchParams.get("prospectoId")

  const [clientesRaw, setClientes] = useState<Cliente[]>([])
  const [prospectosRaw, setProspectos] = useState<Prospecto[]>([])
  const [produtosRaw, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(true)

  // Ensure these are always arrays
  const clientes = Array.isArray(clientesRaw) ? clientesRaw : []
  const prospectos = Array.isArray(prospectosRaw) ? prospectosRaw : []
  const produtos = Array.isArray(produtosRaw) ? produtosRaw : []
  const [saving, setSaving] = useState(false)

  const [tipo, setTipo] = useState<"cliente" | "prospecto">(prospectoIdParam ? "prospecto" : "cliente")
  const [clienteId, setClienteId] = useState(clienteIdParam || "")
  const [prospectoId, setProspectoId] = useState(prospectoIdParam || "")
  const [titulo, setTitulo] = useState("")
  const [introducao, setIntroducao] = useState("")
  const [condicoes, setCondicoes] = useState("Pagamento a 30 dias. IVA incluido.")
  const [validadeDias, setValidadeDias] = useState(30)
  const [itens, setItens] = useState<ItemForm[]>([
    { produtoId: "", descricao: "", quantidade: 1, precoUnit: 0, desconto: 0 }
  ])

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [clientesRes, prospectosRes, produtosRes] = await Promise.all([
        fetch("/api/clientes?limit=1000"),
        fetch("/api/prospectos?limit=1000"),
        fetch("/api/produtos?limit=1000")
      ])

      // Check if responses are OK
      if (!clientesRes.ok || !prospectosRes.ok || !produtosRes.ok) {
        console.error("API error - auth may not be ready")
        setLoading(false)
        return
      }

      const [clientesData, prospectosData, produtosData] = await Promise.all([
        clientesRes.json(),
        prospectosRes.json(),
        produtosRes.json()
      ])

      // Handle paginated responses (data property) or direct arrays
      const clientesList = Array.isArray(clientesData) ? clientesData : (clientesData?.data || [])
      const prospectosList = Array.isArray(prospectosData) ? prospectosData : (prospectosData?.data || [])
      const produtosList = Array.isArray(produtosData) ? produtosData : (produtosData?.data || [])

      setClientes(Array.isArray(clientesList) ? clientesList : [])
      setProspectos(Array.isArray(prospectosList) ? prospectosList : [])
      setProdutos(Array.isArray(produtosList) ? produtosList : [])
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  function addItem() {
    setItens([...itens, { produtoId: "", descricao: "", quantidade: 1, precoUnit: 0, desconto: 0 }])
  }

  function removeItem(index: number) {
    if (itens.length > 1) {
      setItens(itens.filter((_, i) => i !== index))
    }
  }

  function updateItem(index: number, field: keyof ItemForm, value: string | number) {
    const newItens = [...itens]
    newItens[index] = { ...newItens[index], [field]: value }

    // If produto selected, fill description and price
    if (field === "produtoId" && value) {
      const produto = produtos.find(p => p.id === value)
      if (produto) {
        newItens[index].descricao = produto.nome
        newItens[index].precoUnit = produto.preco ? Number(produto.preco) : 0
      }
    }

    setItens(newItens)
  }

  const subtotal = itens.reduce((sum, item) => {
    return sum + (item.quantidade * item.precoUnit - item.desconto)
  }, 0)
  const iva = subtotal * 0.23
  const total = subtotal + iva

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (tipo === "cliente" && !clienteId) {
      alert("Selecione um cliente")
      return
    }
    if (tipo === "prospecto" && !prospectoId) {
      alert("Selecione um prospecto")
      return
    }
    if (itens.every(i => !i.descricao)) {
      alert("Adicione pelo menos um item")
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/orcamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clienteId: tipo === "cliente" ? clienteId : null,
          prospectoId: tipo === "prospecto" ? prospectoId : null,
          titulo,
          introducao,
          condicoes,
          validadeDias,
          itens: itens.filter(i => i.descricao)
        })
      })

      if (res.ok) {
        router.push("/orcamentos")
      } else {
        const data = await res.json()
        alert(data.error || "Erro ao criar orcamento")
      }
    } catch (error) {
      console.error("Error creating orcamento:", error)
      alert("Erro ao criar orcamento")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-medium tracking-wide text-foreground">Novo Orcamento</h1>
        <p className="text-muted-foreground">Criar um novo orcamento</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Destinatario */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <h2 className="font-medium text-foreground mb-4">Destinatario</h2>

          <div className="flex gap-4 mb-4">
            <button
              type="button"
              onClick={() => setTipo("cliente")}
              className={`flex-1 py-3 px-4 rounded-xl border transition ${
                tipo === "cliente"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-primary/50"
              }`}
            >
              Cliente
            </button>
            <button
              type="button"
              onClick={() => setTipo("prospecto")}
              className={`flex-1 py-3 px-4 rounded-xl border transition ${
                tipo === "prospecto"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-primary/50"
              }`}
            >
              Prospecto
            </button>
          </div>

          {tipo === "cliente" ? (
            <select
              value={clienteId}
              onChange={e => setClienteId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background"
            >
              <option value="">Selecionar cliente...</option>
              {clientes.map(c => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          ) : (
            <select
              value={prospectoId}
              onChange={e => setProspectoId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background"
            >
              <option value="">Selecionar prospecto...</option>
              {prospectos.map(p => (
                <option key={p.id} value={p.id}>{p.nomeEmpresa}</option>
              ))}
            </select>
          )}
        </div>

        {/* Detalhes */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <h2 className="font-medium text-foreground mb-4">Detalhes</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Titulo</label>
              <input
                type="text"
                value={titulo}
                onChange={e => setTitulo(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background"
                placeholder="Ex: Proposta de produtos BABOR"
              />
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-1">Introducao</label>
              <textarea
                value={introducao}
                onChange={e => setIntroducao(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background resize-none"
                placeholder="Texto introdutorio do orcamento..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Validade (dias)</label>
                <input
                  type="number"
                  value={validadeDias}
                  onChange={e => setValidadeDias(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-1">Condicoes</label>
              <textarea
                value={condicoes}
                onChange={e => setCondicoes(e.target.value)}
                rows={2}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background resize-none"
              />
            </div>
          </div>
        </div>

        {/* Itens */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-medium text-foreground">Itens</h2>
            <button
              type="button"
              onClick={addItem}
              className="text-sm text-primary hover:text-primary-hover"
            >
              + Adicionar Item
            </button>
          </div>

          <div className="space-y-4">
            {itens.map((item, index) => (
              <div key={index} className="p-4 bg-muted/30 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Item {index + 1}</span>
                  {itens.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="text-red-500 text-sm hover:text-red-600"
                    >
                      Remover
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Produto (opcional)</label>
                  <select
                    value={item.produtoId}
                    onChange={e => updateItem(index, "produtoId", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                  >
                    <option value="">Selecionar produto...</option>
                    {produtos.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.codigo ? `[${p.codigo}] ` : ""}{p.nome}
                        {p.preco ? ` - ${formatCurrency(Number(p.preco))}` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Descricao</label>
                  <input
                    type="text"
                    value={item.descricao}
                    onChange={e => updateItem(index, "descricao", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                    placeholder="Descricao do item"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Qtd</label>
                    <input
                      type="number"
                      value={item.quantidade}
                      onChange={e => updateItem(index, "quantidade", Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Preco Unit.</label>
                    <input
                      type="number"
                      value={item.precoUnit}
                      onChange={e => updateItem(index, "precoUnit", Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Desconto</label>
                    <input
                      type="number"
                      value={item.desconto}
                      onChange={e => updateItem(index, "desconto", Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                      step="0.01"
                    />
                  </div>
                </div>

                <div className="text-right text-sm">
                  <span className="text-muted-foreground">Subtotal: </span>
                  <span className="font-medium">
                    {formatCurrency(item.quantidade * item.precoUnit - item.desconto)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totais */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="space-y-2 text-right">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal:</span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">IVA (23%):</span>
              <span className="font-medium">{formatCurrency(iva)}</span>
            </div>
            <div className="flex justify-between text-xl pt-2 border-t border-border">
              <span className="font-medium">Total:</span>
              <span className="font-bold">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-primary text-primary-foreground py-3 rounded-xl font-medium hover:bg-primary-hover transition disabled:opacity-50"
          >
            {saving ? "Criando..." : "Criar Orcamento"}
          </button>
          <Link
            href="/orcamentos"
            className="px-6 py-3 rounded-xl border border-border hover:bg-muted transition text-center"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
