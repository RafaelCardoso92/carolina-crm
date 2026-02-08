"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { useTheme } from "./ThemeProvider"
import { UserRole } from "@prisma/client"
import { useSellerFilter } from "@/contexts/SellerFilterContext"

interface MenuItem {
  href: string
  badge?: string
  label: string
  icon: string
  roles?: UserRole[]
}

interface MenuGroup {
  label: string
  items: MenuItem[]
}

// Organized menu structure with groups
const menuGroups: MenuGroup[] = [
  {
    label: "Principal",
    items: [
      {
        href: "/",
        label: "Dashboard",
        icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      },
      {
        href: "/tarefas",
        label: "Tarefas",
        icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
      },
    ]
  },
  {
    label: "Comercial",
    items: [
      {
        href: "/clientes",
        label: "Clientes",
        icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
      },
      {
        href: "/prospectos",
        label: "Prospectos",
        icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
      },
      {
        href: "/vendas",
        label: "Vendas",
        icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      },
      {
        href: "/orcamentos",
        label: "Orcamentos",
        icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      },
    ]
  },
  {
    label: "Financeiro",
    items: [
      {
        href: "/cobrancas",
        label: "Cobrancas",
        icon: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
      },
      {
        href: "/reconciliacao",
        label: "Reconciliacao",
        icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
      },
      {
        href: "/despesas",
        label: "Despesas",
        icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
        badge: "α"
      },
    ]
  },
  {
    label: "Operacional",
    items: [
      {
        href: "/rotas",
        label: "Rotas",
        icon: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
      },
      {
        href: "/mapa",
        label: "Mapa",
        icon: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z"
      },
      {
        href: "/produtos",
        label: "Produtos",
        icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
      },
      {
        href: "/campanhas",
        label: "Campanhas",
        icon: "M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
      },
    ]
  },
  {
    label: "Sistema",
    items: [
      {
        href: "/gestao",
        label: "Gestao",
        icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
        roles: ["ADMIN", "MASTERADMIN"]
      },
      {
        href: "/admin/usuarios",
        label: "Usuarios",
        icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
        roles: ["ADMIN", "MASTERADMIN"]
      },
      {
        href: "/definicoes",
        label: "Definicoes",
        icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      },
      {
        href: "/ficheiros",
        label: "Ficheiros",
        icon: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
      },
    ]
  },
]


// Seller Filter Dropdown Component
function SellerFilterDropdown() {
  const { sellers, selectedSellerId, setSelectedSellerId, isLoading, canFilter } = useSellerFilter()

  if (!canFilter) return null

  const selectedSeller = sellers.find(s => s.id === selectedSellerId)

  return (
    <div className="mb-3">
      <label className="block px-1 mb-1.5 text-[9px] font-medium uppercase tracking-wider text-white/30">
        Ver dados de
      </label>
      <select
        value={selectedSellerId || ""}
        onChange={(e) => setSelectedSellerId(e.target.value || null)}
        disabled={isLoading}
        className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/20 disabled:opacity-50"
      >
        <option value="" className="bg-sidebar text-white">Todos os vendedores</option>
        {sellers.map((seller) => (
          <option key={seller.id} value={seller.id} className="bg-sidebar text-white">
            {seller.name || seller.email}
          </option>
        ))}
      </select>
      {selectedSellerId && (
        <button
          onClick={() => setSelectedSellerId(null)}
          className="mt-1.5 w-full px-2 py-1 text-[10px] text-white/50 hover:text-white hover:bg-white/5 rounded transition"
        >
          Limpar filtro
        </button>
      )}
    </div>
  )
}

export default function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const userRole = session?.user?.role

  // Filter menu groups based on user role
  const filteredGroups = menuGroups.map(group => ({
    ...group,
    items: group.items.filter(item => {
      if (!item.roles) return true
      if (!userRole) return false
      return item.roles.includes(userRole)
    })
  })).filter(group => group.items.length > 0)

  // Close sidebar when route changes
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // Close sidebar on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false)
    }
    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [])

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  const cycleTheme = () => {
    if (theme === "light") setTheme("dark")
    else if (theme === "dark") setTheme("system")
    else setTheme("light")
  }

  const themeIcon = theme === "light"
    ? "M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
    : theme === "dark"
    ? "M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
    : "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"

  const themeLabel = theme === "light" ? "Claro" : theme === "dark" ? "Escuro" : "Sistema"

  const isImpersonating = session?.user?.impersonating

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Header with Logo */}
      <div className="flex-shrink-0 px-5 py-5 border-b border-white/10">
        <Link href="/" className="block">
          <span className="text-xl font-bold text-white tracking-tight block">Baborette</span>
          <p className="text-[10px] text-white/50 font-medium mt-0.5">CRM Professional v2.5</p>
        </Link>
      </div>

      {/* Navigation - Scrollable */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {filteredGroups.map((group, groupIndex) => (
          <div key={group.label} className={groupIndex > 0 ? "mt-6" : ""}>
            <span className="block px-3 mb-1.5 text-[9px] font-medium uppercase tracking-wider text-white/30">
              {group.label}
            </span>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                        isActive
                          ? "bg-white/10 text-white font-medium"
                          : "text-white/60 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <svg
                        className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-white" : "text-white/50 group-hover:text-white/70"}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                      </svg>
                      <span className="text-sm">{item.label}</span>
                      {item.badge && (
                        <span className="ml-1.5 px-1.5 py-0.5 text-[9px] font-bold bg-amber-500/20 text-amber-400 rounded">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="flex-shrink-0 p-3 border-t border-white/10">
        {/* Seller Filter - Only for ADMIN+ */}
        <SellerFilterDropdown />
        
        {/* User Card */}
        {session?.user && (
          <div className="flex items-center gap-3 px-3 py-2.5 mb-2 rounded-lg bg-white/5">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-semibold">
              {(session.user.name || session.user.email || "U")[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {session.user.name || session.user.email}
              </p>
              <p className="text-[10px] text-white/50">
                {session.user.role === "MASTERADMIN" ? "Master Admin" :
                 session.user.role === "ADMIN" ? "Admin" : "Vendedor"}
              </p>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={cycleTheme}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200"
            title={themeLabel}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={themeIcon} />
            </svg>
            <span className="text-xs font-medium">{themeLabel}</span>
          </button>

          <button
            onClick={() => {
              // Clear service worker cache before signing out
              if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({ type: "CLEAR_CACHE" })
              }
              signOut({ callbackUrl: "/login" })
            }}
            className="flex items-center justify-center px-3 py-2 text-white/60 hover:text-red-400 hover:bg-white/5 rounded-lg transition-all duration-200"
            title="Sair"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Header Bar */}
      <div className={`lg:hidden fixed left-0 right-0 z-40 bg-sidebar border-b border-white/10 ${isImpersonating ? "top-11" : "top-0"}`}>
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center">
            <span className="text-lg font-bold text-white">Baborette</span>
          </Link>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`lg:hidden fixed left-0 w-64 bg-sidebar z-50 transform transition-transform duration-300 ease-out shadow-2xl ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } ${isImpersonating ? "top-11 h-[calc(100%-2.75rem)]" : "top-0 h-full"}`}
      >
        {sidebarContent}
      </aside>

      {/* Desktop Sidebar - Fixed to viewport height */}
      <aside className={`hidden lg:block w-56 bg-sidebar sticky border-r border-sidebar-border ${isImpersonating ? "top-11 h-[calc(100vh-2.75rem)]" : "top-0 h-screen"}`}>
        {sidebarContent}
      </aside>
    </>
  )
}
