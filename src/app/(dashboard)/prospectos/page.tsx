"use client"

import { useState } from "react"
import ProspectosList from "@/components/ProspectosList"
import ProspectosMap from "@/components/ProspectosMap"

export default function ProspectosPage() {
  const [view, setView] = useState<"list" | "map">("list")

  return (
    <div>
      <div className="mb-4 md:mb-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-2">
              <svg className="w-5 h-5 md:w-6 md:h-6 lg:w-8 lg:h-8 text-purple-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span className="truncate">Prospectos</span>
            </h1>
            <p className="text-muted-foreground mt-0.5 text-xs md:text-sm">Gerir potenciais clientes</p>
          </div>

          {/* View Toggle - Always show text */}
          <div className="flex items-center bg-secondary rounded-lg p-0.5 flex-shrink-0">
            <button
              onClick={() => setView("list")}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md font-medium transition text-xs md:text-sm ${
                view === "list"
                  ? "bg-card text-foreground shadow-sm"
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
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md font-medium transition text-xs md:text-sm ${
                view === "map"
                  ? "bg-card text-foreground shadow-sm"
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

      {view === "list" ? <ProspectosList /> : <ProspectosMap />}
    </div>
  )
}
