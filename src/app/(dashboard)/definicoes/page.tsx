"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

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
  "", "Janeiro", "Fevereiro", "Marco", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
]

export default function DefinicoesPage() {
  const router = useRouter()
  const [data, setData] = useState<SettingsData | null>(null)
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<"config" | "objetivos" | "premios" | "produtos">("config")

  // Form states
  const [iva, setIva] = useState("")
  const [comissao, setComissao] = useState("")
  const [selectedAno, setSelectedAno] = useState(new Date().getFullYear())

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [defRes, prodRes] = await Promise.all([
        fetch("/api/definicoes"),
        fetch("/api/produtos")
      ])
      const json = await defRes.json()
      const produtosData = await prodRes.json()
      setData(json)
      setProdutos(produtosData)
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
      alert("Erro ao guardar configuracao")
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
      alert("Erro ao guardar objetivo")
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
      alert("Erro ao guardar premio")
    } finally {
      setSaving(false)
    }
  }

  async function deletePremio(tipo: string, id: string) {
    if (!confirm("Tem a certeza que quer eliminar este premio?")) return
    setSaving(true)
    try {
      await fetch(`/api/definicoes?tipo=${tipo}&id=${id}`, { method: "DELETE" })
      await fetchData()
    } catch (error) {
      console.error("Error deleting premio:", error)
      alert("Erro ao eliminar premio")
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Definicoes</h1>
        <p className="text-muted-foreground">Configurar IVA, comissoes, objetivos e premios</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { id: "config", label: "Configuracoes", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" },
          { id: "objetivos", label: "Objetivos", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
          { id: "premios", label: "Tabela Premios", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
          { id: "produtos", label: "Produtos", icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition ${
              activeTab === tab.id
                ? "bg-primary text-primary-foreground shadow-lg"
                : "bg-card text-foreground hover:bg-secondary border-2 border-border"
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
            </svg>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Config Tab */}
      {activeTab === "config" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* IVA */}
          <div className="bg-card rounded-2xl shadow-sm p-6 border border-border">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Percentagem de IVA
            </h3>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <input
                  type="number"
                  step="0.1"
                  value={iva}
                  onChange={(e) => setIva(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-border rounded-xl bg-background text-foreground font-medium focus:ring-2 focus:ring-primary focus:border-primary outline-none pr-10"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">%</span>
              </div>
              <button
                onClick={() => saveConfig("IVA_PERCENTAGEM", iva)}
                disabled={saving}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary-hover transition disabled:opacity-50"
              >
                Guardar
              </button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">Taxa de IVA aplicada nas vendas (padrao: 23%)</p>
          </div>

          {/* Comissao */}
          <div className="bg-card rounded-2xl shadow-sm p-6 border border-border">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Percentagem de Comissao
            </h3>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <input
                  type="number"
                  step="0.1"
                  value={comissao}
                  onChange={(e) => setComissao(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-border rounded-xl bg-background text-foreground font-medium focus:ring-2 focus:ring-primary focus:border-primary outline-none pr-10"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">%</span>
              </div>
              <button
                onClick={() => saveConfig("COMISSAO_PERCENTAGEM", comissao)}
                disabled={saving}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary-hover transition disabled:opacity-50"
              >
                Guardar
              </button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">Comissao sobre vendas (padrao: 3.5%)</p>
          </div>
        </div>
      )}

      {/* Objetivos Tab */}
      {activeTab === "objetivos" && (
        <div className="space-y-6">
          {/* Year Selector */}
          <div className="bg-card rounded-2xl shadow-sm p-4 border border-border">
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
          <div className="bg-card rounded-2xl shadow-sm p-6 border border-border">
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
              hint="Define o objetivo anual. Sera dividido por 4 trimestres e 12 meses se nao houver objetivos especificos."
            />
          </div>

          {/* Quarterly Objectives */}
          <div className="bg-card rounded-2xl shadow-sm p-6 border border-border">
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
          <div className="bg-card rounded-2xl shadow-sm p-6 border border-border">
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
          <div className="bg-card rounded-2xl shadow-sm p-6 border border-border">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Premios Mensais
            </h3>
            <PremioTable
              premios={data?.premiosMensais || []}
              onSave={(dados) => savePremio("premio_mensal", dados)}
              onDelete={(id) => deletePremio("premio_mensal", id)}
              saving={saving}
            />
          </div>

          {/* Quarterly Prizes */}
          <div className="bg-card rounded-2xl shadow-sm p-6 border border-border">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Premios Trimestrais
            </h3>
            <PremioTable
              premios={data?.premiosTrimestrais || []}
              onSave={(dados) => savePremio("premio_trimestral", dados)}
              onDelete={(id) => deletePremio("premio_trimestral", id)}
              saving={saving}
            />
          </div>

          {/* Annual Prizes */}
          <div className="bg-card rounded-2xl shadow-sm p-6 border border-border">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Premios Anuais
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
        <div className="bg-card rounded-2xl shadow-sm p-6 border border-border">
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            Gerir Produtos
          </h3>
          <p className="text-muted-foreground text-sm mb-6">Adicione produtos para rastrear vendas e gerar recomendacoes de upsell.</p>
          <ProdutosTable
            produtos={produtos}
            onRefresh={fetchData}
            saving={saving}
            setSaving={setSaving}
          />
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
        <p className="text-xs text-muted-foreground mt-1">Calculado: {fallbackValue.toFixed(2)} €</p>
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
            <th className="pb-2">Vendas Minimas</th>
            <th className="pb-2">Premio</th>
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
            placeholder="Minimo"
            className="w-full px-3 py-2 border-2 border-border rounded-xl bg-background text-foreground font-medium focus:ring-2 focus:ring-primary focus:border-primary outline-none pr-8"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">€</span>
        </div>
        <div className="relative flex-1">
          <input
            type="number"
            value={newPremio}
            onChange={(e) => setNewPremio(e.target.value)}
            placeholder="Premio"
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
  const [formData, setFormData] = useState({ nome: "", codigo: "", categoria: "", descricao: "" })

  function resetForm() {
    setFormData({ nome: "", codigo: "", categoria: "", descricao: "" })
    setEditingId(null)
    setShowForm(false)
  }

  function startEdit(p: Produto) {
    setFormData({
      nome: p.nome,
      codigo: p.codigo || "",
      categoria: p.categoria || "",
      descricao: p.descricao || ""
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
        alert(error.error || "Erro ao guardar produto")
      }
    } catch (error) {
      console.error("Error saving produto:", error)
      alert("Erro ao guardar produto")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem a certeza que quer eliminar este produto?")) return

    setSaving(true)
    try {
      const res = await fetch(`/api/produtos/${id}`, { method: "DELETE" })
      if (res.ok) {
        onRefresh()
      } else {
        const error = await res.json()
        alert(error.error || "Erro ao eliminar produto")
      }
    } catch (error) {
      console.error("Error deleting produto:", error)
      alert("Erro ao eliminar produto")
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
              <label className="block text-sm font-bold text-foreground mb-1">Codigo</label>
              <input
                type="text"
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                className="w-full px-3 py-2 border-2 border-border rounded-xl bg-background text-foreground font-medium focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                placeholder="Codigo unico (opcional)"
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
              <label className="block text-sm font-bold text-foreground mb-1">Descricao</label>
              <input
                type="text"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                className="w-full px-3 py-2 border-2 border-border rounded-xl bg-background text-foreground font-medium focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                placeholder="Descricao breve"
              />
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
          <p className="text-sm">Adicione produtos para comecar a rastrear vendas</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-muted-foreground border-b border-border">
                <th className="pb-3">Nome</th>
                <th className="pb-3">Codigo</th>
                <th className="pb-3">Categoria</th>
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
