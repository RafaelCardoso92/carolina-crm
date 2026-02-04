"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import Swal from "sweetalert2"
import type { ReconciliacaoWithRelations, ItemReconciliacaoWithRelations, EstadoReconciliacao, TipoDiscrepancia } from "@/types/reconciliacao"

interface Props {
  reconciliacoes: ReconciliacaoWithRelations[]
  meses: string[]
  anosDisponiveis: number[]
}

const estadoColors: Record<EstadoReconciliacao, string> = {
  PENDENTE: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  EM_REVISAO: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  APROVADA: "bg-green-500/10 text-green-600 dark:text-green-400",
  COM_PROBLEMAS: "bg-red-500/10 text-red-600 dark:text-red-400"
}

const estadoLabels: Record<EstadoReconciliacao, string> = {
  PENDENTE: "Pendente",
  EM_REVISAO: "Em Revisão",
  APROVADA: "Aprovada",
  COM_PROBLEMAS: "Com Problemas"
}

const discrepanciaLabels: Record<TipoDiscrepancia, string> = {
  VALOR_DIFERENTE: "Valor diferente",
  CLIENTE_NAO_EXISTE: "Cliente não existe",
  VENDA_NAO_EXISTE: "Venda não registada",
  VENDA_EXTRA: "Venda extra no sistema"
}

export default function ReconciliacaoView({ reconciliacoes: initialReconciliacoes, meses, anosDisponiveis }: Props) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Local state for reconciliacoes to ensure immediate UI updates
  const [reconciliacoes, setReconciliacoes] = useState(initialReconciliacoes)

  const [showUpload, setShowUpload] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadMes, setUploadMes] = useState(new Date().getMonth() + 1)
  const [uploadAno, setUploadAno] = useState(new Date().getFullYear())

  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filterProblemas, setFilterProblemas] = useState(false)

  // Sync local state when props change
  useEffect(() => {
    setReconciliacoes(initialReconciliacoes)
  }, [initialReconciliacoes])

  // Refetch reconciliacoes from API
  async function refetchReconciliacoes() {
    try {
      const res = await fetch("/api/reconciliacao")
      if (res.ok) {
        const data = await res.json()
        if (data.success && data.reconciliacoes) {
          setReconciliacoes(data.reconciliacoes)
        }
      }
    } catch (err) {
      console.error("Error refetching reconciliacoes:", err)
    }
  }

  const formatCurrency = (value: number | unknown) =>
    new Intl.NumberFormat("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value))

  const formatDate = (date: string | Date) =>
    new Date(date).toLocaleDateString("pt-PT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })

  async function handleUpload() {
    if (!selectedFile) {
      Swal.fire({
        icon: "error",
        title: "Erro",
        text: "Selecione um ficheiro PDF",
        confirmButtonColor: "#b8860b"
      })
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("mes", String(uploadMes))
      formData.append("ano", String(uploadAno))

      const res = await fetch("/api/reconciliacao", {
        method: "POST",
        body: formData
      })

      const data = await res.json()

      if (!data.success) {
        throw new Error(data.error || "Erro ao processar ficheiro")
      }

      Swal.fire({
        icon: "success",
        title: "Reconciliação criada",
        text: `Processados ${data.reconciliacao.totalItens} clientes. ${data.reconciliacao.itensComProblema} com discrepâncias.`,
        confirmButtonColor: "#b8860b"
      })

      setShowUpload(false)
      setSelectedFile(null)
      refetchReconciliacoes()
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Erro",
        text: err instanceof Error ? err.message : "Erro ao processar ficheiro",
        confirmButtonColor: "#b8860b"
      })
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(id: string, mes: number, ano: number) {
    const result = await Swal.fire({
      title: "Eliminar reconciliação?",
      text: `Tem a certeza que quer eliminar a reconciliação de ${meses[mes]} ${ano}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#c41e3a",
      cancelButtonColor: "#666666",
      confirmButtonText: "Sim, eliminar",
      cancelButtonText: "Cancelar"
    })

    if (!result.isConfirmed) return

    try {
      const res = await fetch(`/api/reconciliacao/${id}`, { method: "DELETE" })
      if (res.ok) {
        refetchReconciliacoes()
      }
    } catch (err) {
      console.error("Error deleting:", err)
    }
  }

  async function handleItemResolve(reconciliacaoId: string, itemId: string, resolvido: boolean, nota?: string) {
    try {
      const res = await fetch(`/api/reconciliacao/${reconciliacaoId}/item/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolvido, notaResolucao: nota })
      })

      if (res.ok) {
        refetchReconciliacoes()
      }
    } catch (err) {
      console.error("Error updating item:", err)
    }
  }

  async function handleResolveWithNote(reconciliacaoId: string, item: ItemReconciliacaoWithRelations) {
    const { value: nota } = await Swal.fire({
      title: "Resolver discrepância",
      input: "textarea",
      inputLabel: "Nota de resolução",
      inputPlaceholder: "Explique como esta discrepância foi resolvida...",
      inputValue: item.notaResolucao || "",
      showCancelButton: true,
      confirmButtonText: "Marcar como resolvido",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#b8860b"
    })

    if (nota !== undefined) {
      handleItemResolve(reconciliacaoId, item.id, true, nota)
    }
  }

  return (
    <div className="space-y-6">
      {/* Upload button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowUpload(true)}
          className="bg-primary text-white px-4 md:px-6 py-2.5 md:py-3 rounded-xl font-semibold hover:bg-primary-hover transition flex items-center gap-2 shadow-lg shadow-primary/20"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          Carregar MAPA 104
        </button>
      </div>

      {/* Upload form */}
      {showUpload && (
        <div className="bg-card rounded-xl shadow-sm p-6 border-2 border-primary/20">
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Carregar MAPA 104
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Mês</label>
              <select
                value={uploadMes}
                onChange={e => setUploadMes(parseInt(e.target.value))}
                className="w-full px-4 py-3 border-2 border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-card text-foreground"
              >
                {meses.slice(1).map((m, i) => (
                  <option key={i + 1} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Ano</label>
              <select
                value={uploadAno}
                onChange={e => setUploadAno(parseInt(e.target.value))}
                className="w-full px-4 py-3 border-2 border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-card text-foreground"
              >
                {anosDisponiveis.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Ficheiro PDF</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                className="w-full px-4 py-2.5 border-2 border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-card text-foreground file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary"
              />
            </div>
          </div>

          {selectedFile && (
            <div className="mb-4 p-3 bg-secondary rounded-lg flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-sm text-foreground">{selectedFile.name}</span>
              <span className="text-xs text-muted-foreground">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleUpload}
              disabled={uploading || !selectedFile}
              className="flex-1 bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-hover transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  A processar...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Processar
                </>
              )}
            </button>
            <button
              onClick={() => { setShowUpload(false); setSelectedFile(null); }}
              className="px-6 py-3 border-2 border-border rounded-xl font-bold text-foreground hover:bg-secondary transition"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Reconciliations list */}
      {reconciliacoes.length === 0 ? (
        <div className="bg-card rounded-xl shadow-sm p-12 text-center">
          <svg className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-lg font-medium text-muted-foreground">Nenhuma reconciliação encontrada</p>
          <p className="text-sm text-muted-foreground mt-1">Carregue o MAPA 104 para começar</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reconciliacoes.map(rec => {
            const isExpanded = expandedId === rec.id
            const filteredItems = filterProblemas
              ? rec.itens.filter(i => !i.corresponde && !i.resolvido)
              : rec.itens

            return (
              <div key={rec.id} className="bg-card rounded-xl shadow-sm overflow-hidden border border-border">
                {/* Header */}
                <div
                  className="p-4 md:p-6 cursor-pointer hover:bg-secondary/50 transition"
                  onClick={() => setExpandedId(isExpanded ? null : rec.id)}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <svg
                        className={`w-5 h-5 text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <div>
                        <h3 className="text-lg font-bold text-foreground">
                          {meses[rec.mes]} {rec.ano}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Carregado em {formatDate(rec.dataUpload)}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${estadoColors[rec.estado]}`}>
                        {estadoLabels[rec.estado]}
                      </span>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">MAPA 104</p>
                        <p className="font-bold text-foreground">{formatCurrency(rec.totalLiquidoPdf)} €</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Sistema</p>
                        <p className="font-bold text-foreground">{formatCurrency(rec.totalSistema)} €</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Diferença</p>
                        <p className={`font-bold ${Number(rec.diferenca) === 0 ? "text-green-600" : "text-red-600"}`}>
                          {Number(rec.diferenca) > 0 ? "+" : ""}{formatCurrency(rec.diferenca)} €
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Summary badges */}
                  <div className="flex gap-3 mt-4">
                    <span className="px-3 py-1 bg-secondary rounded-full text-sm">
                      {rec.totalItens} clientes
                    </span>
                    <span className="px-3 py-1 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full text-sm">
                      {rec.itensCorretos} correctos
                    </span>
                    {rec.itensComProblema > 0 && (
                      <span className="px-3 py-1 bg-red-500/10 text-red-600 dark:text-red-400 rounded-full text-sm">
                        {rec.itensComProblema} com problemas
                      </span>
                    )}
                  </div>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="border-t border-border">
                    {/* Filter toggle */}
                    <div className="p-4 bg-secondary/50 flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filterProblemas}
                          onChange={e => setFilterProblemas(e.target.checked)}
                          className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                        />
                        <span className="text-sm font-medium text-foreground">Mostrar apenas problemas</span>
                      </label>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(rec.id, rec.mes, rec.ano); }}
                        className="px-3 py-1.5 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                      >
                        Eliminar reconciliação
                      </button>
                    </div>

                    {/* Items table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-secondary">
                          <tr>
                            <th className="px-4 py-3 text-left font-semibold text-foreground">Estado</th>
                            <th className="px-4 py-3 text-left font-semibold text-foreground">Código</th>
                            <th className="px-4 py-3 text-left font-semibold text-foreground">Cliente</th>
                            <th className="px-4 py-3 text-right font-semibold text-foreground">MAPA 104</th>
                            <th className="px-4 py-3 text-right font-semibold text-foreground">Sistema</th>
                            <th className="px-4 py-3 text-right font-semibold text-foreground">Diferença</th>
                            <th className="px-4 py-3 text-center font-semibold text-foreground">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {filteredItems.map(item => (
                            <tr
                              key={item.id}
                              className={
                                item.corresponde || item.resolvido
                                  ? "bg-green-50/50 dark:bg-green-900/5"
                                  : "bg-red-50/50 dark:bg-red-900/5"
                              }
                            >
                              <td className="px-4 py-3">
                                {item.corresponde ? (
                                  <span className="inline-flex items-center gap-1 text-green-600">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    OK
                                  </span>
                                ) : item.resolvido ? (
                                  <span className="inline-flex items-center gap-1 text-blue-600" title={item.notaResolucao || ""}>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Resolvido
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-red-600">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    {item.tipoDiscrepancia ? discrepanciaLabels[item.tipoDiscrepancia] : "Erro"}
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 font-mono text-muted-foreground">
                                {item.codigoClientePdf}
                              </td>
                              <td className="px-4 py-3">
                                <div className="font-medium text-foreground">{item.nomeClientePdf}</div>
                                {item.cliente && item.cliente.nome !== item.nomeClientePdf && (
                                  <div className="text-xs text-muted-foreground">
                                    Sistema: {item.cliente.nome}
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right font-medium">
                                {formatCurrency(item.valorLiquidoPdf)} €
                              </td>
                              <td className="px-4 py-3 text-right">
                                {item.valorSistema !== null ? (
                                  <div>
                                    <div className="font-medium">{formatCurrency(item.valorSistema)} €</div>
                                    {item.valorObjetivosVarios && Number(item.valorObjetivosVarios) > 0 && (
                                      <div className="text-xs text-purple-600 dark:text-purple-400 mt-0.5">
                                        <span className="text-muted-foreground">Vendas:</span> {formatCurrency(item.valorVendas)} €
                                        <br />
                                        <span className="bg-purple-100 dark:bg-purple-900/30 px-1.5 py-0.5 rounded">
                                          Varios: {formatCurrency(item.valorObjetivosVarios)} €
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                ) : "-"}
                              </td>
                              <td className="px-4 py-3 text-right">
                                {item.diferencaValor !== null && Number(item.diferencaValor) !== 0 ? (
                                  <span className={Number(item.diferencaValor) > 0 ? "text-red-600 font-medium" : "text-green-600 font-medium"}>
                                    {Number(item.diferencaValor) > 0 ? "+" : ""}{formatCurrency(item.diferencaValor)} €
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-center">
                                {!item.corresponde && !item.resolvido ? (
                                  <button
                                    onClick={() => handleResolveWithNote(rec.id, item)}
                                    className="px-3 py-1 text-xs bg-primary text-white rounded hover:bg-primary-hover transition"
                                  >
                                    Resolver
                                  </button>
                                ) : item.resolvido ? (
                                  <button
                                    onClick={() => handleItemResolve(rec.id, item.id, false)}
                                    className="px-3 py-1 text-xs text-muted-foreground border border-border rounded hover:bg-secondary transition"
                                  >
                                    Reabrir
                                  </button>
                                ) : null}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {filteredItems.length === 0 && (
                      <div className="p-8 text-center text-muted-foreground">
                        {filterProblemas ? "Nenhum problema por resolver" : "Nenhum item encontrado"}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
