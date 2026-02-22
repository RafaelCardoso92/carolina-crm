"use client"

import { Suspense } from "react"
import { useSession } from "next-auth/react"
import TarefasView from "./TarefasView"
import SellerTabs from "@/components/SellerTabs"

function TarefasContent() {
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "MASTERADMIN"

  return (
    <>
      {isAdmin && <SellerTabs />}
      <TarefasView />
    </>
  )
}

export default function TarefasPage() {
  return (
    <div>
      <div className="mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight text-foreground">Tarefas</h1>
        <p className="text-muted-foreground mt-1 text-xs md:text-sm">Gerir tarefas e lembretes</p>
      </div>

      <Suspense fallback={<div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
        <TarefasContent />
      </Suspense>
    </div>
  )
}
