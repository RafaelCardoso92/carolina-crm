"use client"

import { useState, useRef, useEffect, useMemo } from "react"

type Product = {
  id: string
  nome: string
  codigo: string | null
  categoria: string | null
  tipo: string | null
  preco: string | null
}

type ProductPickerProps = {
  products: Product[]
  selectedProductId: string
  onSelect: (productId: string, price: string | null) => void
  placeholder?: string
}

const TIPO_OPTIONS = [
  { value: null, label: "Todos" },
  { value: "Venda Público", label: "Venda ao Público" },
  { value: "Profissional", label: "Profissional" },
  { value: "Material Promocional", label: "Material Promocional" },
]

export default function ProductPicker({
  products,
  selectedProductId,
  onSelect,
  placeholder = "Procurar produto..."
}: ProductPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [selectedTipo, setSelectedTipo] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set<string>()
    products.forEach(p => {
      if (p.categoria) cats.add(p.categoria)
    })
    return Array.from(cats).sort()
  }, [products])

  // Filter products based on search, tipo, and category
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = search === "" ||
        p.nome.toLowerCase().includes(search.toLowerCase()) ||
        (p.codigo && p.codigo.toLowerCase().includes(search.toLowerCase()))

      const matchesTipo = selectedTipo === null || p.tipo === selectedTipo

      const matchesCategory = selectedCategory === null || p.categoria === selectedCategory

      return matchesSearch && matchesTipo && matchesCategory
    })
  }, [products, search, selectedTipo, selectedCategory])

  // Group products by category for display
  const groupedProducts = useMemo(() => {
    if (selectedCategory) {
      return { [selectedCategory]: filteredProducts }
    }

    const groups: Record<string, Product[]> = {}
    filteredProducts.forEach(p => {
      const cat = p.categoria || "Sem Categoria"
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(p)
    })
    return groups
  }, [filteredProducts, selectedCategory])

  // Get selected product
  const selectedProduct = products.find(p => p.id === selectedProductId)

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Focus search when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen])

  // Handle keyboard navigation
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown)
      return () => document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen])

  const handleSelect = (product: Product) => {
    onSelect(product.id, product.preco)
    setIsOpen(false)
    setSearch("")
  }

  const handleClear = () => {
    onSelect("", null)
    setSearch("")
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 border-2 rounded-lg text-sm text-left flex items-center gap-2 transition-colors ${
          isOpen
            ? "border-primary ring-2 ring-primary/20"
            : "border-border hover:border-muted-foreground"
        } bg-card`}
      >
        {selectedProduct ? (
          <>
            <span className="flex-1 truncate text-foreground">
              {selectedProduct.nome}
              {selectedProduct.codigo && (
                <span className="text-muted-foreground ml-1">({selectedProduct.codigo})</span>
              )}
            </span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleClear(); }}
              className="p-0.5 hover:bg-muted rounded"
            >
              <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </>
        ) : (
          <>
            <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="flex-1 text-muted-foreground">{placeholder}</span>
            <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full min-w-[320px] bg-card border border-border rounded-lg shadow-xl overflow-hidden">
          {/* Search Input */}
          <div className="p-2 border-b border-border">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Procurar por nome ou código..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded"
                >
                  <svg className="w-3 h-3 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Tipo Filter - Sales Channel */}
          <div className="p-2 border-b border-border bg-muted/30">
            <p className="text-xs text-muted-foreground mb-1.5 font-medium">Canal de Venda</p>
            <div className="flex gap-1 flex-wrap">
              {TIPO_OPTIONS.map(opt => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => setSelectedTipo(selectedTipo === opt.value ? null : opt.value)}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    selectedTipo === opt.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-border text-foreground hover:bg-secondary"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category Filter */}
          {categories.length > 0 && (
            <div className="p-2 border-b border-border flex gap-1 flex-wrap max-h-24 overflow-y-auto">
              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${
                  selectedCategory === null
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-secondary"
                }`}
              >
                Todas Categorias
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${
                    selectedCategory === cat
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Products List */}
          <div className="max-h-64 overflow-y-auto">
            {filteredProducts.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground text-sm">
                Nenhum produto encontrado
              </div>
            ) : (
              Object.entries(groupedProducts).map(([category, prods]) => (
                <div key={category}>
                  {!selectedCategory && (
                    <div className="px-3 py-1.5 bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wide sticky top-0">
                      {category}
                    </div>
                  )}
                  {prods.map(product => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => handleSelect(product)}
                      className={`w-full px-3 py-2.5 text-left hover:bg-muted/50 flex items-center gap-3 transition-colors ${
                        product.id === selectedProductId ? "bg-primary/5" : ""
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {product.nome}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {product.codigo && <span>{product.codigo}</span>}
                          {product.tipo && (
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                              product.tipo === "Venda Público"
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : product.tipo === "Profissional"
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                            }`}>
                              {product.tipo === "Venda Público" ? "Público" :
                               product.tipo === "Material Promocional" ? "Promo" : product.tipo}
                            </span>
                          )}
                          {product.preco && (
                            <span className="text-primary font-medium">{parseFloat(product.preco).toFixed(2)}€</span>
                          )}
                        </div>
                      </div>
                      {product.id === selectedProductId && (
                        <svg className="w-4 h-4 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>

          {/* Footer with count */}
          <div className="px-3 py-2 border-t border-border bg-muted/30 text-xs text-muted-foreground">
            {filteredProducts.length} produto{filteredProducts.length !== 1 ? "s" : ""} encontrado{filteredProducts.length !== 1 ? "s" : ""}
          </div>
        </div>
      )}
    </div>
  )
}
