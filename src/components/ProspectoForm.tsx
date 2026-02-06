"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useJsApiLoader } from "@react-google-maps/api"
import { GOOGLE_MAPS_CONFIG } from "@/lib/google-maps"

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
  const [error, setError] = useState("")

  // Address state
  const [morada, setMorada] = useState(prospecto?.morada || "")
  const [cidade, setCidade] = useState(prospecto?.cidade || "")
  const [codigoPostal, setCodigoPostal] = useState(prospecto?.codigoPostal || "")
  const [coordinates, setCoordinates] = useState<{ lat: number | null; lng: number | null }>({
    lat: prospecto?.latitude || null,
    lng: prospecto?.longitude || null,
  })

  // Places autocomplete
  const searchInputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const { isLoaded } = useJsApiLoader(GOOGLE_MAPS_CONFIG)

  const isEditing = !!prospecto?.id

  // Initialize Google Places Autocomplete
  useEffect(() => {
    if (!isLoaded || !searchInputRef.current) return

    const autocomplete = new google.maps.places.Autocomplete(searchInputRef.current, {
      componentRestrictions: { country: "pt" },
      fields: ["address_components", "geometry", "name", "formatted_address", "formatted_phone_number", "website"],
      types: ["establishment", "geocode"],
    })

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace()
      if (!place.geometry?.location) return

      // Extract address components
      let streetNumber = ""
      let street = ""
      let city = ""
      let postalCode = ""

      place.address_components?.forEach((component) => {
        const types = component.types
        if (types.includes("street_number")) {
          streetNumber = component.long_name
        } else if (types.includes("route")) {
          street = component.long_name
        } else if (types.includes("locality") || types.includes("administrative_area_level_2")) {
          city = component.long_name
        } else if (types.includes("postal_code")) {
          postalCode = component.long_name
        }
      })

      // Build full address
      const fullStreet = streetNumber ? `${street}, ${streetNumber}` : street

      setMorada(fullStreet || place.formatted_address || "")
      setCidade(city)
      setCodigoPostal(postalCode)
      setCoordinates({
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      })

      // Clear search input after selection
      if (searchInputRef.current) {
        searchInputRef.current.value = ""
      }
    })

    autocompleteRef.current = autocomplete

    return () => {
      google.maps.event.clearInstanceListeners(autocomplete)
    }
  }, [isLoaded])

  // Manual geocode fallback
  const handleManualGeocode = useCallback(async () => {
    if (!morada && !cidade) {
      setError("Preencha a morada ou cidade")
      return
    }

    const fullAddress = [morada, cidade, codigoPostal, "Portugal"].filter(Boolean).join(", ")

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
        setError("Não foi possível obter as coordenadas")
      }
    } catch {
      setError("Erro ao obter coordenadas")
    }
  }, [morada, cidade, codigoPostal])

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
      morada,
      cidade,
      codigoPostal,
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
              placeholder="Ex: Salão de Beleza"
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

      {/* Location with Google Places Search */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Localização
        </h3>

        {/* Google Places Search Box */}
        <div className="mb-3">
          <label className="block text-xs font-bold text-foreground mb-1">
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              Pesquisar local (Google Maps)
            </span>
          </label>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Pesquise por nome do estabelecimento ou morada..."
            className="w-full px-3 py-2.5 border-2 border-blue-200 bg-blue-50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-foreground font-medium text-sm placeholder:text-blue-400"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Comece a escrever para pesquisar. Selecione um resultado para preencher automaticamente a morada.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-foreground mb-1">Morada</label>
            <input
              type="text"
              value={morada}
              onChange={(e) => setMorada(e.target.value)}
              className="w-full px-2.5 py-2 border-2 border-border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-foreground font-medium bg-card text-sm"
              placeholder="Morada"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1">Cidade</label>
            <input
              type="text"
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
              className="w-full px-2.5 py-2 border-2 border-border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-foreground font-medium bg-card text-sm"
              placeholder="Cidade"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1">Código Postal</label>
            <input
              type="text"
              value={codigoPostal}
              onChange={(e) => setCodigoPostal(e.target.value)}
              className="w-full px-2.5 py-2 border-2 border-border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-foreground font-medium bg-card text-sm"
              placeholder="1234-567"
            />
          </div>

          {/* Coordinates display and manual geocode */}
          <div className="md:col-span-2">
            {coordinates.lat && coordinates.lng ? (
              <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-green-700 font-medium">
                  Coordenadas: {coordinates.lat.toFixed(5)}, {coordinates.lng.toFixed(5)}
                </span>
                <button
                  type="button"
                  onClick={() => setCoordinates({ lat: null, lng: null })}
                  className="ml-auto text-xs text-green-600 hover:text-green-800"
                >
                  Limpar
                </button>
              </div>
            ) : (morada || cidade) ? (
              <button
                type="button"
                onClick={handleManualGeocode}
                className="w-full sm:w-auto px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition flex items-center justify-center gap-1.5 text-xs"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                Obter coordenadas da morada
              </button>
            ) : (
              <p className="text-xs text-muted-foreground">
                Use a pesquisa acima ou preencha a morada manualmente
              </p>
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
