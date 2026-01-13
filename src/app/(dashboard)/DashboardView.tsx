"use client"

import { useState, useEffect } from "react"
import SalesCharts from "./SalesCharts"

const meses = [
  "", "Janeiro", "Fevereiro", "Marco", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
]

const IVA_RATE = 0.23

function calcularIVA(totalComIVA: number) {
  const semIVA = totalComIVA / (1 + IVA_RATE)
  const iva = totalComIVA - semIVA
  return { semIVA, iva }
}

interface DashboardData {
  totalClientes: number
  clientesAtivos: number
  vendasMes: number
  vendasTrimestre: number
  vendasAno: number
  pendentes: number
  objetivoMensal: number
  objetivoTrimestral: number
  objetivoAnual: number
  progressoMensal: number
  progressoTrimestral: number
  progressoAnual: number
  currentMonth: number
  currentYear: number
  currentTrimestre: number
  premioMensalAtual: { minimo: number; premio: number } | null
  proximoPremioMensal: { minimo: number; premio: number } | null
  premioTrimestralAtual: { minimo: number; premio: number } | null
  proximoPremioTrimestral: { minimo: number; premio: number } | null
  anosDisponiveis: number[]
}

export default function DashboardView() {
  const currentDate = new Date()
  const [ano, setAno] = useState(currentDate.getFullYear())
  const [mes, setMes] = useState(currentDate.getMonth() + 1)
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)

  useEffect(() => {
    fetchData()
  }, [ano, mes])

  async function fetchData() {
    setLoading(true)
    try {
      const res = await fetch(`/api/dashboard?ano=${ano}&mes=${mes}`)
      const json = await res.json()
      setData(json)
    } catch (error) {
      console.error("Error fetching dashboard:", error)
    }
    setLoading(false)
  }

  async function exportToExcel(tipo: string) {
    setExporting(true)
    setShowExportMenu(false)
    try {
      const res = await fetch(`/api/export/vendas?ano=${ano}&tipo=${tipo}`)
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `Relatorio_Vendas_${ano}${tipo !== "completo" ? `_${tipo}` : ""}.xlsx`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error("Error exporting:", error)
    }
    setExporting(false)
  }

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  const ivaMes = calcularIVA(data.vendasMes)
  const ivaTrimestre = calcularIVA(data.vendasTrimestre)
  const ivaAno = calcularIVA(data.vendasAno)

  // Build year options - include current year and any years with data
  const yearsSet = new Set([currentDate.getFullYear(), ...data.anosDisponiveis])
  const years = Array.from(yearsSet).sort((a, b) => b - a)

  return (
    <div>
      {/* Header with Period Selectors */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">{meses[data.currentMonth]} {data.currentYear}</p>
        </div>

        <div className="flex gap-3">
          <div className="bg-card rounded-xl shadow-sm p-2 flex items-center gap-2 border border-border">
            <label className="text-sm font-medium text-muted-foreground pl-2">Ano:</label>
            <select
              value={ano}
              onChange={(e) => setAno(parseInt(e.target.value))}
              className="border-0 bg-primary/10 text-primary font-bold rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary"
            >
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div className="bg-card rounded-xl shadow-sm p-2 flex items-center gap-2 border border-border">
            <label className="text-sm font-medium text-muted-foreground pl-2">Mes:</label>
            <select
              value={mes}
              onChange={(e) => setMes(parseInt(e.target.value))}
              className="border-0 bg-primary/10 text-primary font-bold rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary"
            >
              {meses.slice(1).map((m, i) => (
                <option key={i + 1} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>

          {/* Export Button */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={exporting}
              className="bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl px-4 py-3 flex items-center gap-2 shadow-sm transition disabled:opacity-50"
            >
              {exporting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
              Exportar Excel
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-card rounded-xl shadow-lg border border-border py-2 z-50">
                <button
                  onClick={() => exportToExcel("completo")}
                  className="w-full px-4 py-2 text-left text-foreground hover:bg-secondary flex items-center gap-2"
                >
                  <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="font-medium">Relatorio Completo</span>
                </button>
                <button
                  onClick={() => exportToExcel("detalhado")}
                  className="w-full px-4 py-2 text-left text-foreground hover:bg-secondary flex items-center gap-2"
                >
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span>Vendas Detalhadas</span>
                </button>
                <button
                  onClick={() => exportToExcel("mensal")}
                  className="w-full px-4 py-2 text-left text-foreground hover:bg-secondary flex items-center gap-2"
                >
                  <svg className="w-4 h-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Resumo Mensal</span>
                </button>
                <button
                  onClick={() => exportToExcel("trimestral")}
                  className="w-full px-4 py-2 text-left text-foreground hover:bg-secondary flex items-center gap-2"
                >
                  <svg className="w-4 h-4 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span>Resumo Trimestral</span>
                </button>
                <button
                  onClick={() => exportToExcel("clientes")}
                  className="w-full px-4 py-2 text-left text-foreground hover:bg-secondary flex items-center gap-2"
                >
                  <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                  <span>Vendas por Cliente</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Clientes Ativos"
          value={data.clientesAtivos.toString()}
          subtitle={`${data.totalClientes} total`}
          color="purple"
          icon="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
        />
        <StatCard
          title={`Vendas ${meses[data.currentMonth]}`}
          value={`${data.vendasMes.toFixed(2)} €`}
          subtitle={data.objetivoMensal > 0 ? `Objetivo: ${data.objetivoMensal.toFixed(2)} €` : "Sem objetivo definido"}
          color="green"
          icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
        <StatCard
          title={`Vendas ${data.currentTrimestre}º Trimestre`}
          value={`${data.vendasTrimestre.toFixed(2)} €`}
          subtitle={data.objetivoTrimestral > 0 ? `Objetivo: ${data.objetivoTrimestral.toFixed(2)} €` : "Sem objetivo definido"}
          color="blue"
          icon="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
        />
        <StatCard
          title="A Receber"
          value={`${data.pendentes.toFixed(2)} €`}
          subtitle="Cobrancas pendentes"
          color="orange"
          icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </div>

      {/* Annual Stats */}
      <div className="bg-card rounded-2xl shadow-sm p-6 mb-8 border-l-4 border-indigo-500">
        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          Resumo Anual {data.currentYear}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-secondary rounded-xl p-4 text-center">
            <p className="text-xs font-semibold text-muted-foreground mb-1">Total Vendas</p>
            <p className="text-xl font-bold text-foreground">{data.vendasAno.toFixed(2)} €</p>
          </div>
          <div className="bg-indigo-50 rounded-xl p-4 text-center">
            <p className="text-xs font-semibold text-indigo-600 mb-1">Sem IVA</p>
            <p className="text-xl font-bold text-indigo-700">{ivaAno.semIVA.toFixed(2)} €</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-4 text-center">
            <p className="text-xs font-semibold text-blue-600 mb-1">IVA (23%)</p>
            <p className="text-xl font-bold text-blue-700">{ivaAno.iva.toFixed(2)} €</p>
          </div>
          <div className="bg-indigo-50 rounded-xl p-4 text-center border-2 border-indigo-200">
            <p className="text-xs font-semibold text-indigo-600 mb-1">Objetivo Anual</p>
            <p className="text-xl font-bold text-indigo-700">{data.objetivoAnual > 0 ? `${data.objetivoAnual.toFixed(2)} €` : "N/D"}</p>
          </div>
        </div>
        {data.objetivoAnual > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium text-foreground">Progresso Anual</span>
              <span className="font-bold text-indigo-600">{data.progressoAnual.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${data.progressoAnual >= 100 ? "bg-green-500" : "bg-indigo-500"}`}
                style={{ width: `${Math.min(data.progressoAnual, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* VAT Summary Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Monthly VAT */}
        <div className="bg-card rounded-2xl shadow-sm p-6">
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            IVA Mensal - {meses[data.currentMonth]}
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-secondary rounded-xl p-4 text-center">
              <p className="text-xs font-semibold text-muted-foreground mb-1">Sem IVA</p>
              <p className="text-xl font-bold text-foreground">{ivaMes.semIVA.toFixed(2)} €</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <p className="text-xs font-semibold text-blue-600 mb-1">IVA (23%)</p>
              <p className="text-xl font-bold text-blue-700">{ivaMes.iva.toFixed(2)} €</p>
            </div>
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <p className="text-xs font-semibold text-green-600 mb-1">Total c/IVA</p>
              <p className="text-xl font-bold text-green-700">{data.vendasMes.toFixed(2)} €</p>
            </div>
          </div>
        </div>

        {/* Quarterly VAT */}
        <div className="bg-card rounded-2xl shadow-sm p-6">
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            IVA Trimestral - {data.currentTrimestre}º Trimestre
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-secondary rounded-xl p-4 text-center">
              <p className="text-xs font-semibold text-muted-foreground mb-1">Sem IVA</p>
              <p className="text-xl font-bold text-foreground">{ivaTrimestre.semIVA.toFixed(2)} €</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <p className="text-xs font-semibold text-blue-600 mb-1">IVA (23%)</p>
              <p className="text-xl font-bold text-blue-700">{ivaTrimestre.iva.toFixed(2)} €</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 text-center border-2 border-blue-200">
              <p className="text-xs font-semibold text-blue-600 mb-1">Total c/IVA</p>
              <p className="text-xl font-bold text-blue-700">{data.vendasTrimestre.toFixed(2)} €</p>
            </div>
          </div>
        </div>
      </div>

      {/* Prize Progress Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Monthly Prize */}
        <div className="bg-card rounded-2xl shadow-sm p-6 border-l-4 border-yellow-500">
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            Premio Mensal - {meses[data.currentMonth]}
          </h3>

          {data.premioMensalAtual ? (
            <div className="bg-green-50 rounded-xl p-4 mb-4 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-green-700">Premio Garantido!</p>
                  <p className="text-xs text-green-600">Vendas: {data.vendasMes.toFixed(2)} € (min: {data.premioMensalAtual.minimo.toFixed(2)} €)</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-700">{data.premioMensalAtual.premio.toFixed(2)} €</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-secondary rounded-xl p-4 mb-4 border border-border">
              <p className="text-sm text-muted-foreground">Ainda sem premio este mes</p>
              <p className="text-xs text-muted-foreground">Vendas: {data.vendasMes.toFixed(2)} €</p>
            </div>
          )}

          {data.proximoPremioMensal ? (
            <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-yellow-700">Proximo Premio</p>
                  <p className="text-xs text-yellow-600">Objetivo: {data.proximoPremioMensal.minimo.toFixed(2)} €</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-yellow-700">{data.proximoPremioMensal.premio.toFixed(2)} €</p>
                </div>
              </div>
              <div className="w-full bg-yellow-200 rounded-full h-3 mb-2">
                <div
                  className="bg-yellow-500 h-3 rounded-full transition-all"
                  style={{ width: `${Math.min((data.vendasMes / data.proximoPremioMensal.minimo) * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs font-medium text-yellow-700 text-center">
                Faltam {(data.proximoPremioMensal.minimo - data.vendasMes).toFixed(2)} €
              </p>
            </div>
          ) : data.premioMensalAtual ? (
            <div className="bg-green-100 rounded-xl p-4 border border-green-300 text-center">
              <p className="text-sm font-bold text-green-700">Parabens! Premio maximo atingido!</p>
            </div>
          ) : null}
        </div>

        {/* Quarterly Prize */}
        <div className="bg-card rounded-2xl shadow-sm p-6 border-l-4 border-purple-500">
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            Premio Trimestral - {data.currentTrimestre}º Trimestre {data.currentYear}
          </h3>

          {data.premioTrimestralAtual ? (
            <div className="bg-green-50 rounded-xl p-4 mb-4 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-green-700">Premio Garantido!</p>
                  <p className="text-xs text-green-600">Vendas: {data.vendasTrimestre.toFixed(2)} € (min: {data.premioTrimestralAtual.minimo.toFixed(2)} €)</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-700">{data.premioTrimestralAtual.premio.toFixed(2)} €</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-secondary rounded-xl p-4 mb-4 border border-border">
              <p className="text-sm text-muted-foreground">Ainda sem premio este trimestre</p>
              <p className="text-xs text-muted-foreground">Vendas: {data.vendasTrimestre.toFixed(2)} €</p>
            </div>
          )}

          {data.proximoPremioTrimestral ? (
            <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-purple-700">Proximo Premio</p>
                  <p className="text-xs text-purple-600">Objetivo: {data.proximoPremioTrimestral.minimo.toFixed(2)} €</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-purple-700">{data.proximoPremioTrimestral.premio.toFixed(2)} €</p>
                </div>
              </div>
              <div className="w-full bg-purple-200 rounded-full h-3 mb-2">
                <div
                  className="bg-purple-500 h-3 rounded-full transition-all"
                  style={{ width: `${Math.min((data.vendasTrimestre / data.proximoPremioTrimestral.minimo) * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs font-medium text-purple-700 text-center">
                Faltam {(data.proximoPremioTrimestral.minimo - data.vendasTrimestre).toFixed(2)} €
              </p>
            </div>
          ) : data.premioTrimestralAtual ? (
            <div className="bg-green-100 rounded-xl p-4 border border-green-300 text-center">
              <p className="text-sm font-bold text-green-700">Parabens! Premio maximo atingido!</p>
            </div>
          ) : null}
        </div>
      </div>

      {/* Progress Cards */}
      {(data.objetivoMensal > 0 || data.objetivoTrimestral > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {data.objetivoMensal > 0 && (
            <ProgressCard
              title="Progresso Mensal"
              current={data.vendasMes}
              target={data.objetivoMensal}
              percentage={data.progressoMensal}
            />
          )}
          {data.objetivoTrimestral > 0 && (
            <ProgressCard
              title="Progresso Trimestral"
              current={data.vendasTrimestre}
              target={data.objetivoTrimestral}
              percentage={data.progressoTrimestral}
            />
          )}
        </div>
      )}

      {/* Sales Charts Section */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          Graficos e Tendencias
        </h2>
        <SalesCharts ano={ano} />
      </div>
    </div>
  )
}

function StatCard({ title, value, subtitle, color, icon }: {
  title: string
  value: string
  subtitle: string
  color: "purple" | "green" | "blue" | "orange"
  icon: string
}) {
  const colors = {
    purple: { border: "border-purple-500", bg: "bg-purple-50", iconBg: "bg-purple-100", iconText: "text-purple-600" },
    green: { border: "border-green-500", bg: "bg-green-50", iconBg: "bg-green-100", iconText: "text-green-600" },
    blue: { border: "border-blue-500", bg: "bg-blue-50", iconBg: "bg-blue-100", iconText: "text-blue-600" },
    orange: { border: "border-orange-500", bg: "bg-orange-50", iconBg: "bg-orange-100", iconText: "text-orange-600" }
  }

  const c = colors[color]

  return (
    <div className={`bg-card rounded-2xl shadow-sm border-l-4 ${c.border} p-6`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 ${c.iconBg} rounded-lg`}>
          <svg className={`w-5 h-5 ${c.iconText}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
          </svg>
        </div>
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
    </div>
  )
}

function ProgressCard({ title, current, target, percentage }: {
  title: string
  current: number
  target: number
  percentage: number
}) {
  const remaining = target - current
  const isComplete = percentage >= 100

  return (
    <div className="bg-card rounded-2xl shadow-sm p-6">
      <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        {title}
      </h3>
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="font-medium text-foreground">Realizado: {current.toFixed(2)} €</span>
          <span className="font-bold text-purple-600">{percentage.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-4">
          <div
            className={`h-4 rounded-full transition-all ${isComplete ? "bg-green-500" : "bg-purple-500"}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>
      <div className="flex justify-between text-sm">
        <span className="font-medium text-muted-foreground">Objetivo: {target.toFixed(2)} €</span>
        <span className={`font-bold ${isComplete ? "text-green-600" : "text-orange-600"}`}>
          {isComplete ? "Objetivo atingido!" : `Falta: ${remaining.toFixed(2)} €`}
        </span>
      </div>
    </div>
  )
}
