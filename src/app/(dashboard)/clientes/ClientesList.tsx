"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

type Cliente = {
  id: string
  nome: string
  codigo: string | null
  telefone: string | null
  email: string | null
  ativo: boolean
  _count: {
    vendas: number
    cobrancas: number
  }
}

export default function ClientesList({ clientes }: { clientes: Cliente[] }) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [showInactive, setShowInactive] = useState(false)

  const filtered = clientes.filter(c => {
    const matchSearch = c.nome.toLowerCase().includes(search.toLowerCase()) ||
      c.codigo?.toLowerCase().includes(search.toLowerCase())
    const matchActive = showInactive || c.ativo
    return matchSearch && matchActive
  })

  async function handleDelete(id: string, nome: string) {
    if (!confirm(`Tem a certeza que quer eliminar o cliente "${nome}"?`)) return

    try {
      const res = await fetch(`/api/clientes/${id}`, { method: "DELETE" })
      if (res.ok) {
        router.refresh()
      } else {
        alert("Erro ao eliminar cliente")
      }
    } catch {
      alert("Erro ao eliminar cliente")
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
      alert("Erro ao atualizar cliente")
    }
  }

  return (
    <div>
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex gap-4 items-center">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Pesquisar por nome ou codigo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="rounded text-purple-600 focus:ring-purple-500"
          />
          Mostrar inativos
        </label>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Nome</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Codigo</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Contacto</th>
              <th className="px-6 py-4 text-center text-sm font-medium text-gray-500">Vendas</th>
              <th className="px-6 py-4 text-center text-sm font-medium text-gray-500">Estado</th>
              <th className="px-6 py-4 text-right text-sm font-medium text-gray-500">Acoes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((cliente) => (
              <tr key={cliente.id} className={!cliente.ativo ? "bg-gray-50 opacity-60" : "hover:bg-gray-50"}>
                <td className="px-6 py-4">
                  <Link href={`/clientes/${cliente.id}`} className="font-medium text-gray-800 hover:text-purple-600">
                    {cliente.nome}
                  </Link>
                </td>
                <td className="px-6 py-4 text-gray-500">{cliente.codigo || "-"}</td>
                <td className="px-6 py-4 text-gray-500">
                  {cliente.telefone || cliente.email || "-"}
                </td>
                <td className="px-6 py-4 text-center text-gray-500">{cliente._count.vendas}</td>
                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() => handleToggleActive(cliente.id, cliente.ativo)}
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      cliente.ativo
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {cliente.ativo ? "Ativo" : "Inativo"}
                  </button>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/clientes/${cliente.id}`}
                      className="p-2 text-gray-400 hover:text-purple-600 transition"
                      title="Ver detalhes"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </Link>
                    <Link
                      href={`/clientes/${cliente.id}/editar`}
                      className="p-2 text-gray-400 hover:text-blue-600 transition"
                      title="Editar"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </Link>
                    <button
                      onClick={() => handleDelete(cliente.id, cliente.nome)}
                      className="p-2 text-gray-400 hover:text-red-600 transition"
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
          <div className="text-center py-12 text-gray-500">
            Nenhum cliente encontrado
          </div>
        )}
      </div>
    </div>
  )
}
