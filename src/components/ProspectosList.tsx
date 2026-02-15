"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import Swal from "sweetalert2"
import { useEstadoColors } from "@/hooks/useEstadoColors"
import EstadoColorSettings from "./EstadoColorSettings"

const ESTADO_VALUES = ["NOVO", "CONTACTADO", "REUNIAO", "PROPOSTA", "NEGOCIACAO", "GANHO", "PERDIDO"]

type Prospecto = {
  id: string
  nomeEmpresa: string
  tipoNegocio: string | null
  nomeContacto: string | null
  telefone: string | null
  email: string | null
  cidade: string | null
  estado: string
  proximaAccao: string | null
  dataProximaAccao: string | null
  createdAt: string
}

export default function ProspectosList() {
  const searchParams = useSearchParams()
  const seller = searchParams.get("seller")
  const [prospectos, setProspectos] = useState<Prospecto[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState<string>("")
  const [search, setSearch] = useState("")
  const [cityFilter, setCityFilter] = useState("")
  const [showColorSettings, setShowColorSettings] = useState(false)

  const { colors, getColor, getLabel } = useEstadoColors()

  useEffect(() => {
    fetchProspectos()
  }, [filtroEstado, search, seller])

  async function fetchProspectos() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filtroEstado) params.set("estado", filtroEstado)
      if (search) params.set("search", search)
      params.set("ativo", "true")
      if (seller) params.set("seller", seller)
      params.set("limit", "1000")
      const res = await fetch(`/api/prospectos?${params}`)
      if (res.ok) {
        const data = await res.json()
        const list = Array.isArray(data) ? data : (data?.data || [])
        setProspectos(list)
      }
    } catch (error) {
      console.error("Error fetching prospectos:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleEstadoChange(id: string, novoEstado: string) {
    try {
      const res = await fetch(`/api/prospectos/${id}/estado`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: novoEstado }),
      })
      if (res.ok) {
        fetchProspectos()
      }
    } catch (error) {
      console.error("Error updating estado:", error)
    }
  }

  async function handleDelete(id: string) {
    const result = await Swal.fire({
      title: "Arquivar prospecto?",
      text: "Este prospecto sera arquivado e nao aparecera na lista.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#8b5cf6",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sim, arquivar",
      cancelButtonText: "Cancelar"
    })
    if (!result.isConfirmed) return
    try {
      const res = await fetch(`/api/prospectos/${id}`, { method: "DELETE" })
      if (res.ok) fetchProspectos()
    } catch (error) {
      console.error("Error deleting prospecto:", error)
    }
  }

  // Get unique cities
  const uniqueCities = Array.from(
    new Set(prospectos.map(p => p.cidade).filter((city): city is string => !!city))
  ).sort()

  // Filter by city
  const filteredProspectos = cityFilter
    ? prospectos.filter(p => p.cidade === cityFilter)
    : prospectos

  const stats = colors.map((estado) => ({
    ...estado,
    count: prospectos.filter((p) => p.estado === estado.value).length,
  }))

  const totalValue = stats.reduce((acc, s) => acc + s.count, 0)

  return (
    <div className="space-y-4">
      {/* Pipeline Stats */}
      <div className="bg-card rounded-xl border border-border p-3 md:p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">Pipeline</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{totalValue} prospectos</span>
            <button
              onClick={() => setShowColorSettings(true)}
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition"
              title="Personalizar cores"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
            </button>
          </div>
        </div>
        <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
          {stats.map((estado) => (
            <button
              key={estado.value}
              onClick={() => setFiltroEstado(filtroEstado === estado.value ? "" : estado.value)}
              className={`relative flex flex-col items-center p-2 md:p-3 rounded-lg transition-all ${
                filtroEstado === estado.value
                  ? "ring-2 ring-offset-1 ring-offset-card"
                  : "bg-secondary/50 hover:bg-secondary"
              }`}
              style={{
                backgroundColor: filtroEstado === estado.value ? `${estado.color}15` : undefined,
                borderColor: filtroEstado === estado.value ? estado.color : undefined,
              }}
            >
              <div className="w-2 h-2 rounded-full mb-1.5" style={{ backgroundColor: estado.color }} />
              <span className="text-lg md:text-xl font-bold text-foreground">{estado.count}</span>
              <span className="text-[9px] md:text-[10px] text-muted-foreground text-center leading-tight">
                {estado.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-card rounded-xl border border-border p-3 md:p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Pesquisar empresa, contacto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-foreground bg-background text-sm"
            />
          </div>
          <div className="flex gap-2 flex-wrap md:flex-nowrap">
            <div className="relative flex-1 md:flex-none">
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="w-full md:w-auto pl-3 pr-8 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-foreground bg-background text-sm appearance-none cursor-pointer"
              >
                <option value="">Todos estados</option>
                {colors.map((estado) => (
                  <option key={estado.value} value={estado.value}>{estado.label}</option>
                ))}
              </select>
              <svg className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            {uniqueCities.length > 0 && (
              <div className="relative flex-1 md:flex-none">
                <select
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  className="w-full md:w-auto pl-3 pr-8 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-foreground bg-background text-sm appearance-none cursor-pointer"
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
            <Link
              href="/prospectos/novo"
              className="bg-purple-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-purple-700 transition flex items-center justify-center gap-2 text-sm whitespace-nowrap"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">Novo</span>
            </Link>
          </div>
        </div>
        {(filtroEstado || cityFilter || search) && (
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-border">
            <span className="text-xs text-muted-foreground">Filtros:</span>
            {search && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200 rounded-md text-xs">
                "{search}"
                <button onClick={() => setSearch("")} className="hover:opacity-70 ml-1">x</button>
              </span>
            )}
            {filtroEstado && (
              <span
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs text-white"
                style={{ backgroundColor: getColor(filtroEstado) }}
              >
                {getLabel(filtroEstado)}
                <button onClick={() => setFiltroEstado("")} className="hover:opacity-70 ml-1">x</button>
              </span>
            )}
            {cityFilter && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 rounded-md text-xs">
                {cityFilter}
                <button onClick={() => setCityFilter("")} className="hover:opacity-70 ml-1">x</button>
              </span>
            )}
            <button
              onClick={() => { setSearch(""); setFiltroEstado(""); setCityFilter(""); }}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              Limpar
            </button>
          </div>
        )}
      </div>

      {/* Prospectos List */}
      {loading ? (
        <div className="bg-card rounded-xl border border-border p-8 text-center">
          <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-3 text-muted-foreground text-sm">A carregar...</p>
        </div>
      ) : filteredProspectos.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-secondary rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <p className="text-foreground font-medium">Nenhum prospecto encontrado</p>
          <p className="text-sm text-muted-foreground mt-1">Ajuste os filtros ou adicione um novo prospecto</p>
          <Link
            href="/prospectos/novo"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Adicionar Prospecto
          </Link>
        </div>
      ) : (
        <>
          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {filteredProspectos.map((prospecto) => {
              const estadoColor = getColor(prospecto.estado)
              const estadoLabel = getLabel(prospecto.estado)
              const isOverdue = prospecto.dataProximaAccao && new Date(prospecto.dataProximaAccao) < new Date()

              return (
                <div key={prospecto.id} className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
                  <div className="h-1.5" style={{ backgroundColor: estadoColor }} />
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <Link href={`/prospectos/${prospecto.id}`} className="flex-1 min-w-0">
                        <h3 className="font-bold text-foreground text-base leading-tight hover:text-purple-600 transition">
                          {prospecto.nomeEmpresa}
                        </h3>
                        {prospecto.tipoNegocio && (
                          <p className="text-sm text-muted-foreground mt-0.5">{prospecto.tipoNegocio}</p>
                        )}
                      </Link>
                      <select
                        value={prospecto.estado}
                        onChange={(e) => handleEstadoChange(prospecto.id, e.target.value)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white border-0 focus:ring-2 focus:ring-purple-500"
                        style={{ backgroundColor: estadoColor }}
                      >
                        {colors.map((estado) => (
                          <option key={estado.value} value={estado.value}>{estado.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2 mb-3">
                      {prospecto.nomeContacto && (
                        <div className="flex items-center gap-2 text-sm text-foreground">
                          <div className="w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <span className="font-medium">{prospecto.nomeContacto}</span>
                        </div>
                      )}
                      {prospecto.cidade && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            </svg>
                          </div>
                          <span>{prospecto.cidade}</span>
                        </div>
                      )}
                    </div>

                    {(prospecto.proximaAccao || prospecto.dataProximaAccao) && (
                      <div className={`p-3 rounded-xl mb-3 ${isOverdue ? 'bg-red-600 dark:bg-red-700' : 'bg-secondary/70'}`}>
                        <div className="flex items-start gap-2">
                          <svg className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isOverdue ? 'text-white' : 'text-muted-foreground'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${isOverdue ? 'text-white' : 'text-foreground'}`}>
                              {prospecto.proximaAccao || "Ação pendente"}
                            </p>
                            {prospecto.dataProximaAccao && (
                              <p className={`text-xs mt-0.5 ${isOverdue ? 'text-red-100 font-semibold' : 'text-muted-foreground'}`}>
                                {new Date(prospecto.dataProximaAccao).toLocaleDateString("pt-PT", { weekday: 'short', day: 'numeric', month: 'short' })}
                                {isOverdue && " - ATRASADA"}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {prospecto.telefone && (
                      <a
                        href={`tel:${prospecto.telefone}`}
                        className="flex items-center justify-center gap-2 w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold text-sm transition mb-3"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        Ligar {prospecto.telefone}
                      </a>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <Link
                        href={`/prospectos/${prospecto.id}`}
                        className="flex items-center gap-2 px-3 py-2 text-muted-foreground hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition text-sm font-medium"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Ver
                      </Link>
                      <div className="flex items-center gap-1">
                        <Link href={`/prospectos/${prospecto.id}/editar`} className="p-2.5 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
                        <button onClick={() => handleDelete(prospecto.id)} className="p-2.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block bg-card rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-secondary/70 border-b border-border">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Empresa</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contacto</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cidade</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Estado</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Próxima Ação</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Accoes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredProspectos.map((prospecto) => {
                    const estadoColor = getColor(prospecto.estado)
                    const estadoLabel = getLabel(prospecto.estado)
                    const isOverdue = prospecto.dataProximaAccao && new Date(prospecto.dataProximaAccao) < new Date()

                    return (
                      <tr key={prospecto.id} className="hover:bg-secondary/30 transition">
                        <td className="px-4 py-3">
                          <Link href={`/prospectos/${prospecto.id}`} className="block hover:text-purple-600 transition">
                            <div className="font-medium text-foreground">{prospecto.nomeEmpresa}</div>
                            {prospecto.tipoNegocio && <div className="text-sm text-muted-foreground">{prospecto.tipoNegocio}</div>}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-foreground">{prospecto.nomeContacto || "-"}</div>
                          {prospecto.telefone && <a href={`tel:${prospecto.telefone}`} className="text-sm text-purple-600 hover:underline">{prospecto.telefone}</a>}
                          {!prospecto.telefone && prospecto.email && <div className="text-sm text-muted-foreground">{prospecto.email}</div>}
                        </td>
                        <td className="px-4 py-3 text-foreground">{prospecto.cidade || "-"}</td>
                        <td className="px-4 py-3">
                          <select
                            value={prospecto.estado}
                            onChange={(e) => handleEstadoChange(prospecto.id, e.target.value)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-white border-0 focus:ring-2 focus:ring-purple-500 cursor-pointer"
                            style={{ backgroundColor: estadoColor }}
                          >
                            {colors.map((estado) => (
                              <option key={estado.value} value={estado.value}>{estado.label}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          {prospecto.proximaAccao ? (
                            <div className={isOverdue ? 'text-red-600 dark:text-red-400' : 'text-foreground'}>
                              <div className="text-sm font-medium">{prospecto.proximaAccao}</div>
                              {prospecto.dataProximaAccao && (
                                <div className="text-xs text-muted-foreground">
                                  {new Date(prospecto.dataProximaAccao).toLocaleDateString("pt-PT")}
                                  {isOverdue && <span className="text-red-600 dark:text-red-400 ml-1">(Atrasada)</span>}
                                </div>
                              )}
                            </div>
                          ) : <span className="text-muted-foreground">-</span>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Link href={`/prospectos/${prospecto.id}`} className="p-2 text-muted-foreground hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition" title="Ver detalhes">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </Link>
                            <Link href={`/prospectos/${prospecto.id}/editar`} className="p-2 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition" title="Editar">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </Link>
                            <button onClick={() => handleDelete(prospecto.id)} className="p-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition" title="Arquivar">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <div className="text-center text-xs text-muted-foreground">
            {filteredProspectos.length} prospecto{filteredProspectos.length !== 1 ? 's' : ''} encontrado{filteredProspectos.length !== 1 ? 's' : ''}
          </div>
        </>
      )}

      {/* Color Settings Modal */}
      <EstadoColorSettings isOpen={showColorSettings} onClose={() => setShowColorSettings(false)} />
    </div>
  )
}
