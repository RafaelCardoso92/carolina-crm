"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { formatCurrency } from "@/lib/utils"

type Produto = {
  id: string
  nome: string
  precoUnit: string
  quantidade: number
  produto: { id: string; nome: string; codigo: string | null } | null
}

type CampanhaVenda = {
  id: string
  quantidade: number
  venda: {
    id: string
    total: string
    cliente: { id: string; nome: string }
  }
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
  produtos: Produto[]
  vendas: CampanhaVenda[]
}

const meses = [
  "", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
]

export default function CampanhasPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentDate = new Date()
  const [mes, setMes] = useState(searchParams.get("mes") ? parseInt(searchParams.get("mes")!) : currentDate.getMonth() + 1)
  const [ano, setAno] = useState(searchParams.get("ano") ? parseInt(searchParams.get("ano")!) : currentDate.getFullYear())

  const [campanhas, setCampanhas] = useState<Campanha[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    fetchCampanhas()
  }, [mes, ano])

  async function fetchCampanhas() {
    setLoading(true)
    try {
      const res = await fetch(`/api/campanhas?mes=${mes}&ano=${ano}`)
      if (res.ok) {
        const data = await res.json()
        setCampanhas(data)
      }
    } catch (error) {
      console.error("Error fetching campanhas:", error)
    } finally {
      setLoading(false)
    }
  }

  function changeMonth(delta: number) {
    let newMes = mes + delta
    let newAno = ano

    if (newMes > 12) {
      newMes = 1
      newAno++
    } else if (newMes < 1) {
      newMes = 12
      newAno--
    }

    setMes(newMes)
    setAno(newAno)
    router.push(`/campanhas?mes=${newMes}&ano=${newAno}`)
  }

  return (
    <div>
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Campanhas</h1>
        <p className="text-muted-foreground flex items-center gap-2 mt-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
          </svg>
          Gerir campanhas de vendas
        </p>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-center gap-4 mb-6 bg-card rounded-2xl p-4 border border-border">
        <button
          onClick={() => changeMonth(-1)}
          className="p-2.5 rounded-xl bg-secondary hover:bg-muted transition border border-border"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-lg md:text-xl font-bold text-foreground min-w-[180px] md:min-w-[200px] text-center tracking-tight">
          {meses[mes]} {ano}
        </h2>
        <button
          onClick={() => changeMonth(1)}
          className="p-2.5 rounded-xl bg-secondary hover:bg-muted transition border border-border"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        <div className="bg-card rounded-2xl p-4 border border-border">
          <p className="text-xs md:text-sm font-semibold text-muted-foreground uppercase tracking-wide">Total Campanhas</p>
          <p className="text-xl md:text-2xl font-bold text-foreground mt-1">{campanhas.length}</p>
        </div>
        <div className="bg-white dark:bg-card rounded-2xl p-4 border border-border">
          <p className="text-xs md:text-sm font-semibold text-success uppercase tracking-wide">Campanhas Ativas</p>
          <p className="text-xl md:text-2xl font-bold text-success mt-1">{campanhas.filter(c => c.ativo).length}</p>
        </div>
        <div className="bg-white dark:bg-card rounded-2xl p-4 border border-border">
          <p className="text-xs md:text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">Unidades Vendidas</p>
          <p className="text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{campanhas.reduce((sum, c) => sum + c.totalVendido, 0)}</p>
        </div>
        <div className="bg-white dark:bg-card rounded-2xl p-4 border border-border">
          <p className="text-xs md:text-sm font-semibold text-primary uppercase tracking-wide">Valor Total</p>
          <p className="text-xl md:text-2xl font-bold text-primary mt-1">
            {formatCurrency(campanhas.reduce((sum, c) => sum + c.totalSemIva, 0))} €
          </p>
        </div>
      </div>

      {/* Info */}
      <div className="bg-white dark:bg-card border border-border rounded-2xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary/10 rounded-xl shrink-0">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm text-foreground">
            <strong>Nota:</strong> As campanhas são geridas em{" "}
            <a href="/definicoes" className="underline hover:no-underline font-semibold">Definições</a>.
            Aqui pode ver o progresso e as vendas associadas a cada campanha.
          </p>
        </div>
      </div>

      {/* Campanhas List */}
      {loading ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border">
          <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-muted-foreground mt-4 font-medium">A carregar...</p>
        </div>
      ) : campanhas.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border">
          <svg className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
          </svg>
          <p className="text-muted-foreground text-lg font-medium">Nenhuma campanha em {meses[mes]} {ano}</p>
          <p className="text-muted-foreground/70 mt-1 text-sm">Crie campanhas em Definições</p>
        </div>
      ) : (
        <div className="space-y-4">
          {campanhas.map((campanha) => (
            <div key={campanha.id} className="bg-card rounded-2xl border border-border/50 overflow-hidden hover:shadow-md transition-shadow">
              <div
                className="p-4 cursor-pointer hover:bg-muted/50 transition"
                onClick={() => setExpandedId(expandedId === campanha.id ? null : campanha.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{campanha.titulo}</h3>
                      {campanha.ativo ? (
                        <span className="px-2 py-0.5 text-xs font-medium bg-success/10 text-success rounded-full">
                          Ativa
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 rounded-full">
                          Inativa
                        </span>
                      )}
                    </div>
                    {campanha.descricao && (
                      <p className="text-sm text-muted-foreground mt-1">{campanha.descricao}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Unidades</p>
                      <p className="font-semibold text-foreground">{campanha.totalVendido}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Vendas</p>
                      <p className="font-semibold text-muted-foreground">{campanha.totalVendas}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Valor</p>
                      <p className="font-semibold text-primary">{formatCurrency(campanha.totalSemIva)} €</p>
                    </div>
                    <svg
                      className={`w-5 h-5 text-muted-foreground transition-transform ${expandedId === campanha.id ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedId === campanha.id && (
                <div className="border-t border-border p-4 bg-muted/30">
                  {/* Products */}
                  {campanha.produtos.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-muted-foreground mb-2">Produtos da Campanha</h4>
                      <div className="space-y-2">
                        {campanha.produtos.map((p) => (
                          <div key={p.id} className="flex justify-between items-center text-sm bg-background rounded-lg p-2">
                            <span className="text-foreground">{p.nome}</span>
                            <span className="text-muted-foreground">
                              {p.quantidade}x @ {formatCurrency(Number(p.precoUnit))} €
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sales */}
                  {campanha.vendas.length > 0 ? (
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                        Vendas Associadas ({campanha.vendas.reduce((sum, v) => sum + v.quantidade, 0)} unidades)
                      </h4>
                      <div className="space-y-2">
                        {campanha.vendas.map((v) => (
                          <div key={v.id} className="flex justify-between items-center text-sm bg-background rounded-lg p-2">
                            <div className="flex items-center gap-2">
                              <span className="text-foreground">{v.venda.cliente.nome}</span>
                              {v.quantidade > 1 && (
                                <span className="px-1.5 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded">
                                  ×{v.quantidade}
                                </span>
                              )}
                            </div>
                            <span className="text-primary font-medium">
                              {formatCurrency(Number(v.venda.total))} €
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhuma venda associada a esta campanha
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
