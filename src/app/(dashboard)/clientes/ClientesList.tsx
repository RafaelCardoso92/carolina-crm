"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Swal from "sweetalert2"

type Cliente = {
  user?: { id: string; name: string | null; email: string } | null
  id: string
  nome: string
  codigo: string | null
  telefone: string | null
  email: string | null
  cidade: string | null
  ativo: boolean
  _count: {
    vendas: number
    cobrancas: number
  }
}

export default function ClientesList({ clientes, showSeller = false }: { clientes: Cliente[]; showSeller?: boolean }) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [showInactive, setShowInactive] = useState(false)
  const [cityFilter, setCityFilter] = useState("")

  // Get unique cities for the filter dropdown
  const uniqueCities = Array.from(
    new Set(clientes.map(c => c.cidade).filter((city): city is string => !!city))
  ).sort()

  const filtered = clientes.filter(c => {
    const matchSearch = c.nome.toLowerCase().includes(search.toLowerCase()) ||
      c.codigo?.toLowerCase().includes(search.toLowerCase())
    const matchActive = showInactive || c.ativo
    const matchCity = !cityFilter || c.cidade === cityFilter
    return matchSearch && matchActive && matchCity
  })

  async function handleDelete(id: string, nome: string) {
    const result = await Swal.fire({
      title: "Eliminar cliente?",
      text: `Tem a certeza que quer eliminar o cliente "${nome}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#c41e3a",
      cancelButtonColor: "#666666",
      confirmButtonText: "Sim, eliminar",
      cancelButtonText: "Cancelar"
    })

    if (!result.isConfirmed) return

    try {
      const res = await fetch(`/api/clientes/${id}`, { method: "DELETE" })
      if (res.ok) {
        router.refresh()
      } else {
        Swal.fire({
          icon: "error",
          title: "Erro",
          text: "Erro ao eliminar cliente",
          confirmButtonColor: "#b8860b"
        })
      }
    } catch {
      Swal.fire({
        icon: "error",
        title: "Erro",
        text: "Erro ao eliminar cliente",
        confirmButtonColor: "#b8860b"
      })
    }
  }

  async function handleToggleActive(id: string, ativo: boolean) {
    try {
      const res = await fetch(`/api/clientes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ativo: !ativo })
      })
      if (res.ok) {
        router.refresh()
      }
    } catch {
      Swal.fire({
        icon: "error",
        title: "Erro",
        text: "Erro ao atualizar cliente",
        confirmButtonColor: "#b8860b"
      })
    }
  }

  return (
    <div>
      {/* Search and Filter */}
      <div className="bg-card rounded-2xl shadow-sm p-3 md:p-4 mb-4 md:mb-6 border border-border">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center">
          <div className="flex-1 relative">
            <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Pesquisar por nome ou código..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-card text-foreground text-sm md:text-base"
            />
          </div>

          {/* City Filter */}
          {uniqueCities.length > 0 && (
            <div className="relative">
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="pl-9 pr-8 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-card text-foreground text-sm appearance-none cursor-pointer min-w-[140px]"
              >
                <option value="">Todas cidades</option>
                {uniqueCities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
              <svg className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          )}

          <label className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground whitespace-nowrap cursor-pointer hover:text-foreground transition-colors">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="rounded text-primary focus:ring-primary w-4 h-4"
            />
            Mostrar inativos
          </label>
        </div>

        {/* Active filters summary */}
        {(cityFilter || search || showInactive) && (
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-border">
            <span className="text-xs text-muted-foreground">Filtros:</span>
            {search && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-lg text-xs">
                "{search}"
                <button onClick={() => setSearch("")} className="hover:text-primary/70">×</button>
              </span>
            )}
            {cityFilter && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 rounded-lg text-xs">
                {cityFilter}
                <button onClick={() => setCityFilter("")} className="hover:opacity-70">×</button>
              </span>
            )}
            {showInactive && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 rounded-lg text-xs">
                Inativos
                <button onClick={() => setShowInactive(false)} className="hover:opacity-70">×</button>
              </span>
            )}
            <button
              onClick={() => { setSearch(""); setCityFilter(""); setShowInactive(false); }}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              Limpar tudo
            </button>
          </div>
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-card rounded-2xl shadow-sm overflow-hidden border border-border/50">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-secondary to-secondary/80 border-b border-border">
            <tr>
              <th className="px-4 lg:px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Nome</th>
              <th className="px-4 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Código</th>
              {showSeller && <th className="px-4 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Vendedor</th>}
              <th className="px-4 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider hidden xl:table-cell">Contacto</th>
              <th className="px-4 py-4 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider">Vendas</th>
              <th className="px-4 py-4 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider">Estado</th>
              <th className="px-4 py-4 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {filtered.map((cliente) => (
              <tr key={cliente.id} className={!cliente.ativo ? "bg-secondary opacity-60" : "hover:bg-table-row-hover"}>
                <td className="px-4 lg:px-6 py-4">
                  <Link href={`/clientes/${cliente.id}`} className="font-medium text-foreground hover:text-primary">
                    {cliente.nome}
                  </Link>
                  <span className="lg:hidden text-muted-foreground text-sm ml-2">
                    {cliente.codigo && `(${cliente.codigo})`}
                  </span>
                </td>
                <td className="px-4 py-4 text-muted-foreground hidden lg:table-cell">{cliente.codigo || "-"}</td>
                {showSeller && <td className="px-4 py-4 text-muted-foreground hidden md:table-cell"><span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">{cliente.user?.name || cliente.user?.email?.split("@")[0] || "-"}</span></td>}
                <td className="px-4 py-4 text-muted-foreground hidden xl:table-cell">
                  {cliente.telefone || cliente.email || "-"}
                </td>
                <td className="px-4 py-4 text-center text-muted-foreground">{cliente._count.vendas}</td>
                <td className="px-4 py-4 text-center">
                  <button
                    onClick={() => handleToggleActive(cliente.id, cliente.ativo)}
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      cliente.ativo
                        ? "bg-green-500/20 text-green-600 dark:text-green-400"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {cliente.ativo ? "Ativo" : "Inativo"}
                  </button>
                </td>
                <td className="px-4 py-4 text-right">
                  <div className="flex justify-end gap-1">
                    <Link
                      href={`/clientes/${cliente.id}`}
                      className="p-2 text-muted-foreground hover:text-primary transition"
                      title="Ver detalhes"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </Link>
                    <Link
                      href={`/clientes/${cliente.id}/editar`}
                      className="p-2 text-muted-foreground hover:text-blue-600 transition"
                      title="Editar"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </Link>
                    <button
                      onClick={() => handleDelete(cliente.id, cliente.nome)}
                      className="p-2 text-muted-foreground hover:text-red-600 transition"
                      title="Eliminar"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <svg className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-muted-foreground text-lg font-medium">Nenhum cliente encontrado</p>
            <p className="text-muted-foreground/70 text-sm mt-1">Tente ajustar os filtros de pesquisa</p>
          </div>
        )}
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {filtered.map((cliente) => (
          <div key={cliente.id} className={`bg-card rounded-2xl shadow-sm p-4 border border-border/50 hover:shadow-md transition-shadow ${!cliente.ativo ? "opacity-60" : ""}`}>
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1 min-w-0">
                <Link href={`/clientes/${cliente.id}`} className="font-semibold text-foreground hover:text-primary block truncate">
                  {cliente.nome}
                </Link>
                {cliente.codigo && (
                  <span className="text-muted-foreground text-xs">Código: {cliente.codigo}</span>
                )}
                {showSeller && cliente.user && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 ml-2">{cliente.user.name || cliente.user.email?.split("@")[0]}</span>
                )}
              </div>
              <button
                onClick={() => handleToggleActive(cliente.id, cliente.ativo)}
                className={`px-2 py-0.5 rounded-full text-xs font-medium ml-2 ${
                  cliente.ativo
                    ? "bg-green-500/20 text-green-600"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {cliente.ativo ? "Ativo" : "Inativo"}
              </button>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">{cliente._count.vendas}</span> vendas
              </div>
              <div className="flex gap-1">
                <Link
                  href={`/clientes/${cliente.id}`}
                  className="p-2 text-muted-foreground hover:text-primary transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </Link>
                <Link
                  href={`/clientes/${cliente.id}/editar`}
                  className="p-2 text-muted-foreground hover:text-blue-600 transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </Link>
                <button
                  onClick={() => handleDelete(cliente.id, cliente.nome)}
                  className="p-2 text-muted-foreground hover:text-red-600 transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-16 bg-card rounded-2xl border border-border/50">
            <svg className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-muted-foreground text-lg font-medium">Nenhum cliente encontrado</p>
            <p className="text-muted-foreground/70 text-sm mt-1">Tente ajustar os filtros de pesquisa</p>
          </div>
        )}
      </div>
    </div>
  )
}
