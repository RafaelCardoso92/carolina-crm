"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Swal from "sweetalert2"

type EstadoReconciliacao = "PENDENTE" | "EM_REVISAO" | "APROVADA" | "COM_PROBLEMAS"
type TipoDiscrepanciaComissao =
  | "VALOR_DIFERENTE"
  | "COMISSAO_DIFERENTE"
  | "CLIENTE_NAO_EXISTE"
  | "COBRANCA_NAO_EXISTE"
  | "PARCELA_NAO_EXISTE"
  | "PAGAMENTO_EXTRA_SISTEMA"
  | "PAGAMENTO_EXTRA_PDF"

interface ItemReconciliacaoComissao {
  id: string
  dataPagamentoPdf: string | Date | null
  codigoClientePdf: string
  nomeClientePdf: string | null
  tipoDocPdf: string | null
  seriePdf: string | null
  numeroPdf: string
  parcelaPdf: number
  valorLiquidoPdf: number
  valorComissaoPdf: number
  clienteId: string | null
  cliente: { id: string; nome: string; codigo: string | null } | null
  cobrancaId: string | null
  cobranca: { id: string; fatura: string | null; valor: number; comissao: number | null } | null
  parcelaId: string | null
  parcela: { id: string; numero: number; valor: number; dataPago: string | Date | null } | null
  valorSistema: number | null
  comissaoSistema: number | null
  corresponde: boolean
  tipoDiscrepancia: TipoDiscrepanciaComissao | null
  diferencaValor: number | null
  diferencaComissao: number | null
  resolvido: boolean
  notaResolucao: string | null
}

interface ReconciliacaoComissoes {
  id: string
  mes: number
  ano: number
  nomeArquivo: string
  dataInicio: string | Date | null
  dataFim: string | Date | null
  totalLiquidoPdf: number
  totalComissaoPdf: number
  totalSistema: number
  totalComissaoSistema: number
  diferenca: number
  diferencaComissao: number
  totalItens: number
  itensCorretos: number
  itensComProblema: number
  estado: EstadoReconciliacao
  notas: string | null
  dataUpload: string | Date
  itens: ItemReconciliacaoComissao[]
}

interface Props {
  reconciliacoes: ReconciliacaoComissoes[]
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

const discrepanciaLabels: Record<TipoDiscrepanciaComissao, string> = {
  VALOR_DIFERENTE: "Valor diferente",
  COMISSAO_DIFERENTE: "Comissão diferente",
  CLIENTE_NAO_EXISTE: "Cliente não existe",
  COBRANCA_NAO_EXISTE: "Cobrança não registada",
  PARCELA_NAO_EXISTE: "Parcela não encontrada",
  PAGAMENTO_EXTRA_SISTEMA: "Extra no sistema",
  PAGAMENTO_EXTRA_PDF: "Extra no PDF"
}

export default function ComissoesView({ reconciliacoes: initialReconciliacoes, meses, anosDisponiveis }: Props) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [reconciliacoes, setReconciliacoes] = useState(initialReconciliacoes)
  const [showUpload, setShowUpload] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadMes, setUploadMes] = useState(new Date().getMonth() + 1)
  const [uploadAno, setUploadAno] = useState(new Date().getFullYear())
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filterProblemas, setFilterProblemas] = useState(false)

  useEffect(() => {
    setReconciliacoes(initialReconciliacoes)
  }, [initialReconciliacoes])

  async function refetchReconciliacoes() {
    try {
      const res = await fetch("/api/reconciliacao-comissoes")
      if (res.ok) {
        const data = await res.json()
        if (data.success && data.reconciliacoes) {
          setReconciliacoes(data.reconciliacoes)
        }
      }
    } catch (err) {
      console.error("Error refetching:", err)
    }
  }

  const formatCurrency = (value: number | null | undefined) =>
    new Intl.NumberFormat("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value || 0))

  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return "-"
    return new Date(date).toLocaleDateString("pt-PT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    })
  }

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

      const res = await fetch("/api/reconciliacao-comissoes", {
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
        text: `Processados ${data.reconciliacao.totalItens} pagamentos. ${data.reconciliacao.itensComProblema} com discrepâncias.`,
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
      const res = await fetch(`/api/reconciliacao-comissoes/${id}`, { method: "DELETE" })
      if (res.ok) {
        refetchReconciliacoes()
      }
    } catch (err) {
      console.error("Error deleting:", err)
    }
  }

  async function handleItemResolve(reconciliacaoId: string, itemId: string, resolvido: boolean, nota?: string) {
    try {
      const res = await fetch(`/api/reconciliacao-comissoes/${reconciliacaoId}/item/${itemId}`, {
        method: "PATCH",
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

  async function handleResolveWithNote(reconciliacaoId: string, item: ItemReconciliacaoComissao) {
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Upload Mapa Comissões
        </button>
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-foreground mb-4">Upload Mapa de Comissões</h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-foreground mb-2">Mês</label>
                  <select
                    value={uploadMes}
                    onChange={(e) => setUploadMes(parseInt(e.target.value))}
                    className="w-full px-4 py-3 border-2 border-border rounded-xl bg-card text-foreground"
                  >
                    {meses.slice(1).map((mes, i) => (
                      <option key={i + 1} value={i + 1}>{mes}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-foreground mb-2">Ano</label>
                  <select
                    value={uploadAno}
                    onChange={(e) => setUploadAno(parseInt(e.target.value))}
                    className="w-full px-4 py-3 border-2 border-border rounded-xl bg-card text-foreground"
                  >
                    {anosDisponiveis.map(ano => (
                      <option key={ano} value={ano}>{ano}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-foreground mb-2">Ficheiro PDF</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-3 border-2 border-border rounded-xl bg-card text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary file:text-white"
                />
              </div>

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
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      A processar...
                    </>
                  ) : (
                    "Processar"
                  )}
                </button>
                <button
                  onClick={() => { setShowUpload(false); setSelectedFile(null) }}
                  className="px-6 py-3 border-2 border-border rounded-xl font-bold text-foreground hover:bg-secondary transition"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reconciliation List */}
      {reconciliacoes.length === 0 ? (
        <div className="bg-card rounded-xl p-12 text-center">
          <svg className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-muted-foreground text-lg">Nenhuma reconciliação de comissões encontrada</p>
          <p className="text-muted-foreground text-sm mt-2">Carregue um mapa de comissões para começar</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reconciliacoes.map((rec) => {
            const isExpanded = expandedId === rec.id
            const itensToShow = filterProblemas
              ? rec.itens.filter(i => !i.corresponde && !i.resolvido)
              : rec.itens

            return (
              <div key={rec.id} className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                {/* Header */}
                <div
                  className="p-4 md:p-6 cursor-pointer hover:bg-secondary/50 transition"
                  onClick={() => setExpandedId(isExpanded ? null : rec.id)}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-foreground">{meses[rec.mes]} {rec.ano}</h3>
                        <p className="text-sm text-muted-foreground">
                          {rec.totalItens} pagamentos • {rec.itensCorretos} corretos • {rec.itensComProblema} com problemas
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${estadoColors[rec.estado]}`}>
                        {estadoLabels[rec.estado]}
                      </span>

                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Comissão Total</p>
                        <p className="text-lg font-bold text-primary">{formatCurrency(rec.totalComissaoPdf)} €</p>
                      </div>

                      <svg
                        className={`w-5 h-5 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-border">
                    <div>
                      <p className="text-xs text-muted-foreground">Total Liquidado (PDF)</p>
                      <p className="font-bold text-foreground">{formatCurrency(rec.totalLiquidoPdf)} €</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total Sistema</p>
                      <p className="font-bold text-foreground">{formatCurrency(rec.totalSistema)} €</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Comissão PDF</p>
                      <p className="font-bold text-primary">{formatCurrency(rec.totalComissaoPdf)} €</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Comissão Sistema</p>
                      <p className="font-bold text-foreground">{formatCurrency(rec.totalComissaoSistema)} €</p>
                    </div>
                  </div>

                  {(rec.diferenca !== 0 || rec.diferencaComissao !== 0) && (
                    <div className="flex gap-4 mt-2">
                      {rec.diferenca !== 0 && (
                        <p className={`text-sm font-medium ${rec.diferenca > 0 ? "text-green-600" : "text-red-600"}`}>
                          Diferença Valor: {rec.diferenca > 0 ? "+" : ""}{formatCurrency(rec.diferenca)} €
                        </p>
                      )}
                      {rec.diferencaComissao !== 0 && (
                        <p className={`text-sm font-medium ${rec.diferencaComissao > 0 ? "text-green-600" : "text-red-600"}`}>
                          Diferença Comissão: {rec.diferencaComissao > 0 ? "+" : ""}{formatCurrency(rec.diferencaComissao)} €
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-border">
                    {/* Actions */}
                    <div className="p-4 bg-secondary/30 flex flex-wrap items-center gap-3">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={filterProblemas}
                          onChange={(e) => setFilterProblemas(e.target.checked)}
                          className="rounded"
                        />
                        Mostrar apenas problemas
                      </label>

                      <div className="flex-1" />

                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(rec.id, rec.mes, rec.ano) }}
                        className="px-4 py-2 text-sm text-red-600 hover:bg-red-100 rounded-lg transition flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Eliminar
                      </button>
                    </div>

                    {/* Items Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-secondary">
                          <tr>
                            <th className="px-4 py-3 text-left font-bold text-foreground">Data</th>
                            <th className="px-4 py-3 text-left font-bold text-foreground">Cliente</th>
                            <th className="px-4 py-3 text-left font-bold text-foreground">Fatura</th>
                            <th className="px-4 py-3 text-center font-bold text-foreground">Parcela</th>
                            <th className="px-4 py-3 text-right font-bold text-foreground">Valor PDF</th>
                            <th className="px-4 py-3 text-right font-bold text-foreground">Valor Sistema</th>
                            <th className="px-4 py-3 text-right font-bold text-primary">Comissão PDF</th>
                            <th className="px-4 py-3 text-right font-bold text-foreground">Comissão Sist.</th>
                            <th className="px-4 py-3 text-center font-bold text-foreground">Estado</th>
                            <th className="px-4 py-3 text-center font-bold text-foreground">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {itensToShow.map((item) => (
                            <tr
                              key={item.id}
                              className={
                                item.corresponde || item.resolvido
                                  ? "bg-green-500/5"
                                  : "bg-red-500/5"
                              }
                            >
                              <td className="px-4 py-3 text-foreground">{formatDate(item.dataPagamentoPdf)}</td>
                              <td className="px-4 py-3">
                                {item.clienteId ? (
                                  <Link href={`/clientes/${item.clienteId}`} className="text-primary hover:underline font-medium">
                                    {item.nomeClientePdf || item.codigoClientePdf}
                                  </Link>
                                ) : (
                                  <span className="text-foreground">{item.codigoClientePdf}</span>
                                )}
                                <span className="text-muted-foreground text-xs ml-2">({item.codigoClientePdf})</span>
                              </td>
                              <td className="px-4 py-3 text-foreground">
                                <span className="text-muted-foreground text-xs">{item.seriePdf}/</span>
                                {item.numeroPdf}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="bg-secondary px-2 py-1 rounded font-medium">{item.parcelaPdf}</span>
                              </td>
                              <td className="px-4 py-3 text-right font-medium text-foreground">{formatCurrency(item.valorLiquidoPdf)} €</td>
                              <td className="px-4 py-3 text-right text-foreground">
                                {item.valorSistema !== null ? `${formatCurrency(item.valorSistema)} €` : "-"}
                                {item.diferencaValor !== null && item.diferencaValor !== 0 && (
                                  <span className={`ml-1 text-xs ${item.diferencaValor > 0 ? "text-green-600" : "text-red-600"}`}>
                                    ({item.diferencaValor > 0 ? "+" : ""}{formatCurrency(item.diferencaValor)})
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right font-bold text-primary">{formatCurrency(item.valorComissaoPdf)} €</td>
                              <td className="px-4 py-3 text-right text-foreground">
                                {item.comissaoSistema !== null ? `${formatCurrency(item.comissaoSistema)} €` : "-"}
                              </td>
                              <td className="px-4 py-3 text-center">
                                {item.corresponde ? (
                                  <span className="text-green-600 flex items-center justify-center gap-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    OK
                                  </span>
                                ) : item.resolvido ? (
                                  <span className="text-blue-600 flex items-center justify-center gap-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Resolvido
                                  </span>
                                ) : (
                                  <span className="text-red-600 text-xs font-medium">
                                    {item.tipoDiscrepancia ? discrepanciaLabels[item.tipoDiscrepancia] : "Problema"}
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-center">
                                {!item.corresponde && !item.resolvido && (
                                  <button
                                    onClick={() => handleResolveWithNote(rec.id, item)}
                                    className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
                                  >
                                    Resolver
                                  </button>
                                )}
                                {item.resolvido && item.notaResolucao && (
                                  <button
                                    onClick={() => Swal.fire({ title: "Nota de Resolução", text: item.notaResolucao || "", confirmButtonColor: "#b8860b" })}
                                    className="px-3 py-1 text-xs bg-secondary text-foreground rounded-lg hover:bg-muted transition"
                                  >
                                    Ver nota
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
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
