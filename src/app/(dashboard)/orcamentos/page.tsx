"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Swal from "sweetalert2"
import { formatCurrency } from "@/lib/utils"

type Orcamento = {
  id: string
  numero: string
  titulo: string | null
  estado: "RASCUNHO" | "ENVIADO" | "ACEITE" | "REJEITADO" | "EXPIRADO"
  subtotal: string
  iva: string
  total: string
  dataEmissao: string
  dataValidade: string | null
  prospecto: { id: string; nomeEmpresa: string; email: string | null } | null
  cliente: { id: string; nome: string; email: string | null } | null
  itens: Array<{
    id: string
    descricao: string
    quantidade: string
    precoUnit: string
    subtotal: string
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

export default function OrcamentosPage() {
  const router = useRouter()
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>("all")

  useEffect(() => {
    fetchOrcamentos()
  }, [])

  async function fetchOrcamentos() {
    try {
      const res = await fetch("/api/orcamentos")
      if (res.ok) {
        const data = await res.json()
        setOrcamentos(data)
      }
    } catch (error) {
      console.error("Error fetching orcamentos:", error)
    } finally {
      setLoading(false)
    }
  }

  async function updateEstado(id: string, estado: string) {
    try {
      const res = await fetch(`/api/orcamentos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado })
      })
      if (res.ok) {
        fetchOrcamentos()
      }
    } catch (error) {
      console.error("Error updating orcamento:", error)
    }
  }

  async function deleteOrcamento(id: string) {
    const result = await Swal.fire({
      title: "Eliminar orcamento?",
      text: "Tem a certeza que quer eliminar este orcamento?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#c41e3a",
      cancelButtonColor: "#666666",
      confirmButtonText: "Sim, eliminar",
      cancelButtonText: "Cancelar"
    })

    if (!result.isConfirmed) return

    try {
      const res = await fetch(`/api/orcamentos/${id}`, { method: "DELETE" })
      if (res.ok) {
        fetchOrcamentos()
      } else {
        Swal.fire({
          icon: "error",
          title: "Erro",
          text: "Erro ao eliminar orçamento",
          confirmButtonColor: "#b8860b"
        })
      }
    } catch (error) {
      console.error("Error deleting orcamento:", error)
      Swal.fire({
        icon: "error",
        title: "Erro",
        text: "Erro ao eliminar orçamento",
        confirmButtonColor: "#b8860b"
      })
    }
  }

  const filteredOrcamentos = filter === "all"
    ? orcamentos
    : orcamentos.filter(o => o.estado === filter)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Orcamentos</h1>
          <p className="text-muted-foreground text-sm mt-1">{orcamentos.length} orcamentos</p>
        </div>
        <Link
          href="/orcamentos/novo"
          className="bg-primary text-primary-foreground px-4 md:px-6 py-2.5 md:py-3 rounded-xl font-semibold hover:bg-primary-hover transition flex items-center justify-center gap-2 shadow-lg shadow-primary/20 text-sm md:text-base"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="hidden sm:inline">Novo Orcamento</span>
          <span className="sm:hidden">Novo</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {["all", "RASCUNHO", "ENVIADO", "ACEITE", "REJEITADO", "EXPIRADO"].map(estado => (
          <button
            key={estado}
            onClick={() => setFilter(estado)}
            className={`px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition ${
              filter === estado
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {estado === "all" ? "Todos" : estadoLabels[estado]}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-4">
        {filteredOrcamentos.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border p-8 text-center text-muted-foreground">
            Nenhum orcamento encontrado
          </div>
        ) : (
          filteredOrcamentos.map(orcamento => (
            <div
              key={orcamento.id}
              className="bg-card rounded-2xl border border-border p-4 md:p-6 hover:border-primary/30 transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="font-mono text-sm text-muted-foreground">{orcamento.numero}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${estadoColors[orcamento.estado]}`}>
                      {estadoLabels[orcamento.estado]}
                    </span>
                  </div>
                  <h3 className="font-medium text-foreground mb-1">
                    {orcamento.titulo || "Sem titulo"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {orcamento.cliente?.nome || orcamento.prospecto?.nomeEmpresa || "Sem destinatario"}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 md:gap-4 mt-2 text-xs text-muted-foreground">
                    <span>Emissao: {new Date(orcamento.dataEmissao).toLocaleDateString("pt-PT")}</span>
                    {orcamento.dataValidade && (
                      <span>Validade: {new Date(orcamento.dataValidade).toLocaleDateString("pt-PT")}</span>
                    )}
                    <span>{orcamento.itens.length} itens</span>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <p className="text-xl md:text-2xl font-bold text-foreground">
                    {formatCurrency(Number(orcamento.total))}€
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Subtotal: {formatCurrency(Number(orcamento.subtotal))}€
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-border">
                <Link
                  href={`/orcamentos/${orcamento.id}`}
                  className="px-3 md:px-4 py-2 text-sm bg-muted hover:bg-muted/80 rounded-lg transition"
                >
                  Ver Detalhes
                </Link>

                {orcamento.estado === "RASCUNHO" && (
                  <button
                    onClick={() => updateEstado(orcamento.id, "ENVIADO")}
                    className="px-3 md:px-4 py-2 text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg transition"
                  >
                    Marcar Enviado
                  </button>
                )}

                {orcamento.estado === "ENVIADO" && (
                  <>
                    <button
                      onClick={() => updateEstado(orcamento.id, "ACEITE")}
                      className="px-3 md:px-4 py-2 text-sm bg-green-100 text-green-700 hover:bg-green-200 rounded-lg transition"
                    >
                      Aceite
                    </button>
                    <button
                      onClick={() => updateEstado(orcamento.id, "REJEITADO")}
                      className="px-3 md:px-4 py-2 text-sm bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition"
                    >
                      Rejeitado
                    </button>
                  </>
                )}

                <button
                  onClick={() => deleteOrcamento(orcamento.id)}
                  className="sm:ml-auto px-3 md:px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
