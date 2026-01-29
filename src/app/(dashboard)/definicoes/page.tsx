"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Swal from "sweetalert2"
import { formatCurrency } from "@/lib/utils"
import ProductPicker from "@/components/ProductPicker"

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


type CampanhaProdutoItem = {
  id: string
  produtoId: string | null
  nome: string
  precoUnit: number
  quantidade: number
  produto: Produto | null
}

type CampanhaProdutoForm = {
  produtoId: string
  nome: string
  precoUnit: string
  quantidade: string
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
  produtos: CampanhaProdutoItem[]
}
type Produto = {
  id: string
  nome: string
  codigo: string | null
  categoria: string | null
  descricao: string | null
  tipo: string | null
  preco: number | null
  ativo: boolean
  _count?: { itensVenda: number }
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
  const [data, setData] = useState<SettingsData | null>(null)
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [campanhas, setCampanhas] = useState<Campanha[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<"config" | "objetivos" | "premios" | "produtos" | "campanhas">("config")

  // Form states
  const [iva, setIva] = useState("")
  const [comissao, setComissao] = useState("")
  const [selectedAno, setSelectedAno] = useState(new Date().getFullYear())
  
  // Campanhas form state
  const [campanhaForm, setCampanhaForm] = useState({ titulo: "", descricao: "", mes: new Date().getMonth() + 1, ano: new Date().getFullYear() })
  const [editingCampanha, setEditingCampanha] = useState<string | null>(null)
  const [showCampanhaForm, setShowCampanhaForm] = useState(false)
  const [campanhaProdutos, setCampanhaProdutos] = useState<CampanhaProdutoForm[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [defRes, prodRes, campRes] = await Promise.all([
        fetch("/api/definicoes"),
        fetch("/api/produtos"),
        fetch("/api/campanhas")
      ])
      const json = await defRes.json()
      const produtosData = await prodRes.json()
      const campanhasData = await campRes.json()
      setData(json)
      setProdutos(produtosData)
      setCampanhas(campanhasData)
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

  function addCampanhaProduto() {
    setCampanhaProdutos([...campanhaProdutos, { produtoId: "", nome: "", precoUnit: "", quantidade: "1" }])
  }

  function removeCampanhaProduto(index: number) {
    setCampanhaProdutos(campanhaProdutos.filter((_, i) => i !== index))
  }

  function updateCampanhaProduto(index: number, field: keyof CampanhaProdutoForm, value: string) {
    const updated = [...campanhaProdutos]
    updated[index] = { ...updated[index], [field]: value }

    if (field === "produtoId" && value && value !== "PICKER_MODE") {
      const produto = produtos.find(p => p.id === value)
      if (produto) {
        updated[index].nome = produto.nome
        if (produto.preco && !updated[index].precoUnit) {
          const precoSemIva = Number(produto.preco) / 1.23
          updated[index].precoUnit = precoSemIva.toFixed(2)
        }
      }
    }

    setCampanhaProdutos(updated)
  }

  const campanhaTotalSemIva = campanhaProdutos.reduce((sum, p) => {
    return sum + (parseFloat(p.precoUnit) || 0) * (parseInt(p.quantidade) || 0)
  }, 0)

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
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Definições</h1>
        <p className="text-sm md:text-base text-muted-foreground">Configurar IVA, comissões, objetivos e prémios</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 md:gap-2 mb-4 md:mb-6">
        {[
          { id: "config", label: "Configurações", shortLabel: "Config", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" },
          { id: "objetivos", label: "Objetivos", shortLabel: "Obj.", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
          { id: "premios", label: "Tabela Prémios", shortLabel: "Prémios", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
          { id: "produtos", label: "Produtos", shortLabel: "Prod.", icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" },
          { id: "campanhas", label: "Campanhas", shortLabel: "Camp.", icon: "M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" }
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

      {/* Campanhas Tab */}
      {activeTab === "campanhas" && (
        <div className="space-y-6">
          {/* Header with Add Button */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-foreground">Campanhas</h2>
              <p className="text-sm text-muted-foreground">Gerir campanhas mensais</p>
            </div>
            <button
              onClick={() => {
                setCampanhaForm({ titulo: "", descricao: "", mes: new Date().getMonth() + 1, ano: new Date().getFullYear() })
                setEditingCampanha(null)
                setCampanhaProdutos([])
                setShowCampanhaForm(true)
              }}
              className="px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary-hover transition flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nova Campanha
            </button>
          </div>

          {/* Campanha Form */}
          {showCampanhaForm && (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
              <h3 className="text-lg font-bold mb-4">{editingCampanha ? "Editar Campanha" : "Nova Campanha"}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-foreground mb-1">Titulo *</label>
                  <input
                    type="text"
                    value={campanhaForm.titulo}
                    onChange={(e) => setCampanhaForm({...campanhaForm, titulo: e.target.value})}
                    className="w-full px-4 py-2 border-2 border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                    placeholder="Nome da campanha"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-foreground mb-1">Descricao</label>
                  <textarea
                    value={campanhaForm.descricao}
                    onChange={(e) => setCampanhaForm({...campanhaForm, descricao: e.target.value})}
                    className="w-full px-4 py-2 border-2 border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                    placeholder="Descricao da campanha"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1">Mes *</label>
                  <select
                    value={campanhaForm.mes}
                    onChange={(e) => setCampanhaForm({...campanhaForm, mes: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 border-2 border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  >
                    {meses.slice(1).map((m, i) => (
                      <option key={i+1} value={i+1}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1">Ano *</label>
                  <select
                    value={campanhaForm.ano}
                    onChange={(e) => setCampanhaForm({...campanhaForm, ano: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 border-2 border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  >
                    {[2024, 2025, 2026, 2027].map(a => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Products Section */}
              <div className="mt-6 pt-6 border-t border-purple-200">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h4 className="text-base font-bold text-foreground">Produtos da Campanha</h4>
                    <p className="text-xs text-muted-foreground">Adicione produtos da lista ou manualmente (precos sem IVA)</p>
                  </div>
                  <button
                    type="button"
                    onClick={addCampanhaProduto}
                    className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 transition flex items-center gap-1.5"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Adicionar Produto
                  </button>
                </div>

                {campanhaProdutos.length === 0 ? (
                  <div className="text-center py-6 bg-white/50 rounded-xl border-2 border-dashed border-purple-200">
                    <svg className="w-10 h-10 text-purple-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <p className="text-sm text-muted-foreground">Nenhum produto adicionado</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="hidden md:grid grid-cols-12 gap-2 text-xs font-bold text-muted-foreground px-1">
                      <div className="col-span-5">Produto</div>
                      <div className="col-span-2 text-center">Qtd</div>
                      <div className="col-span-2 text-center">Preco s/IVA</div>
                      <div className="col-span-2 text-right">Subtotal</div>
                      <div className="col-span-1"></div>
                    </div>

                    {campanhaProdutos.map((item, index) => {
                      const subtotal = (parseFloat(item.precoUnit) || 0) * (parseInt(item.quantidade) || 0)
                      return (
                        <div key={index} className="grid grid-cols-12 gap-2 items-center bg-white/60 rounded-lg p-2">
                          <div className="col-span-12 md:col-span-5">
                            <div className="flex items-center gap-1.5 mb-1">
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...campanhaProdutos]
                                  if (updated[index].produtoId) {
                                    updated[index] = { ...updated[index], produtoId: "", nome: "", precoUnit: "" }
                                  } else {
                                    updated[index] = { ...updated[index], produtoId: "PICKER_MODE" }
                                  }
                                  setCampanhaProdutos(updated)
                                }}
                                className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium hover:bg-purple-200 transition"
                              >
                                {item.produtoId ? "Manual" : "Da lista"}
                              </button>
                            </div>
                            {item.produtoId ? (
                              <ProductPicker
                                products={produtos.filter(p => p.ativo).map(p => ({
                                  id: p.id,
                                  nome: p.nome,
                                  codigo: p.codigo,
                                  categoria: p.categoria,
                                  tipo: p.tipo || null,
                                  preco: p.preco ? String(p.preco) : null
                                }))}
                                selectedProductId={item.produtoId === "PICKER_MODE" ? "" : item.produtoId}
                                onSelect={(productId, price) => updateCampanhaProduto(index, "produtoId", productId || "PICKER_MODE")}
                                placeholder="Procurar produto..."
                              />
                            ) : (
                              <input
                                type="text"
                                value={item.nome}
                                onChange={(e) => updateCampanhaProduto(index, "nome", e.target.value)}
                                className="w-full px-3 py-2 border-2 border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                                placeholder="Nome do produto"
                              />
                            )}
                          </div>
                          <div className="col-span-4 md:col-span-2">
                            <input
                              type="number"
                              step="1"
                              min="1"
                              value={item.quantidade}
                              onChange={(e) => updateCampanhaProduto(index, "quantidade", e.target.value)}
                              className="w-full px-3 py-2 border-2 border-border rounded-lg text-sm text-center focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                              placeholder="1"
                            />
                          </div>
                          <div className="col-span-4 md:col-span-2">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.precoUnit}
                              onChange={(e) => updateCampanhaProduto(index, "precoUnit", e.target.value)}
                              className="w-full px-3 py-2 border-2 border-border rounded-lg text-sm text-center focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                              placeholder="0.00"
                            />
                          </div>
                          <div className="col-span-3 md:col-span-2 text-right text-sm font-semibold text-foreground">
                            {formatCurrency(subtotal)} &euro;
                          </div>
                          <div className="col-span-1 flex justify-center">
                            <button
                              type="button"
                              onClick={() => removeCampanhaProduto(index)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      )
                    })}

                    <div className="flex justify-end pt-4 mt-2 border-t border-purple-200">
                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-5 py-3 rounded-xl border border-purple-200">
                        <span className="text-sm text-purple-700 font-medium">Total s/IVA: </span>
                        <span className="text-xl font-bold text-purple-600">{formatCurrency(campanhaTotalSemIva)} &euro;</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={async () => {
                    if (!campanhaForm.titulo) {
                      Swal.fire({ icon: "error", title: "Erro", text: "Titulo e obrigatorio" })
                      return
                    }
                    setSaving(true)
                    try {
                      const produtosToSave = campanhaProdutos
                        .filter(p => p.nome && p.precoUnit && p.quantidade)
                        .map(p => ({
                          produtoId: (p.produtoId && p.produtoId !== "PICKER_MODE") ? p.produtoId : null,
                          nome: p.nome,
                          precoUnit: parseFloat(p.precoUnit),
                          quantidade: parseInt(p.quantidade) || 1
                        }))

                      const url = editingCampanha ? `/api/campanhas/${editingCampanha}` : "/api/campanhas"
                      const method = editingCampanha ? "PUT" : "POST"
                      const res = await fetch(url, {
                        method,
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ ...campanhaForm, produtos: produtosToSave })
                      })
                      if (res.ok) {
                        setShowCampanhaForm(false)
                        setEditingCampanha(null)
                        setCampanhaProdutos([])
                        fetchData()
                        Swal.fire({ icon: "success", title: editingCampanha ? "Campanha atualizada" : "Campanha criada", timer: 1500, showConfirmButton: false })
                      }
                    } catch (err) {
                      console.error(err)
                    } finally {
                      setSaving(false)
                    }
                  }}
                  disabled={saving}
                  className="px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary-hover transition disabled:opacity-50"
                >
                  {saving ? "A guardar..." : "Guardar"}
                </button>
                <button
                  onClick={() => { setShowCampanhaForm(false); setEditingCampanha(null); setCampanhaProdutos([]) }}
                  className="px-6 py-2 border-2 border-border rounded-lg font-semibold hover:bg-secondary transition"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Campanhas List */}
          <div className="bg-card rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-purple-100 to-pink-100">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-bold text-foreground">Campanha</th>
                  <th className="px-4 py-3 text-center text-sm font-bold text-foreground">Mes/Ano</th>
                  <th className="px-4 py-3 text-center text-sm font-bold text-foreground">Vendidos</th>
                  <th className="px-4 py-3 text-center text-sm font-bold text-foreground">Vendas</th>
                  <th className="px-4 py-3 text-center text-sm font-bold text-foreground">Estado</th>
                  <th className="px-4 py-3 text-center text-sm font-bold text-foreground">Total s/IVA</th>
                  <th className="px-4 py-3 text-right text-sm font-bold text-foreground">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {campanhas.map((c) => (
                  <tr key={c.id} className="hover:bg-purple-50/50 transition">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-foreground">{c.titulo}</div>
                      {c.descricao && <div className="text-sm text-muted-foreground truncate max-w-xs">{c.descricao}</div>}
                    </td>
                    <td className="px-4 py-3 text-center text-sm">{meses[c.mes]} {c.ano}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full font-bold">{c.totalVendido}</span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-muted-foreground">{c.totalVendas} vendas</td>
                    <td className="px-4 py-3 text-center">
                      {c.ativo ? (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">Ativo</span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-semibold">Inativo</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-semibold text-purple-600">
                        {formatCurrency(c.totalSemIva || 0)} &euro;
                      </span>
                      {c.produtos && c.produtos.length > 0 && (
                        <div className="text-xs text-muted-foreground">{c.produtos.length} produto{c.produtos.length !== 1 ? "s" : ""}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 justify-end">
                        <button
                          onClick={() => {
                            setCampanhaForm({ titulo: c.titulo, descricao: c.descricao || "", mes: c.mes, ano: c.ano })
                            setEditingCampanha(c.id)
                            setCampanhaProdutos(
                              (c.produtos || []).map(p => ({
                                produtoId: p.produtoId || "",
                                nome: p.nome,
                                precoUnit: String(p.precoUnit),
                                quantidade: String(p.quantidade)
                              }))
                            )
                            setShowCampanhaForm(true)
                          }}
                          className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition"
                          title="Editar"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={async () => {
                            const result = await Swal.fire({
                              title: "Eliminar campanha?",
                              text: "Esta acao nao pode ser revertida",
                              icon: "warning",
                              showCancelButton: true,
                              confirmButtonColor: "#dc2626",
                              cancelButtonColor: "#6b7280",
                              confirmButtonText: "Sim, eliminar",
                              cancelButtonText: "Cancelar"
                            })
                            if (result.isConfirmed) {
                              await fetch(`/api/campanhas/${c.id}`, { method: "DELETE" })
                              fetchData()
                            }
                          }}
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
                {campanhas.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      Nenhuma campanha encontrada
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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
  const [formData, setFormData] = useState({ nome: "", codigo: "", categoria: "", descricao: "", preco: "", tipo: "" })
  const [search, setSearch] = useState("")
  const [filterTipo, setFilterTipo] = useState<string | null>(null)
  const [filterCategoria, setFilterCategoria] = useState<string | null>(null)

  const categorias = [...new Set(produtos.map(p => p.categoria).filter(Boolean))].sort() as string[]

  function resetForm() {
    setFormData({ nome: "", codigo: "", categoria: "", descricao: "", preco: "", tipo: "" })
    setEditingId(null)
    setShowForm(false)
  }

  function startEdit(p: Produto) {
    setFormData({
      nome: p.nome,
      codigo: p.codigo || "",
      categoria: p.categoria || "",
      descricao: p.descricao || "",
      preco: p.preco ? String(p.preco) : "",
      tipo: p.tipo || ""
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
            <div>
              <label className="block text-sm font-bold text-foreground mb-1">Canal de Venda</label>
              <select
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                className="w-full px-3 py-2 border-2 border-border rounded-xl bg-background text-foreground font-medium focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              >
                <option value="">Sem canal</option>
                <option value="Venda Público">Venda ao Público</option>
                <option value="Profissional">Profissional</option>
                <option value="Material Promocional">Material Promocional</option>
              </select>
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

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Procurar por nome ou codigo..."
            className="w-full pl-10 pr-4 py-2.5 border-2 border-border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {[
            { value: null, label: "Todos" },
            { value: "Venda Público", label: "Venda ao Público" },
            { value: "Profissional", label: "Profissional" },
            { value: "Material Promocional", label: "Material Promocional" }
          ].map((opt) => (
            <button
              key={opt.label}
              onClick={() => setFilterTipo(opt.value)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition ${
                filterTipo === opt.value
                  ? "bg-primary text-primary-foreground shadow"
                  : "bg-secondary text-foreground hover:bg-secondary/80 border border-border"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary-hover transition flex items-center gap-2 whitespace-nowrap"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Adicionar
          </button>
        )}
      </div>
      {categorias.length > 0 && (
        <div className="flex gap-1.5 flex-wrap mb-6">
          <span className="text-xs font-semibold text-muted-foreground self-center mr-1">Categoria:</span>
          <button
            onClick={() => setFilterCategoria(null)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              filterCategoria === null
                ? "bg-primary text-primary-foreground shadow"
                : "bg-secondary text-foreground hover:bg-secondary/80 border border-border"
            }`}
          >
            Todas
          </button>
          {categorias.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategoria(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                filterCategoria === cat
                  ? "bg-primary text-primary-foreground shadow"
                  : "bg-secondary text-foreground hover:bg-secondary/80 border border-border"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
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
                <th className="pb-3">Canal</th>
                <th className="pb-3">Preço</th>
                <th className="pb-3 text-center">Vendas</th>
                <th className="pb-3 text-center">Estado</th>
                <th className="pb-3 w-24"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {produtos.filter(p => {
                const matchesSearch = !search || 
                  p.nome.toLowerCase().includes(search.toLowerCase()) ||
                  (p.codigo && p.codigo.toLowerCase().includes(search.toLowerCase()))
                const matchesTipo = !filterTipo || p.tipo === filterTipo
                const matchesCategoria = !filterCategoria || p.categoria === filterCategoria
                return matchesSearch && matchesTipo && matchesCategoria
              }).map((p) => (
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
                    {p.tipo ? (
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                        p.tipo === "Venda Público" ? "bg-blue-100 text-blue-700" :
                        p.tipo === "Profissional" ? "bg-purple-100 text-purple-700" :
                        "bg-orange-100 text-orange-700"
                      }`}>
                        {p.tipo === "Venda Público" ? "Venda ao Público" : p.tipo}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
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
                        title="Editar" aria-label="Editar"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition"
                        title="Eliminar" aria-label="Eliminar"
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
