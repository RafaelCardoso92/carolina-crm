"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { formatCurrency } from "@/lib/utils"
import ProductPicker from "@/components/ProductPicker"

type Cliente = { id: string; nome: string; email: string | null }
type Prospecto = { id: string; nomeEmpresa: string; email: string | null }
type Produto = { id: string; nome: string; codigo: string | null; categoria: string | null; preco: string | null }
type ObjetivoVario = {
  id: string
  titulo: string
  descricao: string | null
  produtos: Array<{
    id: string
    nome: string
    precoSemIva: string
    quantidade: number
  }>
  totalValor: number
}
type Campanha = {
  id: string
  titulo: string
  descricao: string | null
  produtos: Array<{
    id: string
    nome: string
    precoUnit: string
    quantidade: number
  }>
  totalSemIva: number
}

type ItemForm = {
  produtoId: string
  descricao: string
  quantidade: number
  precoUnit: number
  desconto: number
}

type VariosItemForm = {
  objetivoId: string
  titulo: string
  valor: number
}

type CampanhaItemForm = {
  campanhaId: string
  titulo: string
  quantidade: number
  precoUnit: number
}

export default function NovoOrcamentoPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const clienteIdParam = searchParams.get("clienteId")
  const prospectoIdParam = searchParams.get("prospectoId")

  const [clientesRaw, setClientes] = useState<Cliente[]>([])
  const [prospectosRaw, setProspectos] = useState<Prospecto[]>([])
  const [produtosRaw, setProdutos] = useState<Produto[]>([])
  const [objetivosVarios, setObjetivosVarios] = useState<ObjetivoVario[]>([])
  const [campanhas, setCampanhas] = useState<Campanha[]>([])
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
  const [variosItens, setVariosItens] = useState<VariosItemForm[]>([])
  const [campanhaItens, setCampanhaItens] = useState<CampanhaItemForm[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [clientesRes, prospectosRes, produtosRes, objetivosRes, campanhasRes] = await Promise.all([
        fetch("/api/clientes?limit=1000"),
        fetch("/api/prospectos?limit=1000"),
        fetch("/api/produtos?limit=1000"),
        fetch("/api/objetivos-varios?ativo=true"),
        fetch("/api/campanhas?ativo=true")
      ])

      // Check if responses are OK
      if (!clientesRes.ok || !prospectosRes.ok || !produtosRes.ok) {
        console.error("API error - auth may not be ready")
        setLoading(false)
        return
      }

      const [clientesData, prospectosData, produtosData, objetivosData, campanhasData] = await Promise.all([
        clientesRes.json(),
        prospectosRes.json(),
        produtosRes.json(),
        objetivosRes.ok ? objetivosRes.json() : [],
        campanhasRes.ok ? campanhasRes.json() : []
      ])

      // Handle paginated responses (data property) or direct arrays
      const clientesList = Array.isArray(clientesData) ? clientesData : (clientesData?.data || [])
      const prospectosList = Array.isArray(prospectosData) ? prospectosData : (prospectosData?.data || [])
      const produtosList = Array.isArray(produtosData) ? produtosData : (produtosData?.data || [])

      setClientes(Array.isArray(clientesList) ? clientesList : [])
      setProspectos(Array.isArray(prospectosList) ? prospectosList : [])
      setProdutos(Array.isArray(produtosList) ? produtosList : [])
      setObjetivosVarios(Array.isArray(objetivosData) ? objetivosData : [])
      setCampanhas(Array.isArray(campanhasData) ? campanhasData : [])
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
    setItens(newItens)
  }

  function handleProductSelect(index: number, productId: string, price: string | null) {
    const newItens = [...itens]
    newItens[index].produtoId = productId

    if (productId) {
      const produto = produtos.find(p => p.id === productId)
      if (produto) {
        newItens[index].descricao = produto.nome
        newItens[index].precoUnit = price ? Number(price) : 0
      }
    }

    setItens(newItens)
  }

  // Varios functions
  function addVariosItem() {
    setVariosItens([...variosItens, { objetivoId: "", titulo: "", valor: 0 }])
  }

  function removeVariosItem(index: number) {
    setVariosItens(variosItens.filter((_, i) => i !== index))
  }

  function updateVariosItem(index: number, field: keyof VariosItemForm, value: string | number) {
    const newItens = [...variosItens]
    newItens[index] = { ...newItens[index], [field]: value }

    // If objetivo selected, fill title
    if (field === "objetivoId" && value) {
      const objetivo = objetivosVarios.find(o => o.id === value)
      if (objetivo) {
        newItens[index].titulo = objetivo.titulo
      }
    }

    setVariosItens(newItens)
  }

  // Campanha functions
  function addCampanhaItem() {
    setCampanhaItens([...campanhaItens, { campanhaId: "", titulo: "", quantidade: 1, precoUnit: 0 }])
  }

  function removeCampanhaItem(index: number) {
    setCampanhaItens(campanhaItens.filter((_, i) => i !== index))
  }

  function updateCampanhaItem(index: number, field: keyof CampanhaItemForm, value: string | number) {
    const newItens = [...campanhaItens]
    newItens[index] = { ...newItens[index], [field]: value }

    // If campanha selected, fill title and price
    if (field === "campanhaId" && value) {
      const campanha = campanhas.find(c => c.id === value)
      if (campanha) {
        newItens[index].titulo = campanha.titulo
        newItens[index].precoUnit = campanha.totalSemIva
      }
    }

    setCampanhaItens(newItens)
  }

  // Calculate totals
  const produtosSubtotal = itens.reduce((sum, item) => {
    return sum + (item.quantidade * item.precoUnit - item.desconto)
  }, 0)

  const variosSubtotal = variosItens.reduce((sum, item) => sum + item.valor, 0)

  const campanhasSubtotal = campanhaItens.reduce((sum, item) => {
    return sum + (item.quantidade * item.precoUnit)
  }, 0)

  const subtotal = produtosSubtotal + variosSubtotal + campanhasSubtotal
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

    const hasProducts = itens.some(i => i.descricao)
    const hasVarios = variosItens.some(i => i.titulo && i.valor > 0)
    const hasCampanhas = campanhaItens.some(i => i.titulo && i.quantidade > 0)

    if (!hasProducts && !hasVarios && !hasCampanhas) {
      alert("Adicione pelo menos um item ao orcamento")
      return
    }

    setSaving(true)
    try {
      // Combine all items into a single list for the orcamento
      const allItens: { produtoId?: string; descricao: string; quantidade: number; precoUnit: number; desconto?: number }[] = []

      // Add product items
      itens.filter(i => i.descricao).forEach(item => {
        allItens.push({
          produtoId: item.produtoId || undefined,
          descricao: item.descricao,
          quantidade: item.quantidade,
          precoUnit: item.precoUnit,
          desconto: item.desconto
        })
      })

      // Add varios items (as line items with special prefix)
      variosItens.filter(i => i.titulo && i.valor > 0).forEach(item => {
        allItens.push({
          descricao: `[Varios] ${item.titulo}`,
          quantidade: 1,
          precoUnit: item.valor,
          desconto: 0
        })
      })

      // Add campanha items (as line items with special prefix)
      campanhaItens.filter(i => i.titulo && i.quantidade > 0).forEach(item => {
        allItens.push({
          descricao: `[Campanha] ${item.titulo}`,
          quantidade: item.quantidade,
          precoUnit: item.precoUnit,
          desconto: 0
        })
      })

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
          itens: allItens
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
        <div className="flex items-center gap-3 mb-2">
          <Link
            href="/orcamentos"
            className="text-muted-foreground hover:text-foreground transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-3xl font-medium tracking-wide text-foreground">Novo Orcamento</h1>
        </div>
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

        {/* Produtos */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-medium text-foreground">Produtos</h2>
            <button
              type="button"
              onClick={addItem}
              className="text-sm text-primary hover:text-primary-hover"
            >
              + Adicionar Produto
            </button>
          </div>

          <div className="space-y-4">
            {itens.map((item, index) => (
              <div key={index} className="p-4 bg-muted/30 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Produto {index + 1}</span>
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
                  <label className="block text-xs text-muted-foreground mb-1">Produto</label>
                  <ProductPicker
                    products={produtos}
                    selectedProductId={item.produtoId}
                    onSelect={(productId, price) => handleProductSelect(index, productId, price)}
                    placeholder="Pesquisar produto..."
                  />
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

          {produtosSubtotal > 0 && (
            <div className="mt-4 pt-4 border-t border-border text-right">
              <span className="text-muted-foreground">Subtotal Produtos: </span>
              <span className="font-medium">{formatCurrency(produtosSubtotal)}</span>
            </div>
          )}
        </div>

        {/* Objetivos Varios */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-medium text-foreground">Objetivos Varios</h2>
              <p className="text-xs text-muted-foreground">Adicione ofertas e objetivos especiais</p>
            </div>
            <button
              type="button"
              onClick={addVariosItem}
              className="text-sm text-purple-600 hover:text-purple-700"
            >
              + Adicionar Varios
            </button>
          </div>

          {variosItens.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">Nenhum objetivo varios adicionado</p>
          ) : (
            <div className="space-y-4">
              {variosItens.map((item, index) => (
                <div key={index} className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-purple-700 dark:text-purple-400">Varios {index + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeVariosItem(index)}
                      className="text-red-500 text-sm hover:text-red-600"
                    >
                      Remover
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Objetivo</label>
                      <select
                        value={item.objetivoId}
                        onChange={e => updateVariosItem(index, "objetivoId", e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-purple-200 dark:border-purple-800 bg-background text-sm"
                      >
                        <option value="">Selecionar ou inserir manualmente...</option>
                        {objetivosVarios.map(o => (
                          <option key={o.id} value={o.id}>
                            {o.titulo} ({formatCurrency(o.totalValor)})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Valor</label>
                      <input
                        type="number"
                        value={item.valor}
                        onChange={e => updateVariosItem(index, "valor", Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg border border-purple-200 dark:border-purple-800 bg-background text-sm"
                        step="0.01"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Descricao</label>
                    <input
                      type="text"
                      value={item.titulo}
                      onChange={e => updateVariosItem(index, "titulo", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-purple-200 dark:border-purple-800 bg-background text-sm"
                      placeholder="Descricao do objetivo"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {variosSubtotal > 0 && (
            <div className="mt-4 pt-4 border-t border-border text-right">
              <span className="text-muted-foreground">Subtotal Varios: </span>
              <span className="font-medium text-purple-600">{formatCurrency(variosSubtotal)}</span>
            </div>
          )}
        </div>

        {/* Campanhas */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-medium text-foreground">Campanhas</h2>
              <p className="text-xs text-muted-foreground">Adicione campanhas promocionais</p>
            </div>
            <button
              type="button"
              onClick={addCampanhaItem}
              className="text-sm text-amber-600 hover:text-amber-700"
            >
              + Adicionar Campanha
            </button>
          </div>

          {campanhaItens.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">Nenhuma campanha adicionada</p>
          ) : (
            <div className="space-y-4">
              {campanhaItens.map((item, index) => (
                <div key={index} className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-amber-700 dark:text-amber-400">Campanha {index + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeCampanhaItem(index)}
                      className="text-red-500 text-sm hover:text-red-600"
                    >
                      Remover
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Campanha</label>
                    <select
                      value={item.campanhaId}
                      onChange={e => updateCampanhaItem(index, "campanhaId", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-800 bg-background text-sm"
                    >
                      <option value="">Selecionar campanha...</option>
                      {campanhas.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.titulo} ({formatCurrency(c.totalSemIva)}/unid)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Descricao</label>
                      <input
                        type="text"
                        value={item.titulo}
                        onChange={e => updateCampanhaItem(index, "titulo", e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-800 bg-background text-sm"
                        placeholder="Nome da campanha"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Quantidade</label>
                      <input
                        type="number"
                        value={item.quantidade}
                        onChange={e => updateCampanhaItem(index, "quantidade", Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-800 bg-background text-sm"
                        min="1"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Preco Unitario</label>
                    <input
                      type="number"
                      value={item.precoUnit}
                      onChange={e => updateCampanhaItem(index, "precoUnit", Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-800 bg-background text-sm"
                      step="0.01"
                    />
                  </div>

                  <div className="text-right text-sm">
                    <span className="text-muted-foreground">Subtotal: </span>
                    <span className="font-medium text-amber-600">
                      {formatCurrency(item.quantidade * item.precoUnit)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {campanhasSubtotal > 0 && (
            <div className="mt-4 pt-4 border-t border-border text-right">
              <span className="text-muted-foreground">Subtotal Campanhas: </span>
              <span className="font-medium text-amber-600">{formatCurrency(campanhasSubtotal)}</span>
            </div>
          )}
        </div>

        {/* Totais */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="space-y-2 text-right">
            {produtosSubtotal > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Produtos:</span>
                <span>{formatCurrency(produtosSubtotal)}</span>
              </div>
            )}
            {variosSubtotal > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-purple-600">Varios:</span>
                <span className="text-purple-600">{formatCurrency(variosSubtotal)}</span>
              </div>
            )}
            {campanhasSubtotal > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-amber-600">Campanhas:</span>
                <span className="text-amber-600">{formatCurrency(campanhasSubtotal)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-border">
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
