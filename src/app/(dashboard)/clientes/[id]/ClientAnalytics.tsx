"use client"

import { useEffect, useState } from "react"

type ProductHistory = {
  produtoId: string
  nome: string
  codigo: string | null
  categoria: string | null
  totalCompras: number
  totalQuantidade: number
  totalGasto: number
  ultimaCompra: { mes: number; ano: number } | null
}

type NeverPurchased = {
  produtoId: string
  nome: string
  codigo: string | null
  categoria: string | null
  popularidade: number
}

type Analytics = {
  cliente: { id: string; nome: string; codigo: string | null }
  resumo: {
    totalGasto: number
    totalVendas: number
    mediaVenda: number
    produtosUnicos: number
  }
  historicoCompras: ProductHistory[]
  produtosNuncaComprados: NeverPurchased[]
  tendencia: { mes: number; ano: number; total: number }[]
}

const meses = [
  "", "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez"
]

export default function ClientAnalytics({ clienteId }: { clienteId: string }) {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch(`/api/analytics/cliente/${clienteId}`)
        if (!res.ok) throw new Error("Erro ao carregar análise")
        const data = await res.json()
        setAnalytics(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido")
      } finally {
        setLoading(false)
      }
    }
    fetchAnalytics()
  }, [clienteId])

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !analytics) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <p className="text-red-500">{error || "Erro ao carregar análise"}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Purchase History by Product */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-800">Histórico de Compras por Produto</h3>
        </div>

        {analytics.historicoCompras.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-2 text-left text-sm font-medium text-gray-500">Produto</th>
                  <th className="py-2 text-center text-sm font-medium text-gray-500">Compras</th>
                  <th className="py-2 text-center text-sm font-medium text-gray-500">Quantidade</th>
                  <th className="py-2 text-right text-sm font-medium text-gray-500">Total Gasto</th>
                  <th className="py-2 text-right text-sm font-medium text-gray-500">Última Compra</th>
                </tr>
              </thead>
              <tbody>
                {analytics.historicoCompras.map((product) => (
                  <tr key={product.produtoId} className="border-b border-gray-100 last:border-0">
                    <td className="py-3">
                      <span className="font-medium text-gray-800">{product.nome}</span>
                      {product.codigo && (
                        <span className="text-gray-500 text-sm ml-2">({product.codigo})</span>
                      )}
                      {product.categoria && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full ml-2">
                          {product.categoria}
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-center text-gray-600">{product.totalCompras}×</td>
                    <td className="py-3 text-center text-gray-600">{product.totalQuantidade.toFixed(1)}</td>
                    <td className="py-3 text-right font-semibold text-purple-700">{product.totalGasto.toFixed(2)} €</td>
                    <td className="py-3 text-right text-gray-500 text-sm">
                      {product.ultimaCompra ? `${meses[product.ultimaCompra.mes]} ${product.ultimaCompra.ano}` : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">Sem histórico de produtos</p>
        )}
      </div>

      {/* Upsell Recommendations */}
      {analytics.produtosNuncaComprados.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl shadow-sm p-6 border border-amber-200">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <h3 className="text-lg font-semibold text-amber-800">Oportunidades de Upsell</h3>
          </div>
          <p className="text-sm text-amber-700 mb-4">
            Este cliente nunca comprou os seguintes produtos (ordenados por popularidade):
          </p>
          <div className="flex flex-wrap gap-2">
            {analytics.produtosNuncaComprados.slice(0, 10).map((product) => (
              <div
                key={product.produtoId}
                className="bg-white border border-amber-300 rounded-lg px-3 py-2"
              >
                <span className="font-medium text-gray-800">{product.nome}</span>
                {product.popularidade > 0 && (
                  <span className="text-xs text-amber-600 ml-2">
                    ({product.popularidade} vendas)
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sales Trend */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-800">Tendência de Vendas (12 meses)</h3>
        </div>

        <div className="flex items-end gap-1 h-32">
          {analytics.tendencia.map((item, index) => {
            const maxTotal = Math.max(...analytics.tendencia.map(t => t.total))
            const height = maxTotal > 0 ? (item.total / maxTotal) * 100 : 0
            return (
              <div key={index} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={`w-full rounded-t transition-all ${item.total > 0 ? "bg-purple-500" : "bg-gray-200"}`}
                  style={{ height: `${Math.max(height, 4)}%` }}
                  title={`${meses[item.mes]} ${item.ano}: ${item.total.toFixed(2)} €`}
                />
                <span className="text-xs text-gray-500 truncate w-full text-center">
                  {meses[item.mes]}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
