"use client"

import { useState, useEffect } from "react"

interface Produto {
  id: string
  nome: string
  codigo: string | null
}

interface QuotationItem {
  produtoId: string
  descricao: string
  quantidade: number
  precoUnit: number
  desconto: number
}

interface Props {
  prospectoId?: string
  clienteId?: string
  onSuccess?: () => void
}

const IVA_RATE = 0.23

export default function QuotationForm({ prospectoId, clienteId, onSuccess }: Props) {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [formData, setFormData] = useState({
    titulo: "",
    introducao: "Temos o prazer de apresentar a seguinte proposta comercial:",
    condicoes: "Pagamento a 30 dias. Validade da proposta: 30 dias.",
    validadeDias: 30
  })
  const [itens, setItens] = useState<QuotationItem[]>([
    { produtoId: "", descricao: "", quantidade: 1, precoUnit: 0, desconto: 0 }
  ])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch("/api/produtos?limit=1000")
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data) ? data : (data?.data || [])
        setProdutos(list.filter((p: Produto & { ativo: boolean }) => p.ativo))
      })
      .catch(console.error)
  }, [])

  const addItem = () => {
    setItens([...itens, { produtoId: "", descricao: "", quantidade: 1, precoUnit: 0, desconto: 0 }])
  }

  const removeItem = (index: number) => {
    setItens(itens.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof QuotationItem, value: string | number) => {
    const newItens = [...itens]
    if (field === "produtoId") {
      const produto = produtos.find(p => p.id === value)
      newItens[index] = {
        ...newItens[index],
        produtoId: value as string,
        descricao: produto?.nome || ""
      }
    } else {
      if (field === "quantidade") { newItens[index].quantidade = value as number } else if (field === "precoUnit") { newItens[index].precoUnit = value as number } else if (field === "desconto") { newItens[index].desconto = value as number } else if (field === "descricao") { newItens[index].descricao = value as string }
    }
    setItens(newItens)
  }

  const subtotal = itens.reduce((sum, item) => {
    return sum + (item.quantidade * item.precoUnit - item.desconto)
  }, 0)
  const iva = subtotal * IVA_RATE
  const total = subtotal + iva

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      const res = await fetch("/api/orcamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prospectoId,
          clienteId,
          ...formData,
          itens: itens.filter(i => i.descricao)
        })
      })

      if (res.ok) {
        alert("Orcamento criado com sucesso!")
        onSuccess?.()
      }
    } catch (error) {
      console.error("Error:", error)
    }

    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-muted-foreground mb-1">Titulo</label>
        <input
          type="text"
          value={formData.titulo}
          onChange={e => setFormData({ ...formData, titulo: e.target.value })}
          className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground"
          placeholder="Ex: Proposta Comercial - Produtos BABOR"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-muted-foreground mb-1">Introducao</label>
        <textarea
          value={formData.introducao}
          onChange={e => setFormData({ ...formData, introducao: e.target.value })}
          className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground"
          rows={2}
        />
      </div>

      {/* Items */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-muted-foreground">Itens</label>
          <button type="button" onClick={addItem} className="text-sm text-primary hover:underline">
            + Adicionar item
          </button>
        </div>

        <div className="space-y-3">
          {itens.map((item, index) => (
            <div key={index} className="p-4 bg-secondary/50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-xs text-muted-foreground mb-1">Produto</label>
                  <select
                    value={item.produtoId}
                    onChange={e => updateItem(index, "produtoId", e.target.value)}
                    className="w-full border border-border rounded px-2 py-1.5 bg-background text-foreground text-sm"
                  >
                    <option value="">Selecionar...</option>
                    {produtos.map(p => (
                      <option key={p.id} value={p.id}>{p.nome}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-muted-foreground mb-1">Descrição</label>
                  <input
                    type="text"
                    value={item.descricao}
                    onChange={e => updateItem(index, "descricao", e.target.value)}
                    className="w-full border border-border rounded px-2 py-1.5 bg-background text-foreground text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Qtd</label>
                  <input
                    type="number"
                    value={item.quantidade}
                    onChange={e => updateItem(index, "quantidade", parseFloat(e.target.value) || 0)}
                    className="w-full border border-border rounded px-2 py-1.5 bg-background text-foreground text-sm"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Preco (EUR)</label>
                  <input
                    type="number"
                    value={item.precoUnit}
                    onChange={e => updateItem(index, "precoUnit", parseFloat(e.target.value) || 0)}
                    className="w-full border border-border rounded px-2 py-1.5 bg-background text-foreground text-sm"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              {itens.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="mt-2 text-xs text-red-500 hover:underline"
                >
                  Remover
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Totals */}
      <div className="bg-secondary/50 rounded-lg p-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="text-foreground">{subtotal.toFixed(2)} EUR</span>
        </div>
        <div className="flex justify-between text-sm mb-1">
          <span className="text-muted-foreground">IVA (23%)</span>
          <span className="text-foreground">{iva.toFixed(2)} EUR</span>
        </div>
        <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
          <span className="text-foreground">Total</span>
          <span className="text-primary">{total.toFixed(2)} EUR</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-muted-foreground mb-1">Condicoes</label>
        <textarea
          value={formData.condicoes}
          onChange={e => setFormData({ ...formData, condicoes: e.target.value })}
          className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground"
          rows={2}
        />
      </div>

      <button
        type="submit"
        disabled={saving || itens.filter(i => i.descricao).length === 0}
        className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary-hover transition disabled:opacity-50"
      >
        {saving ? "A criar..." : "Criar Orcamento"}
      </button>
    </form>
  )
}
