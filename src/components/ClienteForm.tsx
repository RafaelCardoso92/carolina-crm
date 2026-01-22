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
  cidade: string | null
  codigoPostal: string | null
  latitude: number | null
  longitude: number | null
  notas: string | null
}

export default function ClienteForm({ cliente }: { cliente?: ClienteData }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [geocoding, setGeocoding] = useState(false)
  const [error, setError] = useState("")
  const [coordinates, setCoordinates] = useState<{ lat: number | null; lng: number | null }>({
    lat: cliente?.latitude || null,
    lng: cliente?.longitude || null
  })

  const isEditing = !!cliente?.id

  async function handleGeocode(morada: string, cidade: string, codigoPostal: string) {
    if (!morada && !cidade) {
      setError("Preenche a morada ou cidade para geocodificar")
      return
    }

    setGeocoding(true)
    setError("")

    try {
      // Build full address
      const parts = [morada, cidade, codigoPostal, "Portugal"].filter(Boolean)
      const address = parts.join(", ")

      const res = await fetch("/api/clientes/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address })
      })

      const data = await res.json()

      if (data.latitude && data.longitude) {
        setCoordinates({ lat: data.latitude, lng: data.longitude })
      } else {
        setError(data.error || "Morada não encontrada")
      }
    } catch {
      setError("Erro ao geocodificar morada")
    } finally {
      setGeocoding(false)
    }
  }

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
      cidade: formData.get("cidade") as string || null,
      codigoPostal: formData.get("codigoPostal") as string || null,
      latitude: coordinates.lat,
      longitude: coordinates.lng,
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
    <form onSubmit={handleSubmit} className="bg-card rounded-2xl shadow-sm p-8 max-w-2xl">
      <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
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
          <label className="block text-sm font-bold text-foreground mb-2">
            Nome do Cliente *
          </label>
          <input
            name="nome"
            type="text"
            required
            defaultValue={cliente?.nome || ""}
            className="w-full px-4 py-3 border-2 border-border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-foreground font-medium bg-card"
            placeholder="Nome completo do cliente"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-foreground mb-2">
            Código
          </label>
          <input
            name="codigo"
            type="text"
            defaultValue={cliente?.codigo || ""}
            className="w-full px-4 py-3 border-2 border-border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-foreground font-medium bg-card"
            placeholder="Código de referência"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-foreground mb-2">
            Telefone
          </label>
          <input
            name="telefone"
            type="tel"
            defaultValue={cliente?.telefone || ""}
            className="w-full px-4 py-3 border-2 border-border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-foreground font-medium bg-card"
            placeholder="912 345 678"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-bold text-foreground mb-2">
            Email
          </label>
          <input
            name="email"
            type="email"
            defaultValue={cliente?.email || ""}
            className="w-full px-4 py-3 border-2 border-border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-foreground font-medium bg-card invalid:border-red-500"
            placeholder="cliente@email.com"
          />
        </div>

        {/* Location Section */}
        <div className="md:col-span-2 border-t border-border pt-6 mt-2">
          <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Localização
          </h3>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-bold text-foreground mb-2">
            Morada
          </label>
          <input
            name="morada"
            type="text"
            defaultValue={cliente?.morada || ""}
            className="w-full px-4 py-3 border-2 border-border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-foreground font-medium bg-card"
            placeholder="Rua, numero, etc."
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-foreground mb-2">
            Cidade
          </label>
          <input
            name="cidade"
            type="text"
            defaultValue={cliente?.cidade || ""}
            className="w-full px-4 py-3 border-2 border-border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-foreground font-medium bg-card"
            placeholder="Lisboa"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-foreground mb-2">
            Código Postal
          </label>
          <input
            name="codigoPostal"
            type="text"
            defaultValue={cliente?.codigoPostal || ""}
            pattern="[0-9]{4}-[0-9]{3}"
            title="Formato: XXXX-XXX (ex: 1000-000)"
            className="w-full px-4 py-3 border-2 border-border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-foreground font-medium bg-card invalid:border-red-500"
            placeholder="1000-000"
          />
        </div>

        {/* Geocode Button */}
        <div className="md:col-span-2">
          <button
            type="button"
            onClick={() => {
              const form = document.querySelector("form") as HTMLFormElement
              const formData = new FormData(form)
              handleGeocode(
                formData.get("morada") as string || "",
                formData.get("cidade") as string || "",
                formData.get("codigoPostal") as string || ""
              )
            }}
            disabled={geocoding}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition disabled:opacity-50"
          >
            {geocoding ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                A geocodificar...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Obter Coordenadas
              </>
            )}
          </button>

          {coordinates.lat && coordinates.lng && (
            <div className="mt-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
              <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Coordenadas obtidas
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-1">
                Lat: {coordinates.lat.toFixed(6)}, Lng: {coordinates.lng.toFixed(6)}
              </p>
            </div>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-bold text-foreground mb-2">
            Notas
          </label>
          <textarea
            name="notas"
            rows={3}
            defaultValue={cliente?.notas || ""}
            className="w-full px-4 py-3 border-2 border-border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-foreground font-medium resize-none bg-card"
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
              {isEditing ? "Guardar Alterações" : "Criar Cliente"}
            </>
          )}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 border-2 border-border rounded-xl font-bold text-foreground hover:bg-secondary transition flex items-center gap-2"
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
