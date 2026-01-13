"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

type ClienteData = {
  id?: string
  nome: string
  codigo: string | null
  telefone: string | null
  email: string | null
  morada: string | null
  notas: string | null
}

export default function ClienteForm({ cliente }: { cliente?: ClienteData }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const isEditing = !!cliente?.id

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const data = {
      nome: formData.get("nome") as string,
      codigo: formData.get("codigo") as string || null,
      telefone: formData.get("telefone") as string || null,
      email: formData.get("email") as string || null,
      morada: formData.get("morada") as string || null,
      notas: formData.get("notas") as string || null
    }

    try {
      const url = isEditing ? `/api/clientes/${cliente.id}` : "/api/clientes"
      const method = isEditing ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })

      if (res.ok) {
        router.push("/clientes")
        router.refresh()
      } else {
        const errorData = await res.json()
        setError(errorData.error || "Erro ao guardar cliente")
      }
    } catch {
      setError("Erro ao guardar cliente")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-8 max-w-2xl">
      <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        {isEditing ? "Editar Dados do Cliente" : "Dados do Novo Cliente"}
      </h2>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm mb-6 flex items-center gap-2 font-medium">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Nome do Cliente *
          </label>
          <input
            name="nome"
            type="text"
            required
            defaultValue={cliente?.nome || ""}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-gray-900 font-medium"
            placeholder="Nome completo do cliente"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Codigo
          </label>
          <input
            name="codigo"
            type="text"
            defaultValue={cliente?.codigo || ""}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-gray-900 font-medium"
            placeholder="Codigo de referencia"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Telefone
          </label>
          <input
            name="telefone"
            type="tel"
            defaultValue={cliente?.telefone || ""}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-gray-900 font-medium"
            placeholder="912 345 678"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Email
          </label>
          <input
            name="email"
            type="email"
            defaultValue={cliente?.email || ""}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-gray-900 font-medium"
            placeholder="cliente@email.com"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Morada
          </label>
          <input
            name="morada"
            type="text"
            defaultValue={cliente?.morada || ""}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-gray-900 font-medium"
            placeholder="Morada completa do cliente"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Notas
          </label>
          <textarea
            name="notas"
            rows={3}
            defaultValue={cliente?.notas || ""}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-gray-900 font-medium resize-none"
            placeholder="Notas sobre o cliente..."
          />
        </div>
      </div>

      <div className="flex gap-4 mt-8">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-purple-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              A guardar...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {isEditing ? "Guardar Alteracoes" : "Criar Cliente"}
            </>
          )}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 border-2 border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Cancelar
        </button>
      </div>
    </form>
  )
}
