"use client"

import { Suspense } from "react"
import { useSession } from "next-auth/react"
import VisitasView from "./VisitasView"
import SellerTabs from "@/components/SellerTabs"

function VisitasContent() {
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "MASTERADMIN"

  return (
    <>
      {isAdmin && <SellerTabs />}
      <VisitasView />
    </>
  )
}

function LoadingFallback() {
  return (
    <div className="flex justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  )
}

export default function VisitasPage() {
  return (
    <div>
      <div className="mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight text-foreground">Visitas</h1>
        <p className="text-muted-foreground mt-1 text-xs md:text-sm">Agendar e acompanhar visitas a clientes</p>
      </div>

      <Suspense fallback={<LoadingFallback />}>
        <VisitasContent />
      </Suspense>
    </div>
  )
}
