"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { formatCurrency } from "@/lib/utils"

type Orcamento = {
  id: string
  numero: string
  titulo: string | null
  introducao: string | null
  condicoes: string | null
  estado: "RASCUNHO" | "ENVIADO" | "ACEITE" | "REJEITADO" | "EXPIRADO"
  subtotal: string
  iva: string
  total: string
  validadeDias: number
  dataEmissao: string
  dataValidade: string | null
  prospecto: { id: string; nomeEmpresa: string; email: string | null; telefone: string | null; morada: string | null } | null
  cliente: { id: string; nome: string; email: string | null; telefone: string | null; morada: string | null } | null
  itens: Array<{
    id: string
    descricao: string
    quantidade: string
    precoUnit: string
    desconto: string
    subtotal: string
    produto: { id: string; nome: string; codigo: string | null } | null
  }>
}

const estadoLabels: Record<string, string> = {
  RASCUNHO: "Rascunho",
  ENVIADO: "Enviado",
  ACEITE: "Aceite",
  REJEITADO: "Rejeitado",
  EXPIRADO: "Expirado"
}

const estadoColors: Record<string, string> = {
  RASCUNHO: "bg-gray-100 text-gray-700",
  ENVIADO: "bg-blue-100 text-blue-700",
  ACEITE: "bg-green-100 text-green-700",
  REJEITADO: "bg-red-100 text-red-700",
  EXPIRADO: "bg-yellow-100 text-yellow-700"
}

export default function OrcamentoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [orcamento, setOrcamento] = useState<Orcamento | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloadingPdf, setDownloadingPdf] = useState(false)

  useEffect(() => {
    fetchOrcamento()
  }, [id])

  async function fetchOrcamento() {
    try {
      const res = await fetch(`/api/orcamentos/${id}`)
      if (res.ok) {
        const data = await res.json()
        setOrcamento(data)
      } else {
        router.push("/orcamentos")
      }
    } catch (error) {
      console.error("Error fetching orcamento:", error)
    } finally {
      setLoading(false)
    }
  }

  async function updateEstado(estado: string) {
    try {
      const res = await fetch(`/api/orcamentos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado })
      })
      if (res.ok) {
        fetchOrcamento()
      }
    } catch (error) {
      console.error("Error updating orcamento:", error)
    }
  }

  async function handleDownloadPdf() {
    setDownloadingPdf(true)
    try {
      const res = await fetch(`/api/orcamentos/${id}/pdf`)
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `orcamento_${orcamento?.numero || id}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        a.remove()
      } else {
        alert("Erro ao gerar PDF")
      }
    } catch (error) {
      console.error("Error downloading PDF:", error)
      alert("Erro ao gerar PDF")
    } finally {
      setDownloadingPdf(false)
    }
  }

  function handlePrint() {
    window.open(`/api/orcamentos/${id}/pdf`, "_blank")
  }

  function handleSendEmail() {
    if (!orcamento) return
    const destinatario = orcamento.cliente || orcamento.prospecto
    const email = destinatario?.email || ""
    const nome = orcamento.cliente?.nome || orcamento.prospecto?.nomeEmpresa || ""
    const subject = encodeURIComponent(`Orcamento ${orcamento.numero}${orcamento.titulo ? ` - ${orcamento.titulo}` : ""}`)
    const body = encodeURIComponent(
      `Exmo(a) Sr(a) ${nome},\n\n` +
      `Segue em anexo o orcamento ${orcamento.numero} no valor de ${formatCurrency(Number(orcamento.total))} EUR.\n\n` +
      `Por favor, nao hesite em contactar-nos para qualquer esclarecimento.\n\n` +
      `Com os melhores cumprimentos,\nCarolina Cardoso`
    )
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`
  }

  function handleSendWhatsApp() {
    if (!orcamento) return
    const destinatario = orcamento.cliente || orcamento.prospecto
    const telefone = destinatario?.telefone?.replace(/\D/g, "") || ""
    const nome = orcamento.cliente?.nome || orcamento.prospecto?.nomeEmpresa || ""
    const message = encodeURIComponent(
      `Ola ${nome}!\n\n` +
      `Segue o orcamento ${orcamento.numero}${orcamento.titulo ? ` - ${orcamento.titulo}` : ""} ` +
      `no valor total de ${formatCurrency(Number(orcamento.total))} EUR (IVA incluido).\n\n` +
      `Para qualquer duvida, estou a disposicao.\n\n` +
      `Carolina Cardoso`
    )
    // Open WhatsApp - if telefone starts with Portuguese code, use it; otherwise assume Portugal
    const phone = telefone.startsWith("351") ? telefone : `351${telefone}`
    window.open(`https://wa.me/${phone}?text=${message}`, "_blank")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!orcamento) {
    return null
  }

  const destinatario = orcamento.cliente || orcamento.prospecto
  const destinatarioNome = orcamento.cliente?.nome || orcamento.prospecto?.nomeEmpresa

  return (
    <div className="max-w-4xl">
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link
              href="/orcamentos"
              className="text-muted-foreground hover:text-foreground transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-3xl font-medium tracking-wide text-foreground">{orcamento.numero}</h1>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${estadoColors[orcamento.estado]}`}>
              {estadoLabels[orcamento.estado]}
            </span>
          </div>
          <p className="text-muted-foreground">{orcamento.titulo || "Sem titulo"}</p>
        </div>

        <div className="text-right">
          <p className="text-3xl font-bold text-foreground">
            {formatCurrency(Number(orcamento.total))}
          </p>
          <p className="text-sm text-muted-foreground">Total com IVA</p>
        </div>
      </div>

      {/* Share Actions */}
      <div className="bg-card rounded-2xl border border-border p-4 mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm text-muted-foreground mr-2">Partilhar:</span>
          <button
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-red-50 text-red-700 hover:bg-red-100 rounded-lg transition disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {downloadingPdf ? "A gerar..." : "Download PDF"}
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Imprimir
          </button>
          <button
            onClick={handleSendEmail}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Email
          </button>
          <button
            onClick={handleSendWhatsApp}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-green-50 text-green-700 hover:bg-green-100 rounded-lg transition"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            WhatsApp
          </button>
        </div>
      </div>

      {/* Estado Actions */}
      <div className="bg-card rounded-2xl border border-border p-4 mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm text-muted-foreground">Alterar estado:</span>
          {orcamento.estado === "RASCUNHO" && (
            <button
              onClick={() => updateEstado("ENVIADO")}
              className="px-4 py-2 text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg transition"
            >
              Marcar Enviado
            </button>
          )}
          {orcamento.estado === "ENVIADO" && (
            <>
              <button
                onClick={() => updateEstado("ACEITE")}
                className="px-4 py-2 text-sm bg-green-100 text-green-700 hover:bg-green-200 rounded-lg transition"
              >
                Marcar Aceite
              </button>
              <button
                onClick={() => updateEstado("REJEITADO")}
                className="px-4 py-2 text-sm bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition"
              >
                Marcar Rejeitado
              </button>
            </>
          )}
          {(orcamento.estado === "ACEITE" || orcamento.estado === "REJEITADO") && (
            <button
              onClick={() => updateEstado("RASCUNHO")}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition"
            >
              Voltar a Rascunho
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Destinatario */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <h2 className="font-medium text-foreground mb-4">Destinatario</h2>
          <p className="font-medium">{destinatarioNome}</p>
          {destinatario?.email && <p className="text-sm text-muted-foreground">{destinatario.email}</p>}
          {destinatario?.telefone && <p className="text-sm text-muted-foreground">{destinatario.telefone}</p>}
          {destinatario?.morada && <p className="text-sm text-muted-foreground mt-2">{destinatario.morada}</p>}
        </div>

        {/* Datas */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <h2 className="font-medium text-foreground mb-4">Informacoes</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Data Emissao:</span>
              <span>{new Date(orcamento.dataEmissao).toLocaleDateString("pt-PT")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Validade:</span>
              <span>{orcamento.validadeDias} dias</span>
            </div>
            {orcamento.dataValidade && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Valido ate:</span>
                <span>{new Date(orcamento.dataValidade).toLocaleDateString("pt-PT")}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Introducao */}
      {orcamento.introducao && (
        <div className="bg-card rounded-2xl border border-border p-6 mb-6">
          <h2 className="font-medium text-foreground mb-2">Introducao</h2>
          <p className="text-muted-foreground whitespace-pre-wrap">{orcamento.introducao}</p>
        </div>
      )}

      {/* Itens */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden mb-6">
        <div className="p-4 border-b border-border">
          <h2 className="font-medium text-foreground">Itens</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-muted/50 text-sm">
              <th className="text-left p-4">Descrição</th>
              <th className="text-right p-4">Qtd</th>
              <th className="text-right p-4">Preco</th>
              <th className="text-right p-4">Desc.</th>
              <th className="text-right p-4">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {orcamento.itens.map((item, index) => {
              const isVarios = item.descricao.startsWith("[Varios]")
              const isCampanha = item.descricao.startsWith("[Campanha]")
              const displayDesc = item.descricao.replace("[Varios] ", "").replace("[Campanha] ", "")

              return (
                <tr
                  key={item.id}
                  className={`${index % 2 === 0 ? "" : "bg-muted/20"} ${
                    isVarios ? "bg-purple-50/50 dark:bg-purple-900/10" :
                    isCampanha ? "bg-amber-50/50 dark:bg-amber-900/10" : ""
                  }`}
                >
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {isVarios && (
                        <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded">Varios</span>
                      )}
                      {isCampanha && (
                        <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded">Campanha</span>
                      )}
                      <span>{displayDesc}</span>
                    </div>
                    {item.produto?.codigo && (
                      <p className="text-xs text-muted-foreground font-mono">{item.produto.codigo}</p>
                    )}
                  </td>
                  <td className="p-4 text-right">{Number(item.quantidade)}</td>
                  <td className="p-4 text-right">{formatCurrency(Number(item.precoUnit))}</td>
                  <td className="p-4 text-right">{formatCurrency(Number(item.desconto))}</td>
                  <td className="p-4 text-right font-medium">{formatCurrency(Number(item.subtotal))}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Totais */}
      <div className="bg-card rounded-2xl border border-border p-6 mb-6">
        <div className="space-y-2 max-w-xs ml-auto">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal:</span>
            <span className="font-medium">{formatCurrency(Number(orcamento.subtotal))}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">IVA (23%):</span>
            <span className="font-medium">{formatCurrency(Number(orcamento.iva))}</span>
          </div>
          <div className="flex justify-between text-xl pt-2 border-t border-border">
            <span className="font-medium">Total:</span>
            <span className="font-bold">{formatCurrency(Number(orcamento.total))}</span>
          </div>
        </div>
      </div>

      {/* Condicoes */}
      {orcamento.condicoes && (
        <div className="bg-card rounded-2xl border border-border p-6">
          <h2 className="font-medium text-foreground mb-2">Condicoes</h2>
          <p className="text-muted-foreground whitespace-pre-wrap">{orcamento.condicoes}</p>
        </div>
      )}
    </div>
  )
}
