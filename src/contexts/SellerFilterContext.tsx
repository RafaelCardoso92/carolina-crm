"use client"

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"

interface Seller {
  id: string
  name: string | null
  email: string
}

interface SellerFilterContextType {
  sellers: Seller[]
  selectedSellerId: string | null
  setSelectedSellerId: (id: string | null) => void
  isLoading: boolean
  canFilter: boolean
}

const SellerFilterContext = createContext<SellerFilterContextType>({
  sellers: [],
  selectedSellerId: null,
  setSelectedSellerId: () => {},
  isLoading: false,
  canFilter: false,
})

export function SellerFilterProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession()
  const [sellers, setSellers] = useState<Seller[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const userRole = session?.user?.role
  const canFilter = userRole === "ADMIN" || userRole === "MASTERADMIN"

  // Get selected seller from URL params
  const selectedSellerId = searchParams.get("seller")

  // Load sellers list for ADMIN/MASTERADMIN
  useEffect(() => {
    if (!canFilter) {
      setSellers([])
      return
    }

    setIsLoading(true)
    fetch("/api/sellers")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setSellers(data)
        }
      })
      .catch((err) => console.error("Error fetching sellers:", err))
      .finally(() => setIsLoading(false))
  }, [canFilter])

  // Update URL when seller changes
  const setSelectedSellerId = useCallback((id: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (id) {
      params.set("seller", id)
    } else {
      params.delete("seller")
    }
    router.push(`${pathname}?${params.toString()}`)
  }, [searchParams, router, pathname])

  return (
    <SellerFilterContext.Provider
      value={{
        sellers,
        selectedSellerId,
        setSelectedSellerId,
        isLoading,
        canFilter,
      }}
    >
      {children}
    </SellerFilterContext.Provider>
  )
}

export function useSellerFilter() {
  return useContext(SellerFilterContext)
}
