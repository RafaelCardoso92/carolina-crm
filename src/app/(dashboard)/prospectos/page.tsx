"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import ProspectosList from "@/components/ProspectosList"
import ProspectosMap from "@/components/ProspectosMap"
import SellerTabs from "@/components/SellerTabs"

export default function ProspectosPage() {
  const [view, setView] = useState<"list" | "map">("list")
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "MASTERADMIN"

  return (
    <div>
      <div className="mb-4 md:mb-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight text-foreground">Prospectos</h1>
            <p className="text-muted-foreground mt-1 text-xs md:text-sm flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Gerir potenciais clientes
            </p>
          </div>

          {/* View Toggle - Always show text */}
          <div className="flex items-center bg-gradient-to-br from-slate-100 to-gray-100 dark:from-slate-800 dark:to-gray-800 rounded-xl p-1 flex-shrink-0 border border-border/50">
            <button
              onClick={() => setView("list")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-semibold transition text-xs md:text-sm ${
                view === "list"
                  ? "bg-card text-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              Lista
            </button>
            <button
              onClick={() => setView("map")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-semibold transition text-xs md:text-sm ${
                view === "map"
                  ? "bg-card text-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              Mapa
            </button>
          </div>
        </div>
      </div>

      {isAdmin && <SellerTabs />}

      {view === "list" ? <ProspectosList /> : <ProspectosMap />}
    </div>
  )
}
