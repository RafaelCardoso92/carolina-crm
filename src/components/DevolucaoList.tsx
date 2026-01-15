"use client"

import { useState } from "react"
import type { DevolucaoWithRelations } from "@/types/devolucao"

interface Props {
  devolucoes: DevolucaoWithRelations[]
  vendaTotal: number
  onStatusChange?: (id: string, estado: "PENDENTE" | "PROCESSADA" | "CANCELADA") => void
  onDelete?: (id: string) => void
}

export default function DevolucaoList({ devolucoes, vendaTotal, onStatusChange, onDelete }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [viewingImage, setViewingImage] = useState<string | null>(null)

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)

  const formatDate = (date: string | Date) =>
    new Date(date).toLocaleDateString("pt-PT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })

  // Calculate totals
  const totalDevolvido = devolucoes.reduce((sum, d) => sum + Number(d.totalDevolvido), 0)
  const totalSubstituido = devolucoes.reduce((sum, d) => sum + Number(d.totalSubstituido), 0)
  const totalLiquido = vendaTotal - totalDevolvido + totalSubstituido

  const estadoColors = {
    PENDENTE: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    PROCESSADA: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    CANCELADA: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
  }

  const estadoLabels = {
    PENDENTE: "Pendente",
    PROCESSADA: "Processada",
    CANCELADA: "Cancelada"
  }

  if (devolucoes.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
        <h3 className="text-sm font-semibold text-orange-800 dark:text-orange-300 mb-3 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
          </svg>
          Resumo de Devoluções ({devolucoes.length})
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground block">Original</span>
            <span className="font-semibold text-foreground">{formatCurrency(vendaTotal)}€</span>
          </div>
          <div>
            <span className="text-muted-foreground block">Devolvido</span>
            <span className="font-semibold text-red-600 dark:text-red-400">-{formatCurrency(totalDevolvido)}€</span>
          </div>
          <div>
            <span className="text-muted-foreground block">Substituições</span>
            <span className="font-semibold text-green-600 dark:text-green-400">+{formatCurrency(totalSubstituido)}€</span>
          </div>
          <div>
            <span className="text-muted-foreground block">Total Líquido</span>
            <span className="font-bold text-foreground">{formatCurrency(totalLiquido)}€</span>
          </div>
        </div>
      </div>

      {/* Devolucoes list */}
      <div className="space-y-3">
        {devolucoes.map(devolucao => (
          <div
            key={devolucao.id}
            className="border border-border rounded-lg overflow-hidden"
          >
            {/* Header */}
            <div
              className="flex items-center justify-between p-3 bg-secondary cursor-pointer"
              onClick={() => setExpandedId(expandedId === devolucao.id ? null : devolucao.id)}
            >
              <div className="flex items-center gap-3">
                <svg
                  className={`w-4 h-4 text-muted-foreground transition-transform ${expandedId === devolucao.id ? "rotate-90" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-sm font-medium text-foreground">
                  {formatDate(devolucao.dataRegisto)}
                </span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${estadoColors[devolucao.estado]}`}>
                  {estadoLabels[devolucao.estado]}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-red-600 dark:text-red-400 font-medium">
                  -{formatCurrency(Number(devolucao.totalDevolvido))}€
                </span>
                {Number(devolucao.totalSubstituido) > 0 && (
                  <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                    +{formatCurrency(Number(devolucao.totalSubstituido))}€
                  </span>
                )}
              </div>
            </div>

            {/* Expanded content */}
            {expandedId === devolucao.id && (
              <div className="p-4 space-y-4 border-t border-border">
                {/* Items */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase">Itens Devolvidos</h4>
                  {devolucao.itens.map(item => (
                    <div key={item.id} className="bg-red-50 dark:bg-red-900/10 rounded p-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-foreground">
                          {item.itemVenda.produto.nome}
                        </span>
                        <span className="text-sm text-red-600 dark:text-red-400">
                          -{formatCurrency(Number(item.subtotal))}€
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {Number(item.quantidade)} × {formatCurrency(Number(item.valorUnitario))}€
                      </div>
                      <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                        Motivo: {item.motivo}
                      </div>

                      {/* Replacement */}
                      {item.substituicao && (
                        <div className="mt-2 pt-2 border-t border-red-200 dark:border-red-800">
                          <div className="flex justify-between">
                            <span className="text-sm text-green-700 dark:text-green-400">
                              ↳ Substituído por: {item.substituicao.nome}
                            </span>
                            <span className="text-sm text-green-600 dark:text-green-400">
                              +{formatCurrency(Number(item.subtotalSubstituicao))}€
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {Number(item.qtdSubstituicao)} × {formatCurrency(Number(item.precoSubstituicao))}€
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Notes */}
                {devolucao.motivo && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Notas</h4>
                    <p className="text-sm text-foreground bg-secondary rounded p-2">{devolucao.motivo}</p>
                  </div>
                )}

                {/* Images */}
                {devolucao.imagens.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Fotografias</h4>
                    <div className="flex gap-2">
                      {devolucao.imagens.map(img => (
                        <button
                          key={img.id}
                          onClick={() => setViewingImage(`/uploads/${img.caminho}`)}
                          className="w-16 h-16 rounded border border-border overflow-hidden hover:ring-2 hover:ring-primary transition"
                        >
                          <img
                            src={`/uploads/${img.caminho}`}
                            alt={img.nomeOriginal}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-border">
                  {onStatusChange && devolucao.estado !== "PROCESSADA" && (
                    <button
                      onClick={() => onStatusChange(devolucao.id, "PROCESSADA")}
                      className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition"
                    >
                      Marcar como Processada
                    </button>
                  )}
                  {onStatusChange && devolucao.estado === "PENDENTE" && (
                    <button
                      onClick={() => onStatusChange(devolucao.id, "CANCELADA")}
                      className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition"
                    >
                      Cancelar
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => onDelete(devolucao.id)}
                      className="px-3 py-1 text-xs text-red-600 border border-red-300 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Image viewer modal */}
      {viewingImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setViewingImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={viewingImage}
              alt="Fotografia da devolução"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
            <button
              onClick={() => setViewingImage(null)}
              className="absolute top-2 right-2 w-8 h-8 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center text-white transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
