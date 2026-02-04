"use client"

import { useSession } from "next-auth/react"
import DashboardView from "./DashboardView"
import SellerTabs from "@/components/SellerTabs"
import { isAdminOrHigher } from "@/lib/permissions"
import { Suspense } from "react"

export default function DashboardPage() {
  const { data: session } = useSession()
  const showSellerTabs = session?.user?.role && isAdminOrHigher(session.user.role)

  return (
    <Suspense fallback={<div>A carregar...</div>}>
      {showSellerTabs && <SellerTabs />}
      <DashboardView />
    </Suspense>
  )
}
