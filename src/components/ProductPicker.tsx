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
  recentProductIds?: string[]
}

export default function ProductPicker({
  products,
  selectedProductId,
  onSelect,
  placeholder = "Selecionar produto...",
  recentProductIds = []
}: ProductPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Get unique categories sorted alphabetically
  const categories = useMemo(() => {
    const cats = new Set<string>()
    products.forEach(p => {
      if (p.categoria) cats.add(p.categoria)
    })
    return Array.from(cats).sort()
  }, [products])

  // Get recent products
  const recentProducts = useMemo(() => {
    if (recentProductIds.length === 0) return []
    return recentProductIds
      .map(id => products.find(p => p.id === id))
      .filter((p): p is Product => !!p)
      .slice(0, 5)
  }, [products, recentProductIds])

  // Filter products based on search and category
  const filteredProducts = useMemo(() => {
    let filtered = products

    // Filter by category first
    if (selectedCategory) {
      filtered = filtered.filter(p => p.categoria === selectedCategory)
    }

    // Then filter by search
    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(p =>
        p.nome.toLowerCase().includes(searchLower) ||
        (p.codigo && p.codigo.toLowerCase().includes(searchLower))
      )
    }

    // Sort alphabetically
    return filtered.sort((a, b) => a.nome.localeCompare(b.nome))
  }, [products, search, selectedCategory])

  // Get selected product
  const selectedProduct = products.find(p => p.id === selectedProductId)

  // Reset highlighted index when filters change
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
      if (!isOpen) return

      if (event.key === "Escape") {
        setIsOpen(false)
      } else if (event.key === "ArrowDown") {
        event.preventDefault()
        setHighlightedIndex(i => Math.min(i + 1, filteredProducts.length - 1))
      } else if (event.key === "ArrowUp") {
        event.preventDefault()
        setHighlightedIndex(i => Math.max(i - 1, 0))
      } else if (event.key === "Enter" && filteredProducts[highlightedIndex]) {
        event.preventDefault()
        handleSelect(filteredProducts[highlightedIndex])
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, highlightedIndex, filteredProducts])

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
    setSelectedCategory("")
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
      {/* Trigger */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsOpen(!isOpen) }}
        className={`w-full px-3 py-2 border-2 rounded-lg text-left flex items-center gap-2 transition-all cursor-pointer ${
          isOpen
            ? "border-primary ring-2 ring-primary/20"
            : "border-border hover:border-primary/50"
        } bg-card`}
      >
        {selectedProduct ? (
          <>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {selectedProduct.nome}
              </p>
            </div>
            {selectedProduct.preco && (
              <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded">
                {formatPrice(selectedProduct.preco)}€
              </span>
            )}
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); handleClear(); }}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); handleClear(); } }}
              className="p-1 hover:bg-destructive/10 rounded transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4 text-muted-foreground hover:text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="flex-1 text-muted-foreground text-sm">{placeholder}</span>
            <svg className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full min-w-[320px] bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
          {/* Search and Category Filter Row */}
          <div className="p-2 border-b border-border bg-secondary/30">
            <div className="flex gap-2">
              {/* Search Input */}
              <div className="relative flex-1">
                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Procurar..."
                  className="w-full pl-8 pr-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
                />
              </div>

              {/* Category Dropdown */}
              {categories.length > 0 && (
                <div className="relative">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="appearance-none pl-3 pr-8 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background cursor-pointer min-w-[120px]"
                  >
                    <option value="">Todas ({products.length})</option>
                    {categories.map(cat => {
                      const count = products.filter(p => p.categoria === cat).length
                      return (
                        <option key={cat} value={cat}>
                          {cat} ({count})
                        </option>
                      )
                    })}
                  </select>
                  <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* Recent Products */}
          {recentProducts.length > 0 && !search && !selectedCategory && (
            <div className="p-2 border-b border-border bg-amber-50/50 dark:bg-amber-900/10">
              <p className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-1.5 px-1">
                Recentes
              </p>
              <div className="flex flex-wrap gap-1">
                {recentProducts.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => handleSelect(product)}
                    className="px-2 py-1 text-xs font-medium bg-white dark:bg-card border border-amber-200 dark:border-amber-800 rounded-md hover:bg-amber-100 dark:hover:bg-amber-900/30 transition truncate max-w-[150px]"
                  >
                    {product.nome}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Products List */}
          <div ref={listRef} className="max-h-64 overflow-y-auto">
            {filteredProducts.length === 0 ? (
              <div className="p-6 text-center">
                <svg className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p className="text-sm text-muted-foreground">Nenhum produto encontrado</p>
              </div>
            ) : (
              <div className="p-1">
                {filteredProducts.map((product, index) => {
                  const isHighlighted = index === highlightedIndex
                  const isSelected = product.id === selectedProductId

                  return (
                    <button
                      key={product.id}
                      type="button"
                      data-index={index}
                      onClick={() => handleSelect(product)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      className={`w-full px-3 py-2 text-left rounded-lg flex items-center gap-2 transition-all ${
                        isHighlighted
                          ? "bg-primary/10"
                          : isSelected
                          ? "bg-primary/5"
                          : "hover:bg-muted/50"
                      }`}
                    >
                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground truncate">
                            {product.nome}
                          </p>
                          {product.codigo && (
                            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded flex-shrink-0">
                              {product.codigo}
                            </span>
                          )}
                        </div>
                        {product.categoria && !selectedCategory && (
                          <p className="text-[10px] text-muted-foreground truncate">
                            {product.categoria}
                          </p>
                        )}
                      </div>

                      {/* Price */}
                      {product.preco && (
                        <span className="text-xs font-bold text-primary flex-shrink-0">
                          {formatPrice(product.preco)}€
                        </span>
                      )}

                      {/* Selected indicator */}
                      {isSelected && (
                        <svg className="w-4 h-4 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-3 py-2 border-t border-border bg-muted/30 flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">
              {filteredProducts.length} de {products.length} produtos
            </span>
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <kbd className="px-1 py-0.5 text-[9px] bg-background border border-border rounded">↑↓</kbd>
              <kbd className="px-1 py-0.5 text-[9px] bg-background border border-border rounded">Enter</kbd>
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
