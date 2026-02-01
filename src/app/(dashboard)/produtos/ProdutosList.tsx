"use client"

import { useState } from "react"

interface Produto {
  id: string
  nome: string
  codigo: string | null
  categoria: string | null
  preco: number | null
  tipo: string | null
}

interface ProdutosListProps {
  categorias: Record<string, Produto[]>
}

export default function ProdutosList({ categorias }: ProdutosListProps) {
  const [search, setSearch] = useState("")
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(Object.keys(categorias)))

  const toggleCategory = (cat: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(cat)) {
      newExpanded.delete(cat)
    } else {
      newExpanded.add(cat)
    }
    setExpandedCategories(newExpanded)
  }

  const filteredCategorias = Object.entries(categorias).reduce((acc, [cat, produtos]) => {
    const filtered = produtos.filter(p =>
      p.nome.toLowerCase().includes(search.toLowerCase()) ||
      (p.codigo && p.codigo.toLowerCase().includes(search.toLowerCase()))
    )
    if (filtered.length > 0) {
      acc[cat] = filtered
    }
    return acc
  }, {} as Record<string, Produto[]>)

  const totalFiltered = Object.values(filteredCategorias).reduce((sum, arr) => sum + arr.length, 0)

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar por nome ou codigo..."
          className="w-full px-4 py-3 pl-10 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {search && (
        <p className="text-sm text-muted-foreground">
          {totalFiltered} produtos encontrados
        </p>
      )}

      {/* Categories */}
      <div className="space-y-4">
        {Object.entries(filteredCategorias)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([categoria, produtos]) => (
            <div key={categoria} className="bg-card rounded-2xl border border-border overflow-hidden">
              <button
                onClick={() => toggleCategory(categoria)}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition"
              >
                <div className="flex items-center gap-3">
                  <svg
                    className={`w-5 h-5 text-muted-foreground transition-transform ${
                      expandedCategories.has(categoria) ? "rotate-90" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span className="font-medium text-foreground">{categoria}</span>
                </div>
                <span className="text-sm text-muted-foreground">{produtos.length} produtos</span>
              </button>

              {expandedCategories.has(categoria) && (
                <div className="border-t border-border">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="text-left p-3 text-xs font-medium text-muted-foreground">Codigo</th>
                        <th className="text-left p-3 text-xs font-medium text-muted-foreground">Nome</th>
                        <th className="text-right p-3 text-xs font-medium text-muted-foreground">Preco</th>
                      </tr>
                    </thead>
                    <tbody>
                      {produtos.map((produto) => (
                        <tr key={produto.id} className="border-t border-border hover:bg-muted/20 transition">
                          <td className="p-3 text-sm text-muted-foreground font-mono">
                            {produto.codigo || "-"}
                          </td>
                          <td className="p-3 text-sm text-foreground">
                            {produto.nome}
                          </td>
                          <td className="p-3 text-sm text-foreground text-right font-medium">
                            {produto.preco
                              ? new Intl.NumberFormat("pt-PT", {
                                  style: "currency",
                                  currency: "EUR"
                                }).format(Number(produto.preco))
                              : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
      </div>

      {Object.keys(filteredCategorias).length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          Nenhum produto encontrado
        </div>
      )}
    </div>
  )
}
