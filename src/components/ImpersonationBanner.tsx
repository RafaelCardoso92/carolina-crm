"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

export default function ImpersonationBanner() {
  const { data: session, update: updateSession } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  // Add padding to body when banner is visible
  useEffect(() => {
    if (session?.user?.impersonating) {
      document.documentElement.style.setProperty("--impersonation-banner-height", "44px")
    } else {
      document.documentElement.style.setProperty("--impersonation-banner-height", "0px")
    }
  }, [session?.user?.impersonating])

  if (!session?.user?.impersonating) {
    return null
  }

  const handleStopImpersonating = async () => {
    if (loading) return

    setLoading(true)
    try {
      await fetch("/api/admin/impersonate", { method: "DELETE" })

      // Update session to remove impersonation
      await updateSession({
        impersonating: null
      })

      router.refresh()
      router.push("/admin/usuarios")
    } catch (error) {
      console.error("Error stopping impersonation:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-red-600 text-white py-2 px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <span className="font-medium truncate">
            Visualizando como: {session.user.impersonating.name || session.user.impersonating.email}
          </span>
          <span className="text-red-200 hidden sm:inline">
            ({session.user.impersonating.email})
          </span>
        </div>
        <button
          onClick={handleStopImpersonating}
          disabled={loading}
          className="bg-white text-red-600 px-4 py-1 rounded-lg text-sm font-medium hover:bg-red-50 transition disabled:opacity-50 flex-shrink-0"
        >
          {loading ? "..." : "Parar"}
        </button>
      </div>
    </div>
  )
}
