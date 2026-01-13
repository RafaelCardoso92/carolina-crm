"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"

const menuItems = [
  {
    href: "/",
    label: "Dashboard",
    description: "Visao geral",
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
  },
  {
    href: "/clientes",
    label: "Clientes",
    description: "Gerir clientes",
    icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
  },
  {
    href: "/vendas",
    label: "Vendas",
    description: "Registar vendas",
    icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
  },
  {
    href: "/cobrancas",
    label: "Cobrancas",
    description: "Gerir faturas",
    icon: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
  },
  {
    href: "/definicoes",
    label: "Definicoes",
    description: "Objetivos e premios",
    icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z"
  },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-72 bg-gradient-to-b from-purple-800 to-purple-900 text-white min-h-screen flex flex-col shadow-xl">
      {/* Header */}
      <div className="p-6 border-b border-purple-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-purple-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold">Carolina CRM</h1>
            <p className="text-purple-300 text-sm">Gestao de Vendas</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <p className="text-purple-400 text-xs font-semibold uppercase tracking-wider mb-4 px-4">Menu Principal</p>
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-4 px-4 py-3 rounded-xl transition ${
                    isActive
                      ? "bg-white text-purple-800 shadow-lg"
                      : "text-purple-100 hover:bg-purple-700/50"
                  }`}
                >
                  <div className={`p-2 rounded-lg ${isActive ? "bg-purple-100" : "bg-purple-700/30"}`}>
                    <svg className={`w-5 h-5 ${isActive ? "text-purple-600" : "text-purple-200"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                    </svg>
                  </div>
                  <div>
                    <span className={`font-semibold block ${isActive ? "text-purple-800" : "text-white"}`}>{item.label}</span>
                    <span className={`text-xs ${isActive ? "text-purple-600" : "text-purple-300"}`}>{item.description}</span>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Help Section */}
      <div className="p-4">
        <div className="bg-purple-700/30 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-semibold text-white">Precisa de ajuda?</span>
          </div>
          <p className="text-xs text-purple-300">Contacte o suporte para qualquer duvida.</p>
        </div>
      </div>

      {/* Logout */}
      <div className="p-4 border-t border-purple-700/50">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 px-4 py-3 w-full text-white bg-red-500/20 hover:bg-red-500/30 rounded-xl transition font-medium"
        >
          <svg className="w-5 h-5 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>Terminar Sessao</span>
        </button>
      </div>
    </aside>
  )
}
