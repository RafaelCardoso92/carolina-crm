"use client"

import { useState, useRef } from "react"
import { MOTIVOS_DEVOLUCAO } from "@/types/devolucao"
import type { Produto } from "@prisma/client"

interface ItemVendaParaDevolucao {
  id: string
  produtoId: string
  produto: { id: string; nome: string; codigo: string | null }
  quantidade: number
  precoUnit: number
  subtotal: number
  quantidadeDevolvida: number
  quantidadeDisponivel: number
}

interface Props {
  vendaId: string
  clienteNome: string
  itensVenda: ItemVendaParaDevolucao[]
  produtos: Produto[]  // For replacement selection
  onSuccess: () => void
  onCancel: () => void
}

interface ItemDevolucaoInput {
  itemVendaId: string
  selected: boolean
  quantidade: number
  motivo: string
  // Replacement
  temSubstituicao: boolean
  substituicaoId: string
  qtdSubstituicao: number
  precoSubstituicao: number
}

export default function DevolucaoForm({
  vendaId,
  clienteNome,
  itensVenda,
  produtos,
  onSuccess,
  onCancel
}: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [motivoGeral, setMotivoGeral] = useState("")
  const [devolucaoId, setDevolucaoId] = useState<string | null>(null)  // For image upload

  // Initialize items state
  const [items, setItems] = useState<ItemDevolucaoInput[]>(
    itensVenda.map(item => ({
      itemVendaId: item.id,
      selected: false,
      quantidade: 0,
      motivo: MOTIVOS_DEVOLUCAO[0],
      temSubstituicao: false,
      substituicaoId: "",
      qtdSubstituicao: 0,
      precoSubstituicao: 0
    }))
  )

  // Images state
  const [images, setImages] = useState<File[]>([])
  const [uploadedImages, setUploadedImages] = useState<{ id: string; nome: string }[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Calculate totals
  const totalDevolvido = items.reduce((sum, item, index) => {
    if (!item.selected) return sum
    const original = itensVenda[index]
    return sum + (item.quantidade * original.precoUnit)
  }, 0)

  const totalSubstituido = items.reduce((sum, item) => {
    if (!item.selected || !item.temSubstituicao) return sum
    return sum + (item.qtdSubstituicao * item.precoSubstituicao)
  }, 0)

  const ajusteLiquido = totalSubstituido - totalDevolvido

  function updateItem(index: number, updates: Partial<ItemDevolucaoInput>) {
    setItems(prev => prev.map((item, i) =>
      i === index ? { ...item, ...updates } : item
    ))
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    const totalImages = images.length + files.length

    if (totalImages > 2) {
      setError("Máximo de 2 imagens permitidas")
      return
    }

    // Validate each file
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        setError(`${file.name}: Ficheiro muito grande (máx 5MB)`)
        return
      }
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        setError(`${file.name}: Tipo não suportado (use JPG, PNG ou WebP)`)
        return
      }
    }

    setImages(prev => [...prev, ...files])
    setError(null)
  }

  function removeImage(index: number) {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  async function uploadImages(devId: string) {
    for (const file of images) {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("devolucaoId", devId)

      const res = await fetch("/api/devolucoes/upload", {
        method: "POST",
        body: formData
      })

      if (!res.ok) {
        console.error("Failed to upload image:", await res.text())
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Build items array
      const itensToSubmit = items
        .filter(item => item.selected && item.quantidade > 0)
        .map(item => ({
          itemVendaId: item.itemVendaId,
          quantidade: item.quantidade,
          motivo: item.motivo,
          ...(item.temSubstituicao && item.substituicaoId ? {
            substituicaoId: item.substituicaoId,
            qtdSubstituicao: item.qtdSubstituicao,
            precoSubstituicao: item.precoSubstituicao
          } : {})
        }))

      if (itensToSubmit.length === 0) {
        setError("Selecione pelo menos um item para devolver")
        setLoading(false)
        return
      }

      // Create devolucao
      const res = await fetch("/api/devolucoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendaId,
          motivo: motivoGeral || null,
          itens: itensToSubmit
        })
      })

      const data = await res.json()

      if (!data.success) {
        throw new Error(data.error || "Erro ao criar devolução")
      }

      // Upload images if any
      if (images.length > 0 && data.devolucao?.id) {
        await uploadImages(data.devolucao.id)
      }

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar devolução")
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="border-b border-border pb-4">
        <h2 className="text-lg font-bold text-foreground">Registar Devolução</h2>
        <p className="text-sm text-muted-foreground">Cliente: {clienteNome}</p>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Items selection */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Selecionar Itens para Devolver</h3>

        {itensVenda.map((item, index) => {
          const inputItem = items[index]
          const isDisabled = item.quantidadeDisponivel <= 0

          return (
            <div
              key={item.id}
              className={`border rounded-lg p-4 ${
                inputItem.selected ? "border-primary bg-primary/5" : "border-border"
              } ${isDisabled ? "opacity-50" : ""}`}
            >
              <div className="flex items-start gap-3">
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={inputItem.selected}
                  onChange={e => updateItem(index, {
                    selected: e.target.checked,
                    quantidade: e.target.checked ? item.quantidadeDisponivel : 0
                  })}
                  disabled={isDisabled}
                  className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />

                {/* Product info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{item.produto.nome}</span>
                    {item.produto.codigo && (
                      <span className="text-xs text-muted-foreground">({item.produto.codigo})</span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Original: {item.quantidade} × {formatCurrency(item.precoUnit)}€ = {formatCurrency(item.subtotal)}€
                  </div>
                  {item.quantidadeDevolvida > 0 && (
                    <div className="text-xs text-orange-600 dark:text-orange-400">
                      Já devolvido: {item.quantidadeDevolvida}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    Disponível para devolução: {item.quantidadeDisponivel}
                  </div>
                </div>
              </div>

              {/* Return details (shown when selected) */}
              {inputItem.selected && (
                <div className="mt-4 pl-7 space-y-3 border-t border-border pt-3">
                  {/* Quantity */}
                  <div className="flex items-center gap-4">
                    <label className="text-sm text-muted-foreground w-24">Quantidade:</label>
                    <input
                      type="number"
                      min={0.01}
                      max={item.quantidadeDisponivel}
                      step={0.01}
                      value={inputItem.quantidade}
                      onChange={e => updateItem(index, { quantidade: parseFloat(e.target.value) || 0 })}
                      className="w-24 px-2 py-1 border border-border rounded bg-background text-foreground text-sm"
                    />
                    <span className="text-sm text-muted-foreground">
                      = {formatCurrency(inputItem.quantidade * item.precoUnit)}€
                    </span>
                  </div>

                  {/* Reason */}
                  <div className="flex items-center gap-4">
                    <label className="text-sm text-muted-foreground w-24">Motivo:</label>
                    <select
                      value={inputItem.motivo}
                      onChange={e => updateItem(index, { motivo: e.target.value })}
                      className="flex-1 px-2 py-1 border border-border rounded bg-background text-foreground text-sm"
                    >
                      {MOTIVOS_DEVOLUCAO.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  {/* Replacement toggle */}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`sub-${index}`}
                      checked={inputItem.temSubstituicao}
                      onChange={e => updateItem(index, { temSubstituicao: e.target.checked })}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <label htmlFor={`sub-${index}`} className="text-sm text-muted-foreground">
                      Adicionar produto de substituição
                    </label>
                  </div>

                  {/* Replacement details */}
                  {inputItem.temSubstituicao && (
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-muted-foreground w-24">Produto:</label>
                        <select
                          value={inputItem.substituicaoId}
                          onChange={e => updateItem(index, { substituicaoId: e.target.value })}
                          className="flex-1 px-2 py-1 border border-border rounded bg-background text-foreground text-sm"
                        >
                          <option value="">Selecionar produto...</option>
                          {produtos.filter(p => p.ativo).map(p => (
                            <option key={p.id} value={p.id}>
                              {p.nome} {p.codigo ? `(${p.codigo})` : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-center gap-4">
                        <label className="text-sm text-muted-foreground w-24">Qtd:</label>
                        <input
                          type="number"
                          min={0.01}
                          step={0.01}
                          value={inputItem.qtdSubstituicao}
                          onChange={e => updateItem(index, { qtdSubstituicao: parseFloat(e.target.value) || 0 })}
                          className="w-20 px-2 py-1 border border-border rounded bg-background text-foreground text-sm"
                        />
                        <label className="text-sm text-muted-foreground">Preço:</label>
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          value={inputItem.precoSubstituicao}
                          onChange={e => updateItem(index, { precoSubstituicao: parseFloat(e.target.value) || 0 })}
                          className="w-24 px-2 py-1 border border-border rounded bg-background text-foreground text-sm"
                        />
                        <span className="text-sm text-green-700 dark:text-green-400">
                          = {formatCurrency(inputItem.qtdSubstituicao * inputItem.precoSubstituicao)}€
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Images upload */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Fotografias (opcional, máx. 2)</h3>

        <div className="flex flex-wrap gap-3">
          {/* Preview existing images */}
          {images.map((file, index) => (
            <div key={index} className="relative w-24 h-24 border border-border rounded-lg overflow-hidden">
              <img
                src={URL.createObjectURL(file)}
                alt={`Preview ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
              >
                ×
              </button>
            </div>
          ))}

          {/* Add button */}
          {images.length < 2 && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-24 h-24 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span className="text-xs mt-1">Adicionar</span>
            </button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* General notes */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-foreground">Notas gerais (opcional)</label>
        <textarea
          value={motivoGeral}
          onChange={e => setMotivoGeral(e.target.value)}
          rows={2}
          placeholder="Observações adicionais sobre a devolução..."
          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm resize-none"
        />
      </div>

      {/* Summary */}
      <div className="bg-secondary rounded-lg p-4 space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Resumo</h3>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Total a devolver:</span>
          <span className="text-red-600 dark:text-red-400 font-medium">-{formatCurrency(totalDevolvido)}€</span>
        </div>
        {totalSubstituido > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total substituições:</span>
            <span className="text-green-600 dark:text-green-400 font-medium">+{formatCurrency(totalSubstituido)}€</span>
          </div>
        )}
        <div className="flex justify-between text-sm pt-2 border-t border-border">
          <span className="font-semibold text-foreground">Ajuste líquido:</span>
          <span className={`font-bold ${ajusteLiquido >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
            {ajusteLiquido >= 0 ? "+" : ""}{formatCurrency(ajusteLiquido)}€
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 border border-border rounded-lg text-foreground hover:bg-secondary transition"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading || totalDevolvido === 0}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition disabled:opacity-50 flex items-center gap-2"
        >
          {loading && (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          Registar Devolução
        </button>
      </div>
    </form>
  )
}
