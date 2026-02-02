"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Swal from "sweetalert2"
import { formatCurrency } from "@/lib/utils"
import { useTheme } from "@/components/ThemeProvider"

type Premio = {
  id: string
  minimo: number
  premio: number
  ordem: number
}

type ObjetivoAnual = {
  id: string
  ano: number
  objetivo: number
}

type ObjetivoTrimestral = {
  id: string
  trimestre: number
  ano: number
  objetivo: number
}

type ObjetivoMensal = {
  id: string
  mes: number
  ano: number
  objetivo: number
}

type Produto = {
  id: string
  nome: string
  codigo: string | null
  categoria: string | null
  descricao: string | null
  preco: number | null
  ativo: boolean
  _count?: { itensVenda: number }
}

type Campanha = {
  id: string
  titulo: string
  descricao: string | null
  mes: number
  ano: number
  ativo: boolean
  totalVendido: number
  totalVendas: number
  totalSemIva: number
  produtos: Array<{
    id: string
    nome: string
    precoUnit: string
    quantidade: number
    produto: Produto | null
  }>
}

type ObjetivoVario = {
  id: string
  titulo: string
  descricao: string | null
  mes: number
  ano: number
  ativo: boolean
  totalProdutos: number
  totalValor: number
  totalVendas: number
  totalVendido: number
  totalValorVendido: number
  produtos: Array<{
    id: string
    nome: string
    precoSemIva: string
    quantidade: number
    produto: Produto | null
  }>
  vendas: Array<{
    id: string
    total: string
    objetivoVarioQuantidade: number | null
    cliente: { id: string; nome: string }
  }>
}

type SettingsData = {
  configuracoes: Record<string, string>
  premiosMensais: Premio[]
  premiosTrimestrais: Premio[]
  premiosAnuais: Premio[]
  objetivosAnuais: ObjetivoAnual[]
  objetivosTrimestrais: ObjetivoTrimestral[]
  objetivosMensais: ObjetivoMensal[]
}

const meses = [
  "", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
]

export default function DefinicoesPage() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [fontSize, setFontSize] = useState<"small" | "normal" | "large">("normal")
  const [data, setData] = useState<SettingsData | null>(null)
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [campanhas, setCampanhas] = useState<Campanha[]>([])
  const [objetivosVarios, setObjetivosVarios] = useState<ObjetivoVario[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<"config" | "objetivos" | "objetivos-varios" | "premios" | "produtos" | "campanhas" | "display">("config")

  // Form states
  const [iva, setIva] = useState("")
  const [comissao, setComissao] = useState("")
  const [selectedAno, setSelectedAno] = useState(new Date().getFullYear())

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [defRes, prodRes, campRes, objVarRes] = await Promise.all([
        fetch("/api/definicoes"),
        fetch("/api/produtos?limit=1000"),
        fetch("/api/campanhas?limit=1000"),
        fetch("/api/objetivos-varios?limit=1000")
      ])
      const json = await defRes.json()
      const produtosRaw = await prodRes.json()
      const campanhasRaw = campRes.ok ? await campRes.json() : []
      const objetivosVariosRaw = objVarRes.ok ? await objVarRes.json() : []

      // Handle paginated responses
      const produtosData = Array.isArray(produtosRaw) ? produtosRaw : (produtosRaw?.data || [])
      const campanhasData = Array.isArray(campanhasRaw) ? campanhasRaw : (campanhasRaw?.data || [])
      const objetivosVariosData = Array.isArray(objetivosVariosRaw) ? objetivosVariosRaw : (objetivosVariosRaw?.data || [])

      setData(json)
      setProdutos(produtosData)
      setCampanhas(campanhasData)
      setObjetivosVarios(objetivosVariosData)
      setIva(json.configuracoes.IVA_PERCENTAGEM || "23")
      setComissao(json.configuracoes.COMISSAO_PERCENTAGEM || "3.5")
    } catch (error) {
      console.error("Error fetching settings:", error)
    } finally {
      setLoading(false)
    }
  }

  async function saveConfig(chave: string, valor: string) {
    setSaving(true)
    try {
      await fetch("/api/definicoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo: "configuracao", dados: { chave, valor } })
      })
      await fetchData()
    } catch (error) {
      console.error("Error saving config:", error)
      Swal.fire({
        icon: "error",
        title: "Erro",
        text: "Erro ao guardar configuração",
        confirmButtonColor: "#b8860b"
      })
    } finally {
      setSaving(false)
    }
  }

  async function saveObjetivo(tipo: string, dados: Record<string, unknown>) {
    setSaving(true)
    try {
      await fetch("/api/definicoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo, dados })
      })
      await fetchData()
    } catch (error) {
      console.error("Error saving objetivo:", error)
      Swal.fire({
        icon: "error",
        title: "Erro",
        text: "Erro ao guardar objetivo",
        confirmButtonColor: "#b8860b"
      })
    } finally {
      setSaving(false)
    }
  }

  async function savePremio(tipo: string, dados: Record<string, unknown>) {
    setSaving(true)
    try {
      await fetch("/api/definicoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo, dados })
      })
      await fetchData()
    } catch (error) {
      console.error("Error saving premio:", error)
      Swal.fire({
        icon: "error",
        title: "Erro",
        text: "Erro ao guardar prémio",
        confirmButtonColor: "#b8860b"
      })
    } finally {
      setSaving(false)
    }
  }

  async function deletePremio(tipo: string, id: string) {
    const result = await Swal.fire({
      title: "Eliminar prémio?",
      text: "Tem a certeza que quer eliminar este prémio?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#c41e3a",
      cancelButtonColor: "#666666",
      confirmButtonText: "Sim, eliminar",
      cancelButtonText: "Cancelar"
    })

    if (!result.isConfirmed) return
    setSaving(true)
    try {
      await fetch(`/api/definicoes?tipo=${tipo}&id=${id}`, { method: "DELETE" })
      await fetchData()
    } catch (error) {
      console.error("Error deleting premio:", error)
      Swal.fire({
        icon: "error",
        title: "Erro",
        text: "Erro ao eliminar prémio",
        confirmButtonColor: "#b8860b"
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">A carregar...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Definições</h1>
        <p className="text-sm md:text-base text-muted-foreground flex items-center gap-2 mt-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          </svg>
          Configurar IVA, comissões, objetivos e prémios
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 md:gap-2 mb-4 md:mb-6 bg-secondary p-2 rounded-2xl border border-border">
        {[
          { id: "config", label: "Configurações", shortLabel: "Config", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" },
          { id: "objetivos", label: "Objetivos", shortLabel: "Obj.", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
          { id: "objetivos-varios", label: "Objetivos Varios", shortLabel: "Varios", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" },
          { id: "premios", label: "Tabela Prémios", shortLabel: "Prémios", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
          { id: "produtos", label: "Produtos", shortLabel: "Prod.", icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" },
          { id: "campanhas", label: "Campanhas", shortLabel: "Camp.", icon: "M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" },
          { id: "display", label: "Apresentação", shortLabel: "Visual", icon: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-5 py-2 md:py-3 rounded-xl font-semibold transition text-xs md:text-base ${
              activeTab === tab.id
                ? "bg-primary text-primary-foreground shadow-lg"
                : "bg-card text-foreground hover:bg-secondary border-2 border-border"
            }`}
          >
            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
            </svg>
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.shortLabel}</span>
          </button>
        ))}
      </div>

      {/* Config Tab */}
      {activeTab === "config" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* IVA */}
          <div className="bg-card rounded-xl shadow-sm p-4 md:p-6 border border-border">
            <h3 className="text-base md:text-lg font-bold text-foreground mb-3 md:mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 md:w-5 md:h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Percentagem de IVA
            </h3>
            <div className="flex gap-2 md:gap-3">
              <div className="relative flex-1">
                <input
                  type="number"
                  step="0.1"
                  value={iva}
                  onChange={(e) => setIva(e.target.value)}
                  className="w-full px-3 md:px-4 py-2.5 md:py-3 border-2 border-border rounded-xl bg-background text-foreground font-medium focus:ring-2 focus:ring-primary focus:border-primary outline-none pr-10 text-sm md:text-base"
                />
                <span className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">%</span>
              </div>
              <button
                onClick={() => saveConfig("IVA_PERCENTAGEM", iva)}
                disabled={saving}
                className="px-4 md:px-6 py-2.5 md:py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary-hover transition disabled:opacity-50 text-sm md:text-base"
              >
                OK
              </button>
            </div>
            <p className="text-xs md:text-sm text-muted-foreground mt-2">Taxa de IVA (padrão: 23%)</p>
          </div>

          {/* Comissao */}
          <div className="bg-card rounded-xl shadow-sm p-4 md:p-6 border border-border">
            <h3 className="text-base md:text-lg font-bold text-foreground mb-3 md:mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 md:w-5 md:h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Comissão
            </h3>
            <div className="flex gap-2 md:gap-3">
              <div className="relative flex-1">
                <input
                  type="number"
                  step="0.1"
                  value={comissao}
                  onChange={(e) => setComissao(e.target.value)}
                  className="w-full px-3 md:px-4 py-2.5 md:py-3 border-2 border-border rounded-xl bg-background text-foreground font-medium focus:ring-2 focus:ring-primary focus:border-primary outline-none pr-10 text-sm md:text-base"
                />
                <span className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">%</span>
              </div>
              <button
                onClick={() => saveConfig("COMISSAO_PERCENTAGEM", comissao)}
                disabled={saving}
                className="px-4 md:px-6 py-2.5 md:py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary-hover transition disabled:opacity-50 text-sm md:text-base"
              >
                OK
              </button>
            </div>
            <p className="text-xs md:text-sm text-muted-foreground mt-2">Comissão sobre vendas (padrão: 3.5%)</p>
          </div>
        </div>
      )}

      {/* Objetivos Tab */}
      {activeTab === "objetivos" && (
        <div className="space-y-6">
          {/* Year Selector */}
          <div className="bg-card rounded-xl shadow-sm p-4 border border-border">
            <div className="flex items-center justify-center gap-3">
              <label className="text-sm font-bold text-foreground">Ano:</label>
              <select
                value={selectedAno}
                onChange={(e) => setSelectedAno(parseInt(e.target.value))}
                className="px-4 py-2.5 border-2 border-border rounded-xl text-foreground font-semibold focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-background"
              >
                {[2023, 2024, 2025, 2026].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Annual Objective */}
          <div className="bg-card rounded-xl shadow-sm p-6 border border-border">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Objetivo Anual {selectedAno}
            </h3>
            <ObjetivoForm
              label="Objetivo anual"
              currentValue={data?.objetivosAnuais.find(o => o.ano === selectedAno)?.objetivo}
              onSave={(valor) => saveObjetivo("objetivo_anual", { ano: selectedAno, objetivo: valor })}
              saving={saving}
              hint="Define o objetivo anual. Será dividido por 4 trimestres e 12 meses se não houver objetivos específicos."
            />
          </div>

          {/* Quarterly Objectives */}
          <div className="bg-card rounded-xl shadow-sm p-6 border border-border">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Objetivos Trimestrais {selectedAno}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((t) => {
                const obj = data?.objetivosTrimestrais.find(o => o.ano === selectedAno && o.trimestre === t)
                const anual = data?.objetivosAnuais.find(o => o.ano === selectedAno)
                const fallback = anual ? Number(anual.objetivo) / 4 : undefined
                return (
                  <ObjetivoForm
                    key={t}
                    label={`${t}º Trimestre`}
                    currentValue={obj?.objetivo}
                    fallbackValue={fallback}
                    onSave={(valor) => saveObjetivo("objetivo_trimestral", { trimestre: t, ano: selectedAno, objetivo: valor })}
                    saving={saving}
                    compact
                  />
                )
              })}
            </div>
          </div>

          {/* Monthly Objectives */}
          <div className="bg-card rounded-xl shadow-sm p-6 border border-border">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Objetivos Mensais {selectedAno}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {meses.slice(1).map((mes, i) => {
                const mesNum = i + 1
                const obj = data?.objetivosMensais.find(o => o.ano === selectedAno && o.mes === mesNum)
                const trimestre = Math.ceil(mesNum / 3)
                const objTrim = data?.objetivosTrimestrais.find(o => o.ano === selectedAno && o.trimestre === trimestre)
                const anual = data?.objetivosAnuais.find(o => o.ano === selectedAno)
                let fallback: number | undefined
                if (objTrim) {
                  fallback = Number(objTrim.objetivo) / 3
                } else if (anual) {
                  fallback = Number(anual.objetivo) / 12
                }
                return (
                  <ObjetivoForm
                    key={mesNum}
                    label={mes}
                    currentValue={obj?.objetivo}
                    fallbackValue={fallback}
                    onSave={(valor) => saveObjetivo("objetivo_mensal", { mes: mesNum, ano: selectedAno, objetivo: valor })}
                    saving={saving}
                    compact
                  />
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Premios Tab */}
      {activeTab === "premios" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Monthly Prizes */}
          <div className="bg-card rounded-xl shadow-sm p-6 border border-border">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Prémios Mensais
            </h3>
            <PremioTable
              premios={data?.premiosMensais || []}
              onSave={(dados) => savePremio("premio_mensal", dados)}
              onDelete={(id) => deletePremio("premio_mensal", id)}
              saving={saving}
            />
          </div>

          {/* Quarterly Prizes */}
          <div className="bg-card rounded-xl shadow-sm p-6 border border-border">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Prémios Trimestrais
            </h3>
            <PremioTable
              premios={data?.premiosTrimestrais || []}
              onSave={(dados) => savePremio("premio_trimestral", dados)}
              onDelete={(id) => deletePremio("premio_trimestral", id)}
              saving={saving}
            />
          </div>

          {/* Annual Prizes */}
          <div className="bg-card rounded-xl shadow-sm p-6 border border-border">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Prémios Anuais
            </h3>
            <PremioTable
              premios={data?.premiosAnuais || []}
              onSave={(dados) => savePremio("premio_anual", dados)}
              onDelete={(id) => deletePremio("premio_anual", id)}
              saving={saving}
            />
          </div>
        </div>
      )}

      {/* Produtos Tab */}
      {activeTab === "produtos" && (
        <div className="bg-card rounded-xl shadow-sm p-6 border border-border">
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            Gerir Produtos
          </h3>
          <p className="text-muted-foreground text-sm mb-6">Adicione produtos para rastrear vendas e gerar recomendações de upsell.</p>
          <ProdutosTable
            produtos={produtos}
            onRefresh={fetchData}
            saving={saving}
            setSaving={setSaving}
          />
        </div>
      )}

      {/* Objetivos Varios Tab */}
      {activeTab === "objetivos-varios" && (
        <div className="bg-card rounded-xl shadow-sm p-6 border border-border">
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            Objetivos Varios
          </h3>
          <p className="text-muted-foreground text-sm mb-6">Defina objetivos personalizados com produtos. Os precos sao sem IVA.</p>
          <ObjetivosVariosTable
            objetivos={objetivosVarios}
            produtos={produtos}
            meses={meses}
            onRefresh={fetchData}
            saving={saving}
            setSaving={setSaving}
          />
        </div>
      )}

      {/* Campanhas Tab */}
      {activeTab === "campanhas" && (
        <div className="bg-card rounded-xl shadow-sm p-6 border border-border">
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
            Gerir Campanhas
          </h3>
          <p className="text-muted-foreground text-sm mb-6">Crie campanhas de vendas com produtos e metas mensais.</p>
          <CampanhasTable
            campanhas={campanhas}
            produtos={produtos}
            meses={meses}
            onRefresh={fetchData}
            saving={saving}
            setSaving={setSaving}
          />
        </div>
      )}

      {/* Display Tab */}
      {activeTab === "display" && (
        <div className="space-y-6">
          {/* Theme Setting */}
          <div className="bg-card rounded-xl shadow-sm p-6 border border-border">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
              Tema
            </h3>
            <p className="text-sm text-muted-foreground mb-4">Escolha o tema visual da aplicação</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: "light", label: "Claro", icon: "M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" },
                { id: "dark", label: "Escuro", icon: "M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" },
                { id: "system", label: "Sistema", icon: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" }
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id as "light" | "dark" | "system")}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition ${
                    theme === t.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={t.icon} />
                  </svg>
                  <span className="text-sm font-medium">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Font Size Setting */}
          <div className="bg-card rounded-xl shadow-sm p-6 border border-border">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              Tamanho do Texto
            </h3>
            <p className="text-sm text-muted-foreground mb-4">Ajuste o tamanho base do texto na aplicação</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: "small", label: "Pequeno", sample: "Aa", size: "text-sm" },
                { id: "normal", label: "Normal", sample: "Aa", size: "text-base" },
                { id: "large", label: "Grande", sample: "Aa", size: "text-lg" }
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setFontSize(s.id as "small" | "normal" | "large")
                    const root = document.documentElement
                    if (s.id === "small") root.style.fontSize = "14px"
                    else if (s.id === "large") root.style.fontSize = "18px"
                    else root.style.fontSize = "16px"
                    localStorage.setItem("fontSize", s.id)
                  }}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition ${
                    fontSize === s.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className={`font-bold ${s.size}`}>{s.sample}</span>
                  <span className="text-sm font-medium">{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Other Options */}
          <div className="bg-card rounded-xl shadow-sm p-6 border border-border">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              Outras Opções
            </h3>
            <div className="space-y-4">
              <label className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 cursor-pointer hover:bg-secondary transition">
                <div>
                  <span className="font-medium text-foreground">Animações reduzidas</span>
                  <p className="text-xs text-muted-foreground">Reduz as animações para melhor desempenho</p>
                </div>
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded text-primary focus:ring-primary"
                  onChange={(e) => {
                    if (e.target.checked) {
                      document.documentElement.classList.add("reduce-motion")
                    } else {
                      document.documentElement.classList.remove("reduce-motion")
                    }
                    localStorage.setItem("reduceMotion", String(e.target.checked))
                  }}
                />
              </label>
              <label className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 cursor-pointer hover:bg-secondary transition">
                <div>
                  <span className="font-medium text-foreground">Modo compacto</span>
                  <p className="text-xs text-muted-foreground">Reduz espaçamentos para ver mais conteúdo</p>
                </div>
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded text-primary focus:ring-primary"
                  onChange={(e) => {
                    if (e.target.checked) {
                      document.documentElement.classList.add("compact-mode")
                    } else {
                      document.documentElement.classList.remove("compact-mode")
                    }
                    localStorage.setItem("compactMode", String(e.target.checked))
                  }}
                />
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ObjetivoForm({
  label,
  currentValue,
  fallbackValue,
  onSave,
  saving,
  hint,
  compact
}: {
  label: string
  currentValue?: number | unknown
  fallbackValue?: number
  onSave: (valor: number) => void
  saving: boolean
  hint?: string
  compact?: boolean
}) {
  const [valor, setValor] = useState(currentValue ? String(currentValue) : "")
  const displayFallback = !currentValue && fallbackValue

  return (
    <div className={compact ? "" : ""}>
      <label className="block text-sm font-bold text-foreground mb-2">{label}</label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="number"
            step="0.01"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder={displayFallback ? fallbackValue.toFixed(0) : "0.00"}
            className={`w-full px-3 py-2 border-2 rounded-xl bg-background text-foreground font-medium focus:ring-2 focus:ring-primary focus:border-primary outline-none pr-8 ${
              displayFallback ? "border-border bg-muted" : "border-border"
            }`}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">€</span>
        </div>
        <button
          onClick={() => valor && onSave(parseFloat(valor))}
          disabled={saving || !valor}
          className="px-3 py-2 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary-hover transition disabled:opacity-50 text-sm"
        >
          OK
        </button>
      </div>
      {displayFallback && (
        <p className="text-xs text-muted-foreground mt-1">Calculado: {formatCurrency(fallbackValue)} €</p>
      )}
      {hint && <p className="text-sm text-muted-foreground mt-2">{hint}</p>}
    </div>
  )
}

function PremioTable({
  premios,
  onSave,
  onDelete,
  saving
}: {
  premios: Premio[]
  onSave: (dados: Record<string, unknown>) => void
  onDelete: (id: string) => void
  saving: boolean
}) {
  const [newMinimo, setNewMinimo] = useState("")
  const [newPremio, setNewPremio] = useState("")

  function handleAdd() {
    if (!newMinimo || !newPremio) return
    onSave({
      minimo: parseFloat(newMinimo),
      premio: parseFloat(newPremio),
      ordem: premios.length + 1
    })
    setNewMinimo("")
    setNewPremio("")
  }

  // Sort premios by minimo ascending
  const sortedPremios = [...premios].sort((a, b) => Number(a.minimo) - Number(b.minimo))

  return (
    <div>
      <table className="w-full mb-4">
        <thead>
          <tr className="text-left text-sm text-muted-foreground border-b border-border">
            <th className="pb-2">Vendas Mínimas</th>
            <th className="pb-2">Prémio</th>
            <th className="pb-2 w-20"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {sortedPremios.map((p) => (
            <tr key={p.id} className="text-foreground">
              <td className="py-3 font-medium">{Number(p.minimo).toFixed(0)} €</td>
              <td className="py-3 font-bold text-success">{Number(p.premio).toFixed(0)} €</td>
              <td className="py-3">
                <button
                  onClick={() => onDelete(p.id)}
                  className="p-1 text-destructive hover:bg-destructive/10 rounded transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Add new */}
      <div className="flex gap-2 pt-4 border-t border-border">
        <div className="relative flex-1">
          <input
            type="number"
            value={newMinimo}
            onChange={(e) => setNewMinimo(e.target.value)}
            placeholder="Mínimo"
            className="w-full px-3 py-2 border-2 border-border rounded-xl bg-background text-foreground font-medium focus:ring-2 focus:ring-primary focus:border-primary outline-none pr-8"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">€</span>
        </div>
        <div className="relative flex-1">
          <input
            type="number"
            value={newPremio}
            onChange={(e) => setNewPremio(e.target.value)}
            placeholder="Prémio"
            className="w-full px-3 py-2 border-2 border-border rounded-xl bg-background text-foreground font-medium focus:ring-2 focus:ring-primary focus:border-primary outline-none pr-8"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">€</span>
        </div>
        <button
          onClick={handleAdd}
          disabled={saving || !newMinimo || !newPremio}
          className="px-4 py-2 bg-success text-success-foreground rounded-xl font-bold hover:opacity-90 transition disabled:opacity-50"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    </div>
  )
}

function ProdutosTable({
  produtos,
  onRefresh,
  saving,
  setSaving
}: {
  produtos: Produto[]
  onRefresh: () => void
  saving: boolean
  setSaving: (s: boolean) => void
}) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ nome: "", codigo: "", categoria: "", descricao: "", preco: "" })

  function resetForm() {
    setFormData({ nome: "", codigo: "", categoria: "", descricao: "", preco: "" })
    setEditingId(null)
    setShowForm(false)
  }

  function startEdit(p: Produto) {
    setFormData({
      nome: p.nome,
      codigo: p.codigo || "",
      categoria: p.categoria || "",
      descricao: p.descricao || "",
      preco: p.preco ? String(p.preco) : ""
    })
    setEditingId(p.id)
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.nome) return

    setSaving(true)
    try {
      const url = editingId ? `/api/produtos/${editingId}` : "/api/produtos"
      const method = editingId ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        resetForm()
        onRefresh()
      } else {
        const error = await res.json()
        Swal.fire({
          icon: "error",
          title: "Erro",
          text: error.error || "Erro ao guardar produto",
          confirmButtonColor: "#b8860b"
        })
      }
    } catch (error) {
      console.error("Error saving produto:", error)
      Swal.fire({
        icon: "error",
        title: "Erro",
        text: "Erro ao guardar produto",
        confirmButtonColor: "#b8860b"
      })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    const result = await Swal.fire({
      title: "Eliminar produto?",
      text: "Tem a certeza que quer eliminar este produto?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#c41e3a",
      cancelButtonColor: "#666666",
      confirmButtonText: "Sim, eliminar",
      cancelButtonText: "Cancelar"
    })

    if (!result.isConfirmed) return

    setSaving(true)
    try {
      const res = await fetch(`/api/produtos/${id}`, { method: "DELETE" })
      if (res.ok) {
        onRefresh()
      } else {
        const error = await res.json()
        Swal.fire({
          icon: "error",
          title: "Erro",
          text: error.error || "Erro ao eliminar produto",
          confirmButtonColor: "#b8860b"
        })
      }
    } catch (error) {
      console.error("Error deleting produto:", error)
      Swal.fire({
        icon: "error",
        title: "Erro",
        text: "Erro ao eliminar produto",
        confirmButtonColor: "#b8860b"
      })
    } finally {
      setSaving(false)
    }
  }

  async function toggleAtivo(p: Produto) {
    setSaving(true)
    try {
      await fetch(`/api/produtos/${p.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...p, ativo: !p.ativo })
      })
      onRefresh()
    } catch (error) {
      console.error("Error toggling produto:", error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      {/* Add/Edit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-primary/10 rounded-xl border-2 border-primary/20">
          <h4 className="font-bold text-foreground mb-4">{editingId ? "Editar Produto" : "Novo Produto"}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-bold text-foreground mb-1">Nome *</label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
                className="w-full px-3 py-2 border-2 border-border rounded-xl bg-background text-foreground font-medium focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                placeholder="Nome do produto"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-foreground mb-1">Código</label>
              <input
                type="text"
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                className="w-full px-3 py-2 border-2 border-border rounded-xl bg-background text-foreground font-medium focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                placeholder="Código único (opcional)"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-foreground mb-1">Categoria</label>
              <input
                type="text"
                value={formData.categoria}
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                className="w-full px-3 py-2 border-2 border-border rounded-xl bg-background text-foreground font-medium focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                placeholder="Ex: Laticinios, Ovos, etc."
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-foreground mb-1">Descrição</label>
              <input
                type="text"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                className="w-full px-3 py-2 border-2 border-border rounded-xl bg-background text-foreground font-medium focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                placeholder="Descrição breve"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-foreground mb-1">Preço (c/IVA)</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  value={formData.preco}
                  onChange={(e) => setFormData({ ...formData, preco: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-border rounded-xl bg-background text-foreground font-medium focus:ring-2 focus:ring-primary focus:border-primary outline-none pr-8"
                  placeholder="0.00"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">€</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving || !formData.nome}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary-hover transition disabled:opacity-50"
            >
              {saving ? "A guardar..." : "Guardar"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-xl font-bold hover:opacity-80 transition"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Add Button */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="mb-6 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary-hover transition flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Adicionar Produto
        </button>
      )}

      {/* Products Table */}
      {produtos.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <p>Nenhum produto registado</p>
          <p className="text-sm">Adicione produtos para começar a rastrear vendas</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-muted-foreground border-b border-border">
                <th className="pb-3">Nome</th>
                <th className="pb-3">Código</th>
                <th className="pb-3">Categoria</th>
                <th className="pb-3">Preço</th>
                <th className="pb-3 text-center">Vendas</th>
                <th className="pb-3 text-center">Estado</th>
                <th className="pb-3 w-24"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {produtos.map((p) => (
                <tr key={p.id} className={`${!p.ativo ? "opacity-50" : ""}`}>
                  <td className="py-3">
                    <span className="font-medium text-foreground">{p.nome}</span>
                    {p.descricao && <p className="text-xs text-muted-foreground">{p.descricao}</p>}
                  </td>
                  <td className="py-3 text-muted-foreground">{p.codigo || "-"}</td>
                  <td className="py-3">
                    {p.categoria ? (
                      <span className="px-2 py-1 bg-primary/10 text-primary rounded-lg text-sm font-medium">
                        {p.categoria}
                      </span>
                    ) : "-"}
                  </td>
                  <td className="py-3">
                    {p.preco ? (
                      <span className="font-medium text-success">{Number(p.preco).toFixed(2)} €</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="py-3 text-center">
                    <span className="px-2 py-1 bg-blue-500/10 text-blue-500 rounded-lg text-sm font-medium">
                      {p._count?.itensVenda || 0}
                    </span>
                  </td>
                  <td className="py-3 text-center">
                    <button
                      onClick={() => toggleAtivo(p)}
                      className={`px-2 py-1 rounded-lg text-sm font-medium transition ${
                        p.ativo
                          ? "bg-success/10 text-success hover:bg-success/20"
                          : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                      }`}
                    >
                      {p.ativo ? "Ativo" : "Inativo"}
                    </button>
                  </td>
                  <td className="py-3">
                    <div className="flex gap-1 justify-end">
                      <button
                        onClick={() => startEdit(p)}
                        className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition"
                        title="Editar"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition"
                        title="Eliminar"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function CampanhasTable({
  campanhas,
  produtos,
  meses,
  onRefresh,
  saving,
  setSaving
}: {
  campanhas: Campanha[]
  produtos: Produto[]
  meses: string[]
  onRefresh: () => void
  saving: boolean
  setSaving: (s: boolean) => void
}) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    mes: new Date().getMonth() + 1,
    ano: new Date().getFullYear()
  })
  const [produtosForm, setProdutosForm] = useState<Array<{
    produtoId: string
    nome: string
    precoUnit: number
    quantidade: number
  }>>([])

  function resetForm() {
    setFormData({
      titulo: "",
      descricao: "",
      mes: new Date().getMonth() + 1,
      ano: new Date().getFullYear()
    })
    setProdutosForm([])
    setEditingId(null)
    setShowForm(false)
  }

  function startEdit(c: Campanha) {
    setFormData({
      titulo: c.titulo,
      descricao: c.descricao || "",
      mes: c.mes,
      ano: c.ano
    })
    setProdutosForm(c.produtos.map(p => ({
      produtoId: p.produto?.id || "",
      nome: p.nome,
      precoUnit: Number(p.precoUnit),
      quantidade: p.quantidade
    })))
    setEditingId(c.id)
    setShowForm(true)
  }

  function addProdutoForm() {
    setProdutosForm([...produtosForm, { produtoId: "", nome: "", precoUnit: 0, quantidade: 1 }])
  }

  function removeProdutoForm(index: number) {
    setProdutosForm(produtosForm.filter((_, i) => i !== index))
  }

  function updateProdutoForm(index: number, field: string, value: string | number) {
    const newProdutos = [...produtosForm]
    newProdutos[index] = { ...newProdutos[index], [field]: value }

    // Auto-fill from product if selected
    if (field === "produtoId" && value) {
      const produto = produtos.find(p => p.id === value)
      if (produto) {
        newProdutos[index].nome = produto.nome
        newProdutos[index].precoUnit = produto.preco ? Number(produto.preco) : 0
      }
    }

    setProdutosForm(newProdutos)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.titulo) return

    setSaving(true)
    try {
      const url = editingId ? `/api/campanhas/${editingId}` : "/api/campanhas"
      const method = editingId ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          produtos: produtosForm.filter(p => p.nome)
        })
      })

      if (res.ok) {
        resetForm()
        onRefresh()
      } else {
        const error = await res.json()
        Swal.fire({
          icon: "error",
          title: "Erro",
          text: error.error || "Erro ao guardar campanha",
          confirmButtonColor: "#b8860b"
        })
      }
    } catch (error) {
      console.error("Error saving campanha:", error)
      Swal.fire({
        icon: "error",
        title: "Erro",
        text: "Erro ao guardar campanha",
        confirmButtonColor: "#b8860b"
      })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    const result = await Swal.fire({
      title: "Eliminar campanha?",
      text: "Tem a certeza que quer eliminar esta campanha?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#c41e3a",
      cancelButtonColor: "#666666",
      confirmButtonText: "Sim, eliminar",
      cancelButtonText: "Cancelar"
    })

    if (!result.isConfirmed) return

    setSaving(true)
    try {
      const res = await fetch(`/api/campanhas/${id}`, { method: "DELETE" })
      if (res.ok) {
        onRefresh()
      } else {
        const error = await res.json()
        Swal.fire({
          icon: "error",
          title: "Erro",
          text: error.error || "Erro ao eliminar campanha",
          confirmButtonColor: "#b8860b"
        })
      }
    } catch (error) {
      console.error("Error deleting campanha:", error)
      Swal.fire({
        icon: "error",
        title: "Erro",
        text: "Erro ao eliminar campanha",
        confirmButtonColor: "#b8860b"
      })
    } finally {
      setSaving(false)
    }
  }

  async function toggleAtivo(c: Campanha) {
    setSaving(true)
    try {
      await fetch(`/api/campanhas/${c.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ativo: !c.ativo })
      })
      onRefresh()
    } catch (error) {
      console.error("Error toggling campanha:", error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      {/* Add/Edit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-primary/10 rounded-xl border-2 border-primary/20">
          <h4 className="font-bold text-foreground mb-4">{editingId ? "Editar Campanha" : "Nova Campanha"}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-foreground mb-1">Título *</label>
              <input
                type="text"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                required
                className="w-full px-3 py-2 border-2 border-border rounded-xl bg-background text-foreground font-medium focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                placeholder="Nome da campanha"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-foreground mb-1">Mês</label>
              <select
                value={formData.mes}
                onChange={(e) => setFormData({ ...formData, mes: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border-2 border-border rounded-xl bg-background text-foreground font-medium focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              >
                {meses.slice(1).map((m, i) => (
                  <option key={i + 1} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-foreground mb-1">Ano</label>
              <select
                value={formData.ano}
                onChange={(e) => setFormData({ ...formData, ano: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border-2 border-border rounded-xl bg-background text-foreground font-medium focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              >
                {[2024, 2025, 2026].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-foreground mb-1">Descrição</label>
              <textarea
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border-2 border-border rounded-xl bg-background text-foreground font-medium focus:ring-2 focus:ring-primary focus:border-primary outline-none resize-none"
                placeholder="Descrição da campanha"
              />
            </div>
          </div>

          {/* Products in campaign */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-bold text-foreground">Produtos da Campanha</label>
              <button
                type="button"
                onClick={addProdutoForm}
                className="text-sm text-primary hover:text-primary-hover"
              >
                + Adicionar Produto
              </button>
            </div>
            {produtosForm.length > 0 && (
              <div className="space-y-2">
                {produtosForm.map((p, index) => (
                  <div key={index} className="flex gap-2 items-end bg-background/50 p-2 rounded-lg">
                    <div className="flex-1">
                      <label className="block text-xs text-muted-foreground mb-1">Produto</label>
                      <select
                        value={p.produtoId}
                        onChange={(e) => updateProdutoForm(index, "produtoId", e.target.value)}
                        className="w-full px-2 py-1.5 border border-border rounded-lg bg-background text-sm"
                      >
                        <option value="">Selecionar...</option>
                        {produtos.filter(prod => prod.ativo).map(prod => (
                          <option key={prod.id} value={prod.id}>
                            {prod.codigo ? `[${prod.codigo}] ` : ""}{prod.nome}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-40">
                      <label className="block text-xs text-muted-foreground mb-1">Nome</label>
                      <input
                        type="text"
                        value={p.nome}
                        onChange={(e) => updateProdutoForm(index, "nome", e.target.value)}
                        className="w-full px-2 py-1.5 border border-border rounded-lg bg-background text-sm"
                        placeholder="Nome"
                      />
                    </div>
                    <div className="w-24">
                      <label className="block text-xs text-muted-foreground mb-1">Preço</label>
                      <input
                        type="number"
                        step="0.01"
                        value={p.precoUnit}
                        onChange={(e) => updateProdutoForm(index, "precoUnit", parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 border border-border rounded-lg bg-background text-sm"
                      />
                    </div>
                    <div className="w-20">
                      <label className="block text-xs text-muted-foreground mb-1">Qtd</label>
                      <input
                        type="number"
                        value={p.quantidade}
                        onChange={(e) => updateProdutoForm(index, "quantidade", parseInt(e.target.value) || 1)}
                        className="w-full px-2 py-1.5 border border-border rounded-lg bg-background text-sm"
                        min="1"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeProdutoForm(index)}
                      className="p-1.5 text-destructive hover:bg-destructive/10 rounded-lg"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving || !formData.titulo}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary-hover transition disabled:opacity-50"
            >
              {saving ? "A guardar..." : "Guardar"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-xl font-bold hover:opacity-80 transition"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Add Button */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="mb-6 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary-hover transition flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nova Campanha
        </button>
      )}

      {/* Campaigns List */}
      {campanhas.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
          </svg>
          <p>Nenhuma campanha registada</p>
          <p className="text-sm">Crie campanhas para rastrear promoções e metas de vendas</p>
        </div>
      ) : (
        <div className="space-y-4">
          {campanhas.map((c) => (
            <div
              key={c.id}
              className={`bg-secondary/30 rounded-xl p-4 border border-border ${!c.ativo ? "opacity-50" : ""}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-bold text-foreground">{c.titulo}</h4>
                  <p className="text-sm text-muted-foreground">{meses[c.mes]} {c.ano}</p>
                  {c.descricao && <p className="text-sm text-muted-foreground mt-1">{c.descricao}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleAtivo(c)}
                    className={`px-2 py-1 rounded-lg text-sm font-medium transition ${
                      c.ativo
                        ? "bg-success/10 text-success hover:bg-success/20"
                        : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {c.ativo ? "Ativa" : "Inativa"}
                  </button>
                  <button
                    onClick={() => startEdit(c)}
                    className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Campaign products */}
              {c.produtos.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs font-bold text-muted-foreground mb-2">Produtos:</p>
                  <div className="flex flex-wrap gap-2">
                    {c.produtos.map(p => (
                      <span key={p.id} className="px-2 py-1 bg-primary/10 text-primary rounded-lg text-xs">
                        {p.nome} ({p.quantidade}x {Number(p.precoUnit).toFixed(2)}€)
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Campaign stats */}
              <div className="mt-3 pt-3 border-t border-border flex gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Vendas: </span>
                  <span className="font-bold text-success">{c.totalVendas}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Total: </span>
                  <span className="font-bold text-primary">{formatCurrency(c.totalSemIva)} €</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ObjetivosVariosTable({
  objetivos,
  produtos,
  meses,
  onRefresh,
  saving,
  setSaving
}: {
  objetivos: ObjetivoVario[]
  produtos: Produto[]
  meses: string[]
  onRefresh: () => void
  saving: boolean
  setSaving: (s: boolean) => void
}) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    mes: new Date().getMonth() + 1,
    ano: new Date().getFullYear()
  })
  const [produtosForm, setProdutosForm] = useState<Array<{
    produtoId: string
    nome: string
    precoSemIva: number
    quantidade: number
  }>>([])

  function resetForm() {
    setFormData({
      titulo: "",
      descricao: "",
      mes: new Date().getMonth() + 1,
      ano: new Date().getFullYear()
    })
    setProdutosForm([])
    setEditingId(null)
    setShowForm(false)
  }

  function startEdit(o: ObjetivoVario) {
    setFormData({
      titulo: o.titulo,
      descricao: o.descricao || "",
      mes: o.mes,
      ano: o.ano
    })
    setProdutosForm(o.produtos.map(p => ({
      produtoId: p.produto?.id || "",
      nome: p.nome,
      precoSemIva: Number(p.precoSemIva),
      quantidade: p.quantidade
    })))
    setEditingId(o.id)
    setShowForm(true)
  }

  function addProdutoForm() {
    setProdutosForm([...produtosForm, { produtoId: "", nome: "", precoSemIva: 0, quantidade: 1 }])
  }

  function removeProdutoForm(index: number) {
    setProdutosForm(produtosForm.filter((_, i) => i !== index))
  }

  function updateProdutoForm(index: number, field: string, value: string | number) {
    const newProdutos = [...produtosForm]
    newProdutos[index] = { ...newProdutos[index], [field]: value }

    // Auto-fill from product if selected (calculate ex-VAT price from preco which includes VAT)
    if (field === "produtoId" && value) {
      const produto = produtos.find(p => p.id === value)
      if (produto) {
        newProdutos[index].nome = produto.nome
        // Calculate price without VAT (23%)
        const precoComIva = produto.preco ? Number(produto.preco) : 0
        newProdutos[index].precoSemIva = Number((precoComIva / 1.23).toFixed(2))
      }
    }

    setProdutosForm(newProdutos)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.titulo) return

    setSaving(true)
    try {
      const url = editingId ? `/api/objetivos-varios/${editingId}` : "/api/objetivos-varios"
      const method = editingId ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          produtos: produtosForm.filter(p => p.nome)
        })
      })

      if (res.ok) {
        resetForm()
        onRefresh()
      } else {
        const error = await res.json()
        Swal.fire({
          icon: "error",
          title: "Erro",
          text: error.error || "Erro ao guardar objetivo",
          confirmButtonColor: "#b8860b"
        })
      }
    } catch (error) {
      console.error("Error saving objetivo:", error)
      Swal.fire({
        icon: "error",
        title: "Erro",
        text: "Erro ao guardar objetivo",
        confirmButtonColor: "#b8860b"
      })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    const result = await Swal.fire({
      title: "Eliminar objetivo?",
      text: "Tem a certeza que quer eliminar este objetivo?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#c41e3a",
      cancelButtonColor: "#666666",
      confirmButtonText: "Sim, eliminar",
      cancelButtonText: "Cancelar"
    })

    if (!result.isConfirmed) return

    setSaving(true)
    try {
      const res = await fetch(`/api/objetivos-varios/${id}`, { method: "DELETE" })
      if (res.ok) {
        onRefresh()
      } else {
        const error = await res.json()
        Swal.fire({
          icon: "error",
          title: "Erro",
          text: error.error || "Erro ao eliminar objetivo",
          confirmButtonColor: "#b8860b"
        })
      }
    } catch (error) {
      console.error("Error deleting objetivo:", error)
      Swal.fire({
        icon: "error",
        title: "Erro",
        text: "Erro ao eliminar objetivo",
        confirmButtonColor: "#b8860b"
      })
    } finally {
      setSaving(false)
    }
  }

  async function toggleAtivo(o: ObjetivoVario) {
    setSaving(true)
    try {
      await fetch(`/api/objetivos-varios/${o.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ativo: !o.ativo })
      })
      onRefresh()
    } catch (error) {
      console.error("Error toggling objetivo:", error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      {/* Add/Edit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-primary/10 rounded-xl border-2 border-primary/20">
          <h4 className="font-bold text-foreground mb-4">{editingId ? "Editar Objetivo" : "Novo Objetivo"}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-foreground mb-1">Título *</label>
              <input
                type="text"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                required
                className="w-full px-3 py-2 border-2 border-border rounded-xl bg-background text-foreground font-medium focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                placeholder="Nome do objetivo"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-foreground mb-1">Mês</label>
              <select
                value={formData.mes}
                onChange={(e) => setFormData({ ...formData, mes: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border-2 border-border rounded-xl bg-background text-foreground font-medium focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              >
                {meses.slice(1).map((m, i) => (
                  <option key={i + 1} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-foreground mb-1">Ano</label>
              <select
                value={formData.ano}
                onChange={(e) => setFormData({ ...formData, ano: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border-2 border-border rounded-xl bg-background text-foreground font-medium focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              >
                {[2024, 2025, 2026].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-foreground mb-1">Descrição</label>
              <textarea
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border-2 border-border rounded-xl bg-background text-foreground font-medium focus:ring-2 focus:ring-primary focus:border-primary outline-none resize-none"
                placeholder="Descrição do objetivo"
              />
            </div>
          </div>

          {/* Products in objetivo */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-bold text-foreground">Produtos (preços sem IVA)</label>
              <button
                type="button"
                onClick={addProdutoForm}
                className="text-sm text-primary hover:text-primary-hover"
              >
                + Adicionar Produto
              </button>
            </div>
            {produtosForm.length > 0 && (
              <div className="space-y-2">
                {produtosForm.map((p, index) => (
                  <div key={index} className="flex gap-2 items-end bg-background/50 p-2 rounded-lg">
                    <div className="flex-1">
                      <label className="block text-xs text-muted-foreground mb-1">Produto</label>
                      <select
                        value={p.produtoId}
                        onChange={(e) => updateProdutoForm(index, "produtoId", e.target.value)}
                        className="w-full px-2 py-1.5 border border-border rounded-lg bg-background text-sm"
                      >
                        <option value="">Personalizado...</option>
                        {produtos.filter(prod => prod.ativo).map(prod => (
                          <option key={prod.id} value={prod.id}>
                            {prod.codigo ? `[${prod.codigo}] ` : ""}{prod.nome}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-40">
                      <label className="block text-xs text-muted-foreground mb-1">Nome</label>
                      <input
                        type="text"
                        value={p.nome}
                        onChange={(e) => updateProdutoForm(index, "nome", e.target.value)}
                        className="w-full px-2 py-1.5 border border-border rounded-lg bg-background text-sm"
                        placeholder="Nome"
                      />
                    </div>
                    <div className="w-28">
                      <label className="block text-xs text-muted-foreground mb-1">Preço s/IVA</label>
                      <input
                        type="number"
                        step="0.01"
                        value={p.precoSemIva}
                        onChange={(e) => updateProdutoForm(index, "precoSemIva", parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 border border-border rounded-lg bg-background text-sm"
                      />
                    </div>
                    <div className="w-24">
                      <label className="block text-xs text-muted-foreground mb-1">Valor</label>
                      <input
                        type="number"
                        step="0.01"
                        value={p.quantidade}
                        onChange={(e) => updateProdutoForm(index, "quantidade", parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 border border-border rounded-lg bg-background text-sm"
                        min="0"
                        placeholder="0.00"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeProdutoForm(index)}
                      className="p-1.5 text-destructive hover:bg-destructive/10 rounded-lg"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving || !formData.titulo}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary-hover transition disabled:opacity-50"
            >
              {saving ? "A guardar..." : "Guardar"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-xl font-bold hover:opacity-80 transition"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Add Button */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="mb-6 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary-hover transition flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Novo Objetivo
        </button>
      )}

      {/* Objectives List */}
      {objetivos.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <p>Nenhum objetivo registado</p>
          <p className="text-sm">Crie objetivos personalizados para rastrear as suas metas de vendas</p>
        </div>
      ) : (
        <div className="space-y-4">
          {objetivos.map((o) => (
            <div
              key={o.id}
              className={`bg-secondary/30 rounded-xl p-4 border border-border ${!o.ativo ? "opacity-50" : ""}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-bold text-foreground">{o.titulo}</h4>
                  <p className="text-sm text-muted-foreground">{meses[o.mes]} {o.ano}</p>
                  {o.descricao && <p className="text-sm text-muted-foreground mt-1">{o.descricao}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleAtivo(o)}
                    className={`px-2 py-1 rounded-lg text-sm font-medium transition ${
                      o.ativo
                        ? "bg-success/10 text-success hover:bg-success/20"
                        : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {o.ativo ? "Ativo" : "Inativo"}
                  </button>
                  <button
                    onClick={() => startEdit(o)}
                    className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(o.id)}
                    className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Objective products */}
              {o.produtos.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs font-bold text-muted-foreground mb-2">Produtos (sem IVA):</p>
                  <div className="flex flex-wrap gap-2">
                    {o.produtos.map(p => (
                      <span key={p.id} className="px-2 py-1 bg-primary/10 text-primary rounded-lg text-xs">
                        {p.nome} ({p.quantidade}x {Number(p.precoSemIva).toFixed(2)}€)
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Objective stats */}
              <div className="mt-3 pt-3 border-t border-border">
                <div className="flex flex-wrap gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Produtos: </span>
                    <span className="font-bold text-foreground">{o.totalProdutos}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total s/IVA: </span>
                    <span className="font-bold text-primary">{formatCurrency(o.totalValor)} €</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Vendido: </span>
                    <span className="font-bold text-success">{o.totalVendido} unid.</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Valor vendido: </span>
                    <span className="font-bold text-success">{formatCurrency(o.totalValorVendido)} €</span>
                  </div>
                </div>
                {o.vendas && o.vendas.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-bold text-muted-foreground mb-1">Vendas ({o.vendas.length}):</p>
                    <div className="flex flex-wrap gap-1">
                      {o.vendas.map(v => (
                        <span key={v.id} className="px-2 py-0.5 bg-success/10 text-success rounded text-xs">
                          {v.cliente.nome}
                          {v.objetivoVarioQuantidade && v.objetivoVarioQuantidade > 1 && (
                            <span className="font-bold ml-1">×{v.objetivoVarioQuantidade}</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
