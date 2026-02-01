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
              <th className="text-left p-4">Descricao</th>
              <th className="text-right p-4">Qtd</th>
              <th className="text-right p-4">Preco</th>
              <th className="text-right p-4">Desc.</th>
              <th className="text-right p-4">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {orcamento.itens.map((item, index) => (
              <tr key={item.id} className={index % 2 === 0 ? "" : "bg-muted/20"}>
                <td className="p-4">
                  <p>{item.descricao}</p>
                  {item.produto?.codigo && (
                    <p className="text-xs text-muted-foreground font-mono">{item.produto.codigo}</p>
                  )}
                </td>
                <td className="p-4 text-right">{Number(item.quantidade)}</td>
                <td className="p-4 text-right">{formatCurrency(Number(item.precoUnit))}</td>
                <td className="p-4 text-right">{formatCurrency(Number(item.desconto))}</td>
                <td className="p-4 text-right font-medium">{formatCurrency(Number(item.subtotal))}</td>
              </tr>
            ))}
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
