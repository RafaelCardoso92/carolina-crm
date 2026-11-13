"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export interface BottomNavItem {
  href: string
  label: string
  icon: string
}

const MORE_ICON = "M4 6h16M4 12h16M4 18h16"

function Icon({ d }: { d: string }) {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={d} />
    </svg>
  )
}

// Phone-only tab bar (< md). "Mais" opens the existing sidebar drawer.
export default function BottomNav({ items, onMoreAction, moreOpen, badge = 0 }: {
  items: BottomNavItem[]
  onMoreAction: () => void
  moreOpen: boolean
  badge?: number
}) {
  const pathname = usePathname()
  const activeHref = items.find(i => i.href === "/" ? pathname === "/" : pathname.startsWith(i.href))?.href
  const tab = "relative flex-1 flex flex-col items-center justify-center gap-0.5 min-h-16 text-xs font-medium transition-colors"
  const on = "text-primary"
  const off = "text-muted-foreground hover:text-foreground"
  const marker = <span className="absolute top-0 inset-x-4 h-0.5 rounded-full bg-primary" aria-hidden="true" />

  return (
    <nav
      aria-label="Navegação principal"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-card border-t border-border shadow-[0_-1px_3px_rgba(0,0,0,0.05)] pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="flex">
        {items.map(item => {
          const active = !moreOpen && item.href === activeHref
          return (
            <li key={item.href} className="flex-1 flex">
              <Link href={item.href} aria-current={active ? "page" : undefined} className={`${tab} ${active ? on : off}`}>
                {active && marker}
                <Icon d={item.icon} />
                {item.label}
              </Link>
            </li>
          )
        })}
        <li className="flex-1 flex">
          <button
            type="button"
            onClick={onMoreAction}
            data-bottomnav-more
            aria-expanded={moreOpen}
            className={`${tab} ${moreOpen || !activeHref ? on : off}`}
          >
            {(moreOpen || !activeHref) && marker}
            <span className="relative">
              <Icon d={MORE_ICON} />
              {badge > 0 && (
                <span className="absolute -top-1 -right-2 px-1 min-w-[18px] text-[10px] leading-[18px] font-bold bg-red-600 text-white rounded-full text-center">
                  {badge > 99 ? "99+" : badge}
                </span>
              )}
            </span>
            Mais
          </button>
        </li>
      </ul>
    </nav>
  )
}
