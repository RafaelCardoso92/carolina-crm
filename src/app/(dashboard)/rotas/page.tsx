"use client"

import RoutePlannerAdvanced from "@/components/RoutePlannerAdvanced"

export default function RotasPage() {
  return (
    <div>
      <div className="mb-4 md:mb-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-2">
              <svg className="w-5 h-5 md:w-6 md:h-6 lg:w-8 lg:h-8 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <span className="truncate">Planeamento de Rotas</span>
            </h1>
            <p className="text-muted-foreground mt-0.5 text-xs md:text-sm">Planear visitas a clientes e prospectos</p>
          </div>
        </div>
      </div>

      <RoutePlannerAdvanced />
    </div>
  )
}
