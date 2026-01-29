"use client"

import { useState, useRef, useEffect, useMemo } from "react"

type Product = {
  id: string
  nome: string
  codigo: string | null
  categoria: string | null
  preco: string | null
}

type ProductPickerProps = {
  products: Product[]
  selectedProductId: string
  onSelect: (productId: string, price: string | null) => void
  placeholder?: string
}

export default function ProductPicker({
  products,
  selectedProductId,
  onSelect,
  placeholder = "Selecionar produto..."
}: ProductPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set<string>()
    products.forEach(p => {
      if (p.categoria) cats.add(p.categoria)
    })
    return Array.from(cats).sort()
  }, [products])

  // Filter products based on search and category
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = search === "" ||
        p.nome.toLowerCase().includes(search.toLowerCase()) ||
        (p.codigo && p.codigo.toLowerCase().includes(search.toLowerCase()))

      const matchesCategory = selectedCategory === null || p.categoria === selectedCategory

      return matchesSearch && matchesCategory
    })
  }, [products, search, selectedCategory])

  // Flat list for keyboard navigation
  const flatProducts = useMemo(() => {
    return filteredProducts
  }, [filteredProducts])

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

  // Reset highlighted index when search changes
  useEffect(() => {
    setHighlightedIndex(0)
  }, [search, selectedCategory])

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
      } else if (event.key === "ArrowDown") {
        event.preventDefault()
        setHighlightedIndex(i => Math.min(i + 1, flatProducts.length - 1))
      } else if (event.key === "ArrowUp") {
        event.preventDefault()
        setHighlightedIndex(i => Math.max(i - 1, 0))
      } else if (event.key === "Enter" && flatProducts[highlightedIndex]) {
        event.preventDefault()
        handleSelect(flatProducts[highlightedIndex])
      }
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown)
      return () => document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen, highlightedIndex, flatProducts])

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && listRef.current) {
      const highlighted = listRef.current.querySelector(`[data-index="${highlightedIndex}"]`)
      if (highlighted) {
        highlighted.scrollIntoView({ block: "nearest" })
      }
    }
  }, [highlightedIndex, isOpen])

  const handleSelect = (product: Product) => {
    onSelect(product.id, product.preco)
    setIsOpen(false)
    setSearch("")
  }

  const handleClear = () => {
    onSelect("", null)
    setSearch("")
  }

  const formatPrice = (price: string | null) => {
    if (!price) return null
    return parseFloat(price).toFixed(2)
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-2.5 border-2 rounded-xl text-left flex items-center gap-3 transition-all ${
          isOpen
            ? "border-primary ring-2 ring-primary/20 shadow-md"
            : "border-border hover:border-primary/50 hover:shadow-sm"
        } bg-card`}
      >
        {selectedProduct ? (
          <>
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {selectedProduct.nome}
              </p>
              <p className="text-xs text-muted-foreground">
                {selectedProduct.codigo && <span>{selectedProduct.codigo}</span>}
                {selectedProduct.codigo && selectedProduct.preco && <span> · </span>}
                {selectedProduct.preco && <span className="text-primary font-semibold">{formatPrice(selectedProduct.preco)}€</span>}
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleClear(); }}
              className="p-1.5 hover:bg-destructive/10 rounded-lg transition-colors group"
            >
              <svg className="w-4 h-4 text-muted-foreground group-hover:text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </>
        ) : (
          <>
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <span className="flex-1 text-muted-foreground text-sm">{placeholder}</span>
            <svg className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-2 w-full min-w-[380px] bg-card border border-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Search Input */}
          <div className="p-3 border-b border-border bg-muted/30">
            <div className="relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Escreva para procurar..."
                className="w-full pl-10 pr-10 py-2.5 text-sm border-2 border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background transition-all"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-muted rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Category Filter */}
          {categories.length > 0 && (
            <div className="px-3 py-2.5 border-b border-border flex gap-2 flex-wrap bg-background">
              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  selectedCategory === null
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                Todos ({products.length})
              </button>
              {categories.map(cat => {
                const count = products.filter(p => p.categoria === cat).length
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      selectedCategory === cat
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    {cat} ({count})
                  </button>
                )
              })}
            </div>
          )}

          {/* Products List */}
          <div ref={listRef} className="max-h-80 overflow-y-auto">
            {filteredProducts.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
                  <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-foreground">Nenhum produto encontrado</p>
                <p className="text-xs text-muted-foreground mt-1">Tente outra pesquisa ou categoria</p>
              </div>
            ) : (
              <>
                {Object.entries(groupedProducts).map(([category, prods]) => (
                  <div key={category}>
                    {!selectedCategory && (
                      <div className="px-4 py-2 bg-muted/50 border-y border-border/50 sticky top-0 z-10">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                          {category}
                          <span className="ml-2 font-normal">({prods.length})</span>
                        </p>
                      </div>
                    )}
                    <div className="p-2">
                      {prods.map((product) => {
                        const flatIndex = flatProducts.findIndex(p => p.id === product.id)
                        const isHighlighted = flatIndex === highlightedIndex
                        const isSelected = product.id === selectedProductId

                        return (
                          <button
                            key={product.id}
                            type="button"
                            data-index={flatIndex}
                            onClick={() => handleSelect(product)}
                            onMouseEnter={() => setHighlightedIndex(flatIndex)}
                            className={`w-full px-3 py-3 text-left rounded-lg flex items-center gap-3 transition-all mb-1 last:mb-0 ${
                              isHighlighted
                                ? "bg-primary/10 ring-2 ring-primary/20"
                                : isSelected
                                ? "bg-primary/5"
                                : "hover:bg-muted/50"
                            }`}
                          >
                            {/* Product Icon */}
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                            }`}>
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                              </svg>
                            </div>

                            {/* Product Info */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-foreground truncate">
                                {product.nome}
                              </p>
                              {product.codigo && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  Código: {product.codigo}
                                </p>
                              )}
                            </div>

                            {/* Price Badge */}
                            {product.preco && (
                              <div className="flex-shrink-0">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-sm font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                  {formatPrice(product.preco)}€
                                </span>
                              </div>
                            )}

                            {/* Selected Check */}
                            {isSelected && (
                              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                                <svg className="w-4 h-4 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Footer with count and keyboard hint */}
          <div className="px-4 py-2.5 border-t border-border bg-muted/30 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {filteredProducts.length} produto{filteredProducts.length !== 1 ? "s" : ""}
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 text-[10px] font-medium bg-background border border-border rounded">↑↓</kbd>
              <span>navegar</span>
              <kbd className="px-1.5 py-0.5 text-[10px] font-medium bg-background border border-border rounded">Enter</kbd>
              <span>selecionar</span>
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
