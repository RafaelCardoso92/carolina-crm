"use client"

import { useSession } from "next-auth/react"
import TarefasView from "./TarefasView"
import SellerTabs from "@/components/SellerTabs"

export default function TarefasPage() {
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "MASTERADMIN"

  return (
    <div>
      <div className="mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight text-foreground">Tarefas</h1>
        <p className="text-muted-foreground mt-1 text-xs md:text-sm">Gerir tarefas e lembretes</p>
      </div>
      
      {isAdmin && <SellerTabs />}
      
      <TarefasView />
    </div>
  )
}
