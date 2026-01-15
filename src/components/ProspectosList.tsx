"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

const ESTADOS_PIPELINE = [
  { value: "NOVO", label: "Novo", color: "bg-gray-500", textColor: "text-gray-700", bgLight: "bg-gray-100" },
  { value: "CONTACTADO", label: "Contactado", color: "bg-blue-500", textColor: "text-blue-700", bgLight: "bg-blue-100" },
  { value: "REUNIAO", label: "Reunião", color: "bg-yellow-500", textColor: "text-yellow-700", bgLight: "bg-yellow-100" },
  { value: "PROPOSTA", label: "Proposta", color: "bg-orange-500", textColor: "text-orange-700", bgLight: "bg-orange-100" },
  { value: "NEGOCIACAO", label: "Negociação", color: "bg-purple-500", textColor: "text-purple-700", bgLight: "bg-purple-100" },
  { value: "GANHO", label: "Ganho", color: "bg-green-500", textColor: "text-green-700", bgLight: "bg-green-100" },
  { value: "PERDIDO", label: "Perdido", color: "bg-red-500", textColor: "text-red-700", bgLight: "bg-red-100" },
]

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
  const [prospectos, setProspectos] = useState<Prospecto[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState<string>("")
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetchProspectos()
  }, [filtroEstado, search])

  async function fetchProspectos() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filtroEstado) params.set("estado", filtroEstado)
      if (search) params.set("search", search)
      params.set("ativo", "true")

      const res = await fetch(`/api/prospectos?${params}`)
      if (res.ok) {
        const data = await res.json()
        setProspectos(data)
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
    if (!confirm("Tem certeza que deseja arquivar este prospecto?")) return

    try {
      const res = await fetch(`/api/prospectos/${id}`, {
        method: "DELETE",
      })
      if (res.ok) {
        fetchProspectos()
      }
    } catch (error) {
      console.error("Error deleting prospecto:", error)
    }
  }

  const getEstadoInfo = (estado: string) => {
    return ESTADOS_PIPELINE.find((e) => e.value === estado) || ESTADOS_PIPELINE[0]
  }

  const stats = ESTADOS_PIPELINE.map((estado) => ({
    ...estado,
    count: prospectos.filter((p) => p.estado === estado.value).length,
  }))

  return (
    <div>
      {/* Pipeline Stats - Horizontal scroll */}
      <div className="mb-4 md:mb-6">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {stats.map((estado) => (
            <button
              key={estado.value}
              onClick={() => setFiltroEstado(filtroEstado === estado.value ? "" : estado.value)}
              className={`flex-shrink-0 px-3 py-2 rounded-lg transition ${
                filtroEstado === estado.value
                  ? `${estado.bgLight} ring-2 ring-offset-1 ring-${estado.color.replace("bg-", "")}`
                  : "bg-card hover:bg-secondary"
              }`}
            >
              <div className={`text-lg md:text-xl font-bold ${estado.textColor}`}>{estado.count}</div>
              <div className="text-[10px] md:text-xs text-muted-foreground whitespace-nowrap">{estado.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-2 mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Pesquisar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-0 px-3 py-2 border-2 border-border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-foreground font-medium bg-card text-sm"
          />
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="px-2 py-2 border-2 border-border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-foreground font-medium bg-card text-sm"
          >
            <option value="">Todos</option>
            {ESTADOS_PIPELINE.map((estado) => (
              <option key={estado.value} value={estado.value}>
                {estado.label}
              </option>
            ))}
          </select>
        </div>
        <Link
          href="/prospectos/novo"
          className="bg-purple-600 text-white px-4 py-2.5 rounded-lg font-bold hover:bg-purple-700 transition flex items-center justify-center gap-2 text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Novo Prospecto
        </Link>
      </div>

      {/* Prospectos List */}
      {loading ? (
        <div className="bg-card rounded-xl p-6 text-center">
          <svg className="w-6 h-6 animate-spin mx-auto text-purple-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
          <p className="mt-3 text-muted-foreground text-sm">A carregar...</p>
        </div>
      ) : prospectos.length === 0 ? (
        <div className="bg-card rounded-xl p-6 text-center">
          <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <p className="text-muted-foreground text-sm">Nenhum prospecto encontrado</p>
          <Link
            href="/prospectos/novo"
            className="inline-flex items-center gap-2 mt-3 text-purple-600 font-medium hover:underline text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Adicionar primeiro
          </Link>
        </div>
      ) : (
        <>
          {/* Mobile Cards */}
          <div className="md:hidden space-y-2">
            {prospectos.map((prospecto) => {
              const estadoInfo = getEstadoInfo(prospecto.estado)
              return (
                <div key={prospecto.id} className="bg-card rounded-lg p-3 shadow-sm">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Link href={`/prospectos/${prospecto.id}`} className="min-w-0 flex-1">
                      <div className="font-semibold text-foreground text-sm truncate">{prospecto.nomeEmpresa}</div>
                      {prospecto.tipoNegocio && (
                        <div className="text-xs text-muted-foreground truncate">{prospecto.tipoNegocio}</div>
                      )}
                    </Link>
                    <select
                      value={prospecto.estado}
                      onChange={(e) => handleEstadoChange(prospecto.id, e.target.value)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${estadoInfo.bgLight} ${estadoInfo.textColor} border-0 focus:ring-1 focus:ring-purple-500 flex-shrink-0`}
                    >
                      {ESTADOS_PIPELINE.map((estado) => (
                        <option key={estado.value} value={estado.value}>
                          {estado.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                    {prospecto.nomeContacto && (
                      <span className="truncate">{prospecto.nomeContacto}</span>
                    )}
                    {prospecto.cidade && (
                      <span className="truncate">{prospecto.cidade}</span>
                    )}
                  </div>

                  {prospecto.telefone && (
                    <a href={`tel:${prospecto.telefone}`} className="text-xs text-purple-600 font-medium">
                      {prospecto.telefone}
                    </a>
                  )}

                  <div className="flex items-center justify-end gap-1 mt-2 pt-2 border-t border-border">
                    <Link
                      href={`/prospectos/${prospecto.id}`}
                      className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded transition"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </Link>
                    <Link
                      href={`/prospectos/${prospecto.id}/editar`}
                      className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </Link>
                    <button
                      onClick={() => handleDelete(prospecto.id)}
                      className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                      </svg>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block bg-card rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-bold text-foreground">Empresa</th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-foreground">Contacto</th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-foreground">Cidade</th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-foreground">Estado</th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-foreground">Próxima Acção</th>
                    <th className="px-4 py-3 text-right text-sm font-bold text-foreground">Acções</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {prospectos.map((prospecto) => {
                    const estadoInfo = getEstadoInfo(prospecto.estado)
                    return (
                      <tr key={prospecto.id} className="hover:bg-secondary/50 transition">
                        <td className="px-4 py-3">
                          <Link href={`/prospectos/${prospecto.id}`} className="hover:text-purple-600">
                            <div className="font-semibold text-foreground">{prospecto.nomeEmpresa}</div>
                            {prospecto.tipoNegocio && (
                              <div className="text-sm text-muted-foreground">{prospecto.tipoNegocio}</div>
                            )}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-foreground">{prospecto.nomeContacto || "-"}</div>
                          <div className="text-sm text-muted-foreground">{prospecto.telefone || prospecto.email || "-"}</div>
                        </td>
                        <td className="px-4 py-3 text-foreground">{prospecto.cidade || "-"}</td>
                        <td className="px-4 py-3">
                          <select
                            value={prospecto.estado}
                            onChange={(e) => handleEstadoChange(prospecto.id, e.target.value)}
                            className={`px-2 py-1 rounded text-sm font-medium ${estadoInfo.bgLight} ${estadoInfo.textColor} border-0 focus:ring-2 focus:ring-purple-500`}
                          >
                            {ESTADOS_PIPELINE.map((estado) => (
                              <option key={estado.value} value={estado.value}>
                                {estado.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          {prospecto.proximaAccao && (
                            <div className="text-sm text-foreground">{prospecto.proximaAccao}</div>
                          )}
                          {prospecto.dataProximaAccao && (
                            <div className="text-xs text-muted-foreground">
                              {new Date(prospecto.dataProximaAccao).toLocaleDateString("pt-PT")}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              href={`/prospectos/${prospecto.id}`}
                              className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </Link>
                            <Link
                              href={`/prospectos/${prospecto.id}/editar`}
                              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </Link>
                            <button
                              onClick={() => handleDelete(prospecto.id)}
                              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            >
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
        </>
      )}
    </div>
  )
}
