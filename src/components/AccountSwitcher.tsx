"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

type ManagedUser = {
  id: string
  name: string | null
  email: string
  status: string
}

export default function AccountSwitcher() {
  const { data: session, update: updateSession } = useSession()
  const router = useRouter()

  const [managed, setManaged] = useState<ManagedUser[] | null>(null)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!session?.user?.id) return
    let cancelled = false
    fetch("/api/account-switcher")
      .then(r => r.ok ? r.json() : { managed: [] })
      .then(data => {
        if (!cancelled) setManaged(data.managed || [])
      })
      .catch(() => { if (!cancelled) setManaged([]) })
    return () => { cancelled = true }
  }, [session?.user?.id])

  if (!session?.user) return null
  if (managed === null) return null      // not loaded yet — render nothing
  if (managed.length === 0) return null  // user has no managed accounts

  const currentName = session.user.impersonating
    ? (session.user.impersonating.name || session.user.impersonating.email)
    : (session.user.name || session.user.email)

  const isOnSelf = !session.user.impersonating

  async function switchToSelf() {
    if (busy || isOnSelf) return
    setBusy(true)
    try {
      await fetch("/api/admin/impersonate", { method: "DELETE" })
      await updateSession({ impersonating: null })
      router.refresh()
    } finally {
      setBusy(false)
      setOpen(false)
    }
  }

  async function switchTo(targetId: string) {
    if (busy) return
    setBusy(true)
    try {
      const res = await fetch("/api/admin/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: targetId })
      })
      if (!res.ok) {
        console.error("Switch failed:", await res.text().catch(() => ""))
        return
      }
      const data = await res.json()
      await updateSession({ impersonating: data.impersonating })
      router.refresh()
    } finally {
      setBusy(false)
      setOpen(false)
    }
  }

  return (
    <div className="mb-2 relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        disabled={busy}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-sm transition disabled:opacity-50"
      >
        <span className="flex items-center gap-2 min-w-0">
          <svg className="w-4 h-4 flex-shrink-0 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7a4 4 0 118 0 4 4 0 01-8 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="truncate">{currentName}{isOnSelf ? " (eu)" : ""}</span>
        </span>
        <svg
          className={`w-4 h-4 flex-shrink-0 text-white/50 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-2 rounded-lg bg-sidebar border border-white/10 shadow-xl overflow-hidden">
          <button
            type="button"
            onClick={switchToSelf}
            disabled={busy || isOnSelf}
            className={`w-full text-left px-3 py-2 text-sm transition flex items-center gap-2 ${
              isOnSelf ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5 hover:text-white"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" aria-hidden />
            <span className="truncate">{session.user.name || session.user.email} (eu)</span>
            {isOnSelf && <span className="ml-auto text-[10px] text-white/40">ativo</span>}
          </button>

          {managed.map(m => {
            const isActive = session.user.impersonating?.id === m.id
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => switchTo(m.id)}
                disabled={busy || isActive}
                className={`w-full text-left px-3 py-2 text-sm border-t border-white/5 transition flex items-center gap-2 ${
                  isActive ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400" aria-hidden />
                <span className="truncate">{m.name || m.email}</span>
                {isActive && <span className="ml-auto text-[10px] text-white/40">ativo</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
