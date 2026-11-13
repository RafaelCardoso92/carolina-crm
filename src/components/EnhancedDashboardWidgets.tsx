"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { formatCurrency } from "@/lib/utils"
import HelpTooltip from "./HelpTooltip"

// Partnership Agreements Widget
export function AcordosWidget() {
  const [data, setData] = useState<{
    total: number
    atras: number
    noCaminho: number
    adiantado: number
    clientesAtRisk: Array<{
      clienteId: string
      clienteNome: string
      progressPercent: number
      deficit: number
    }>
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const searchParams = useSearchParams()
  const seller = searchParams.get("seller")

  useEffect(() => {
    async function fetchAcordos() {
      try {
        const sellerParam = seller ? `?seller=${seller}` : ""
        const res = await fetch(`/api/acordos${sellerParam}`)
        const acordos = await res.json()

        if (Array.isArray(acordos)) {
          const summary = {
            total: acordos.length,
            atras: acordos.filter((a: any) => a.estado === "ATRAS").length,
            noCaminho: acordos.filter((a: any) => a.estado === "NO_CAMINHO").length,
            adiantado: acordos.filter((a: any) => a.estado === "ADIANTADO").length,
            clientesAtRisk: acordos
              .filter((a: any) => a.estado === "ATRAS")
              .slice(0, 3)
              .map((a: any) => ({
                clienteId: a.clienteId,
                clienteNome: a.cliente?.nome || "Cliente",
                progressPercent: a.progressPercent,
                deficit: a.yearToDateTarget - a.yearToDateActual
              }))
          }

          setData(summary)
        }
      } catch (error) {
        console.error("Error:", error)
      }
      setLoading(false)
    }
    fetchAcordos()
  }, [seller])

  if (loading) {
    return (
      <div className="bg-card rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-muted rounded w-1/3"></div>
          <div className="h-4 bg-muted rounded w-full"></div>
        </div>
      </div>
    )
  }

  if (!data || data.total === 0) {
    return (
      <div className="bg-card rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
        <h3 className="text-lg font-medium text-foreground flex items-center gap-2 mb-4">
          <span className="p-2 bg-purple-500/10 rounded-lg">
            <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </span>
          Acordos de Parceria
          <HelpTooltip text="Clientes com compromissos anuais de compras. Mostra progresso trimestral e alerta quando estão atrasados." />
        </h3>
        <p className="text-muted-foreground text-sm">Sem acordos ativos</p>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
      <h3 className="text-lg font-medium text-foreground flex items-center gap-2 mb-4">
        <span className="p-2 bg-purple-500/10 rounded-lg">
          <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </span>
        Acordos de Parceria
        <HelpTooltip text="Clientes com compromissos anuais de compras. Mostra progresso trimestral e alerta quando estão atrasados." />
      </h3>

      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="text-center">
          <p className="text-xl font-bold text-foreground">{data.total}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold tabular-nums text-green-700 dark:text-green-400">{data.noCaminho}</p>
          <p className="text-xs text-muted-foreground">No Caminho</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold tabular-nums text-red-600 dark:text-red-400">{data.atras}</p>
          <p className="text-xs text-muted-foreground">Atrasados</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold tabular-nums text-primary">{data.adiantado}</p>
          <p className="text-xs text-muted-foreground">Adiantados</p>
        </div>
      </div>

      {data.clientesAtRisk.length > 0 && (
        <div className="pt-3 border-t border-border">
          <p className="text-xs font-medium text-red-700 dark:text-red-400 mb-2">Clientes atrasados - requer atenção:</p>
          <div className="space-y-1">
            {data.clientesAtRisk.map(client => (
              <Link
                key={client.clienteId}
                href={`/clientes/${client.clienteId}`}
                className="flex items-center justify-between p-2 bg-secondary rounded text-sm hover:bg-muted transition"
              >
                <span className="text-foreground truncate">{client.clienteNome}</span>
                <span className="text-red-700 dark:text-red-400 font-medium tabular-nums whitespace-nowrap ml-2">
                  -{formatCurrency(client.deficit)} €
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
