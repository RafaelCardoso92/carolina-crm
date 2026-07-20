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
      {/* Heading renders inside TarefasView (with the + Nova Tarefa button) */}
      <Suspense fallback={<div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
        <TarefasContent />
      </Suspense>
    </div>
  )
}
