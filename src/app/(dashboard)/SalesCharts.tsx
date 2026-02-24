"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from "recharts"

interface TrendsData {
  ano: number
  dadosMensais: Array<{
    mes: string
    mesNum: number
    vendas: number
    vendasAnoAnterior: number
    objetivo: number
  }>
  dadosTrimestrais: Array<{
    trimestre: string
    trimestreNum: number
    vendas: number
    objetivo: number
  }>
  dadosAcumulados: Array<{
    mes: string
    acumulado: number
  }>
  topClientes: Array<{
    nome: string
    vendas: number
  }>
}

const COLORS = ["#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe", "#ede9fe"]

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <p className="font-bold text-gray-800 dark:text-gray-100 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function SalesCharts({ ano }: { ano: number }) {
  const [data, setData] = useState<TrendsData | null>(null)
  const [loading, setLoading] = useState(true)
  const searchParams = useSearchParams()
  const seller = searchParams.get("seller")

  useEffect(() => {
    fetchTrends()
  }, [ano, seller])

  async function fetchTrends() {
    setLoading(true)
    try {
      const sellerParam = seller ? `&seller=${seller}` : ""
      const res = await fetch(`/api/dashboard/trends?ano=${ano}${sellerParam}`)
      const json = await res.json()
      setData(json)
    } catch (error) {
      console.error("Error fetching trends:", error)
    }
    setLoading(false)
  }

  if (loading || !data) {
    return (
      <div className="bg-white dark:bg-card rounded-2xl shadow-sm p-6 flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  // Filter months with data for cleaner charts
  const mesesComDados = data.dadosMensais.filter(d => d.vendas > 0 || d.objetivo > 0)
  const temDados = mesesComDados.length > 0

  return (
    <div className="space-y-6">
      {/* Monthly Sales Bar Chart */}
      <div className="bg-white dark:bg-card rounded-2xl shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
          <div className="p-2 bg-purple-100 rounded-lg">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          Vendas Mensais {ano}
        </h3>
        {temDados ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.dadosMensais} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="mes" tick={{ fill: "#6b7280", fontSize: 12 }} />
              <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="vendas" name="Vendas" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="objetivo" name="Objetivo" fill="#e5e7eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
            Sem dados de vendas para {ano}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cumulative Sales Line Chart */}
        <div className="bg-white dark:bg-card rounded-2xl shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            Vendas Acumuladas
          </h3>
          {temDados ? (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={data.dadosAcumulados} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="mes" tick={{ fill: "#6b7280", fontSize: 12 }} />
                <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="acumulado"
                  name="Acumulado"
                  stroke="#10b981"
                  fill="#d1fae5"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
              Sem dados
            </div>
          )}
        </div>

        {/* Quarterly Sales */}
        <div className="bg-white dark:bg-card rounded-2xl shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            Vendas Trimestrais
          </h3>
          {temDados ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.dadosTrimestrais} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="trimestre" tick={{ fill: "#6b7280", fontSize: 12 }} />
                <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="vendas" name="Vendas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="objetivo" name="Objetivo" fill="#e5e7eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
              Sem dados
            </div>
          )}
        </div>
      </div>

      {/* Top Clients */}
      {data.topClientes.length > 0 && (
        <div className="bg-white dark:bg-card rounded-2xl shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            Top 5 Clientes {ano}
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              {data.topClientes.map((cliente, index) => {
                const maxVendas = data.topClientes[0].vendas
                const percentage = (cliente.vendas / maxVendas) * 100
                return (
                  <div key={index} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm`}
                      style={{ backgroundColor: COLORS[index] }}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-gray-800 dark:text-gray-100 text-sm truncate max-w-[150px]">{cliente.nome}</span>
                        <span className="font-bold text-purple-600 text-sm">{formatCurrency(cliente.vendas)}</span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%`, backgroundColor: COLORS[index] }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={data.topClientes}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="vendas"
                    nameKey="nome"
                  >
                    {data.topClientes.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Year over Year Comparison */}
      {data.dadosMensais.some(d => d.vendasAnoAnterior > 0) && (
        <div className="bg-white dark:bg-card rounded-2xl shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            Comparacao {ano} vs {ano - 1}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.dadosMensais} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="mes" tick={{ fill: "#6b7280", fontSize: 12 }} />
              <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="vendas"
                name={`${ano}`}
                stroke="#8b5cf6"
                strokeWidth={3}
                dot={{ fill: "#8b5cf6", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="vendasAnoAnterior"
                name={`${ano - 1}`}
                stroke="#cbd5e1"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: "#cbd5e1", strokeWidth: 2, r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
