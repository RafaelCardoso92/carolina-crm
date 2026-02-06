"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useJsApiLoader } from "@react-google-maps/api"
import { GOOGLE_MAPS_CONFIG } from "@/lib/google-maps"

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
  const [error, setError] = useState("")

  // Address state
  const [morada, setMorada] = useState(cliente?.morada || "")
  const [cidade, setCidade] = useState(cliente?.cidade || "")
  const [codigoPostal, setCodigoPostal] = useState(cliente?.codigoPostal || "")
  const [coordinates, setCoordinates] = useState<{ lat: number | null; lng: number | null }>({
    lat: cliente?.latitude || null,
    lng: cliente?.longitude || null,
  })

  // Places autocomplete
  const searchInputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const { isLoaded } = useJsApiLoader(GOOGLE_MAPS_CONFIG)

  const isEditing = !!cliente?.id

  // Initialize Google Places Autocomplete
  useEffect(() => {
    if (!isLoaded || !searchInputRef.current) return

    const autocomplete = new google.maps.places.Autocomplete(searchInputRef.current, {
      componentRestrictions: { country: "pt" },
      fields: ["address_components", "geometry", "name", "formatted_address"],
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
      const res = await fetch("/api/clientes/geocode", {
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
      nome: formData.get("nome") as string,
      codigo: formData.get("codigo") as string || null,
      telefone: formData.get("telefone") as string || null,
      email: formData.get("email") as string || null,
      morada,
      cidade,
      codigoPostal,
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
            className="w-full px-4 py-3 border-2 border-border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-foreground font-medium bg-card"
            placeholder="cliente@email.com"
          />
        </div>

        {/* Location with Google Places Search */}
        <div className="md:col-span-2 border-t pt-6 mt-2">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Localização
          </h3>

          {/* Google Places Search Box */}
          <div className="mb-4">
            <label className="block text-sm font-bold text-foreground mb-2">
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                Pesquisar local (Google Maps)
              </span>
            </label>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Pesquise por nome do estabelecimento ou morada..."
              className="w-full px-4 py-3 border-2 border-blue-200 bg-blue-50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-foreground font-medium placeholder:text-blue-400"
            />
            <p className="text-xs text-muted-foreground mt-1.5">
              Comece a escrever para pesquisar. Selecione um resultado para preencher automaticamente a morada.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-foreground mb-2">Morada</label>
              <input
                type="text"
                value={morada}
                onChange={(e) => setMorada(e.target.value)}
                className="w-full px-4 py-3 border-2 border-border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-foreground font-medium bg-card"
                placeholder="Morada completa do cliente"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-foreground mb-2">Cidade</label>
              <input
                type="text"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                className="w-full px-4 py-3 border-2 border-border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-foreground font-medium bg-card"
                placeholder="Cidade"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-foreground mb-2">Código Postal</label>
              <input
                type="text"
                value={codigoPostal}
                onChange={(e) => setCodigoPostal(e.target.value)}
                className="w-full px-4 py-3 border-2 border-border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-foreground font-medium bg-card"
                placeholder="1234-567"
              />
            </div>

            {/* Coordinates display and manual geocode */}
            <div className="md:col-span-2">
              {coordinates.lat && coordinates.lng ? (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-green-700 font-medium">
                    Coordenadas: {coordinates.lat.toFixed(5)}, {coordinates.lng.toFixed(5)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCoordinates({ lat: null, lng: null })}
                    className="ml-auto text-sm text-green-600 hover:text-green-800 font-medium"
                  >
                    Limpar
                  </button>
                </div>
              ) : (morada || cidade) ? (
                <button
                  type="button"
                  onClick={handleManualGeocode}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition flex items-center gap-2 text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  Obter coordenadas da morada
                </button>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Use a pesquisa acima ou preencha a morada manualmente
                </p>
              )}
            </div>
          </div>
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
