import Link from "next/link"
import type { ReactNode } from "react"

// Semantic accent only: green = done/good, amber = pending, red = overdue, primary = neutral, none = empty/zero
export type StatTone = "primary" | "good" | "pending" | "overdue" | "none"

const bar: Record<StatTone, string> = {
  primary: "border-l-primary",
  good: "border-l-green-600",
  pending: "border-l-amber-500",
  overdue: "border-l-red-600",
  none: "border-l-border",
}

export default function StatCard({ label, value, sub, tone = "primary", href, help }: {
  label: ReactNode
  value: ReactNode
  sub?: ReactNode
  tone?: StatTone
  href?: string
  help?: ReactNode
}) {
  const cls = `block bg-card rounded-xl border border-border border-l-4 ${bar[tone]} p-3 sm:p-4 min-w-0`
  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground leading-snug">{label}</p>
        {help}
      </div>
      <p className="mt-1 text-xl sm:text-2xl font-bold tabular-nums text-foreground leading-tight break-words">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground tabular-nums truncate">{sub}</p>}
    </>
  )
  return href
    ? <Link href={href} className={`${cls} hover:shadow-md hover:border-primary/40 transition-shadow`}>{body}</Link>
    : <div className={cls}>{body}</div>
}
