"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

const ESTADOS_PIPELINE = [
  { value: "NOVO", label: "Novo", color: "bg-gray-500" },
  { value: "CONTACTADO", label: "Contactado", color: "bg-blue-500" },
  { value: "REUNIAO", label: "Reunião", color: "bg-yellow-500" },
  { value: "PROPOSTA", label: "Proposta", color: "bg-orange-500" },
  { value: "NEGOCIACAO", label: "Negociação", color: "bg-purple-500" },
  { value: "GANHO", label: "Ganho", color: "bg-green-500" },
  { value: "PERDIDO", label: "Perdido", color: "bg-red-500" },
]

type ProspectoData = {
  id?: string
  nomeEmpresa: string
  tipoNegocio: string | null
  website: string | null
  facebook: string | null
  instagram: string | null
  nomeContacto: string | null
  cargoContacto: string | null
  telefone: string | null
  email: string | null
  morada: string | null
  cidade: string | null
  codigoPostal: string | null
  latitude: number | null
  longitude: number | null
  estado: string
  proximaAccao: string | null
  dataProximaAccao: string | null
  notas: string | null
  fonte: string | null
}

export default function ProspectoForm({ prospecto }: { prospecto?: ProspectoData }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [geocoding, setGeocoding] = useState(false)
  const [error, setError] = useState("")
  const [coordinates, setCoordinates] = useState<{ lat: number | null; lng: number | null }>({
    lat: prospecto?.latitude || null,
    lng: prospecto?.longitude || null,
  })

  const isEditing = !!prospecto?.id

  async function handleGeocode(e: React.MouseEvent) {
    e.preventDefault()
    setGeocoding(true)
    setError("")

    const form = e.currentTarget.closest("form")
    if (!form) return

    const formData = new FormData(form)
    const morada = formData.get("morada") as string
    const cidade = formData.get("cidade") as string
    const codigoPostal = formData.get("codigoPostal") as string

    const fullAddress = [morada, cidade, codigoPostal, "Portugal"]
      .filter(Boolean)
      .join(", ")

    if (!fullAddress || fullAddress === "Portugal") {
      setError("Preencha a morada para obter as coordenadas")
      setGeocoding(false)
      return
    }

    try {
      const res = await fetch("/api/prospectos/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: fullAddress }),
      })

      if (res.ok) {
        const data = await res.json()
        setCoordinates({ lat: data.latitude, lng: data.longitude })
      } else {
        const errorData = await res.json()
        setError(errorData.error || "Erro ao obter coordenadas")
      }
    } catch {
      setError("Erro ao obter coordenadas")
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
      nomeEmpresa: formData.get("nomeEmpresa") as string,
      tipoNegocio: formData.get("tipoNegocio") as string || null,
      website: formData.get("website") as string || null,
      facebook: formData.get("facebook") as string || null,
      instagram: formData.get("instagram") as string || null,
      nomeContacto: formData.get("nomeContacto") as string || null,
      cargoContacto: formData.get("cargoContacto") as string || null,
      telefone: formData.get("telefone") as string || null,
      email: formData.get("email") as string || null,
      morada: formData.get("morada") as string || null,
      cidade: formData.get("cidade") as string || null,
      codigoPostal: formData.get("codigoPostal") as string || null,
      latitude: coordinates.lat,
      longitude: coordinates.lng,
      estado: formData.get("estado") as string || "NOVO",
      proximaAccao: formData.get("proximaAccao") as string || null,
      dataProximaAccao: formData.get("dataProximaAccao") as string || null,
      notas: formData.get("notas") as string || null,
      fonte: formData.get("fonte") as string || null,
    }

    try {
      const url = isEditing ? `/api/prospectos/${prospecto.id}` : "/api/prospectos"
      const method = isEditing ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })

      if (res.ok) {
        router.push("/prospectos")
        router.refresh()
      } else {
        const errorData = await res.json()
        setError(errorData.error || "Erro ao guardar prospecto")
      }
    } catch {
      setError("Erro ao guardar prospecto")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card rounded-xl shadow-sm p-3 md:p-4 max-w-4xl">
      {error && (
        <div className="bg-red-50 text-red-700 p-2.5 rounded-lg text-xs mb-3 flex items-start gap-2 font-medium">
          <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Business Info */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          Empresa
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-foreground mb-1">Nome *</label>
            <input
              name="nomeEmpresa"
              type="text"
              required
              defaultValue={prospecto?.nomeEmpresa || ""}
              className="w-full px-2.5 py-2 border-2 border-border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-foreground font-medium bg-card text-sm"
              placeholder="Nome da empresa"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1">Tipo</label>
            <input
              name="tipoNegocio"
              type="text"
              defaultValue={prospecto?.tipoNegocio || ""}
              className="w-full px-2.5 py-2 border-2 border-border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-foreground font-medium bg-card text-sm"
              placeholder="Ex: Restaurante"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1">Fonte</label>
            <input
              name="fonte"
              type="text"
              defaultValue={prospecto?.fonte || ""}
              className="w-full px-2.5 py-2 border-2 border-border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-foreground font-medium bg-card text-sm"
              placeholder="Ex: Referência"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1">Website</label>
            <input
              name="website"
              type="url"
              defaultValue={prospecto?.website || ""}
              className="w-full px-2.5 py-2 border-2 border-border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-foreground font-medium bg-card text-sm"
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1">Instagram</label>
            <input
              name="instagram"
              type="text"
              defaultValue={prospecto?.instagram || ""}
              className="w-full px-2.5 py-2 border-2 border-border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-foreground font-medium bg-card text-sm"
              placeholder="@username"
            />
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Contacto
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-foreground mb-1">Nome</label>
            <input
              name="nomeContacto"
              type="text"
              defaultValue={prospecto?.nomeContacto || ""}
              className="w-full px-2.5 py-2 border-2 border-border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-foreground font-medium bg-card text-sm"
              placeholder="Nome"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1">Cargo</label>
            <input
              name="cargoContacto"
              type="text"
              defaultValue={prospecto?.cargoContacto || ""}
              className="w-full px-2.5 py-2 border-2 border-border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-foreground font-medium bg-card text-sm"
              placeholder="Ex: Gerente"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1">Telefone</label>
            <input
              name="telefone"
              type="tel"
              defaultValue={prospecto?.telefone || ""}
              className="w-full px-2.5 py-2 border-2 border-border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-foreground font-medium bg-card text-sm"
              placeholder="912 345 678"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1">Email</label>
            <input
              name="email"
              type="email"
              defaultValue={prospecto?.email || ""}
              className="w-full px-2.5 py-2 border-2 border-border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-foreground font-medium bg-card text-sm"
              placeholder="email@exemplo.com"
            />
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Localização
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-foreground mb-1">Morada</label>
            <input
              name="morada"
              type="text"
              defaultValue={prospecto?.morada || ""}
              className="w-full px-2.5 py-2 border-2 border-border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-foreground font-medium bg-card text-sm"
              placeholder="Morada"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1">Cidade</label>
            <input
              name="cidade"
              type="text"
              defaultValue={prospecto?.cidade || ""}
              className="w-full px-2.5 py-2 border-2 border-border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-foreground font-medium bg-card text-sm"
              placeholder="Cidade"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1">Código Postal</label>
            <input
              name="codigoPostal"
              type="text"
              defaultValue={prospecto?.codigoPostal || ""}
              className="w-full px-2.5 py-2 border-2 border-border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-foreground font-medium bg-card text-sm"
              placeholder="1234-567"
            />
          </div>

          <div className="md:col-span-2 flex flex-col sm:flex-row sm:items-center gap-2">
            <button
              type="button"
              onClick={handleGeocode}
              disabled={geocoding}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-1.5 text-xs"
            >
              {geocoding ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  A obter...
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  Obter Coordenadas
                </>
              )}
            </button>
            {coordinates.lat && coordinates.lng && (
              <span className="text-xs text-green-600 flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Pipeline */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Pipeline
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-foreground mb-1">Estado</label>
            <select
              name="estado"
              defaultValue={prospecto?.estado || "NOVO"}
              className="w-full px-2.5 py-2 border-2 border-border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-foreground font-medium bg-card text-sm"
            >
              {ESTADOS_PIPELINE.map((estado) => (
                <option key={estado.value} value={estado.value}>
                  {estado.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1">Próxima Acção</label>
            <input
              name="proximaAccao"
              type="text"
              defaultValue={prospecto?.proximaAccao || ""}
              className="w-full px-2.5 py-2 border-2 border-border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-foreground font-medium bg-card text-sm"
              placeholder="Ex: Ligar"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1">Data</label>
            <input
              name="dataProximaAccao"
              type="date"
              defaultValue={prospecto?.dataProximaAccao?.split("T")[0] || ""}
              className="w-full px-2.5 py-2 border-2 border-border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-foreground font-medium bg-card text-sm"
            />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="mb-4">
        <label className="block text-xs font-bold text-foreground mb-1">Notas</label>
        <textarea
          name="notas"
          rows={2}
          defaultValue={prospecto?.notas || ""}
          className="w-full px-2.5 py-2 border-2 border-border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-foreground font-medium resize-none bg-card text-sm"
          placeholder="Notas..."
        />
      </div>

      {/* Hidden fields */}
      <input name="facebook" type="hidden" defaultValue={prospecto?.facebook || ""} />
      <input name="cargoContacto" type="hidden" defaultValue={prospecto?.cargoContacto || ""} />

      {/* Buttons */}
      <div className="flex flex-col-reverse sm:flex-row gap-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border-2 border-border rounded-lg font-bold text-foreground hover:bg-secondary transition flex items-center justify-center gap-1.5 text-sm"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 sm:flex-none bg-purple-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-purple-700 transition disabled:opacity-50 flex items-center justify-center gap-1.5 text-sm"
        >
          {loading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              A guardar...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {isEditing ? "Guardar" : "Criar"}
            </>
          )}
        </button>
      </div>
    </form>
  )
}
