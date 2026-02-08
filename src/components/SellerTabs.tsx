"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"

interface Seller {
  id: string
  name: string | null
  email: string
  _count: {
    clientes: number
    prospectos: number
  }
}

interface SellerTabsProps {
  onSellerChange?: (sellerId: string | null) => void
}

export default function SellerTabs({ onSellerChange }: SellerTabsProps) {
  const [sellers, setSellers] = useState<Seller[]>([])
  const [loading, setLoading] = useState(true)
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  
  const selectedSeller = searchParams.get("seller")

  useEffect(() => {
    async function fetchSellers() {
      try {
        const res = await fetch("/api/sellers")
        if (res.ok) {
          const data = await res.json()
          setSellers(Array.isArray(data) ? data : (data.sellers || []))
        }
      } catch (error) {
        console.error("Error fetching sellers:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchSellers()
  }, [])

  function selectSeller(sellerId: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (sellerId) {
      params.set("seller", sellerId)
    } else {
      params.delete("seller")
    }
    router.push(`${pathname}?${params.toString()}`)
    onSellerChange?.(sellerId)
  }

  if (loading) {
    return (
      <div className="flex gap-2 mb-4 animate-pulse">
        <div className="h-9 w-20 bg-muted rounded-lg"></div>
        <div className="h-9 w-24 bg-muted rounded-lg"></div>
        <div className="h-9 w-24 bg-muted rounded-lg"></div>
      </div>
    )
  }

  if (sellers.length === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4 p-2 bg-muted/30 rounded-xl">
      <span className="text-sm text-muted-foreground px-2">Vendedor:</span>
      <button
        onClick={() => selectSeller(null)}
        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
          !selectedSeller
            ? "bg-primary text-white shadow-sm"
            : "bg-white text-foreground hover:bg-primary/10 border border-border"
        }`}
      >
        Todos
      </button>
      {sellers.map(seller => (
        <button
          key={seller.id}
          onClick={() => selectSeller(seller.id)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
            selectedSeller === seller.id
              ? "bg-primary text-white shadow-sm"
              : "bg-white text-foreground hover:bg-primary/10 border border-border"
          }`}
        >
          {seller.name || seller.email.split("@")[0]}
        </button>
      ))}
    </div>
  )
}
