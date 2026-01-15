"use client"

import { useState, useCallback, useEffect } from "react"
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, Circle } from "@react-google-maps/api"
import Link from "next/link"

const ESTADOS_PIPELINE = [
  { value: "NOVO", label: "Novo", color: "#6B7280" },
  { value: "CONTACTADO", label: "Contactado", color: "#3B82F6" },
  { value: "REUNIAO", label: "Reunião", color: "#EAB308" },
  { value: "PROPOSTA", label: "Proposta", color: "#F97316" },
  { value: "NEGOCIACAO", label: "Negociação", color: "#A855F7" },
  { value: "GANHO", label: "Ganho", color: "#22C55E" },
  { value: "PERDIDO", label: "Perdido", color: "#EF4444" },
]

type Prospecto = {
  id: string
  nomeEmpresa: string
  tipoNegocio: string | null
  nomeContacto: string | null
  telefone: string | null
  email: string | null
  cidade: string | null
  morada: string | null
  estado: string
  latitude: number | null
  longitude: number | null
}

const defaultCenter = {
  lat: 39.3999,
  lng: -8.2245,
}

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
  styles: [
    {
      featureType: "poi",
      elementType: "labels",
      stylers: [{ visibility: "off" }],
    },
  ],
}

export default function ProspectosMap() {
  const [prospectos, setProspectos] = useState<Prospecto[]>([])
  const [selectedProspecto, setSelectedProspecto] = useState<Prospecto | null>(null)
  const [filtroEstado, setFiltroEstado] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [showLegend, setShowLegend] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  })

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        (error) => {
          console.error("Error getting location:", error)
          setLocationError("Não foi possível obter a localização")
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      )
    }
  }, [])

  useEffect(() => {
    fetchProspectos()
  }, [filtroEstado])

  async function fetchProspectos() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filtroEstado) params.set("estado", filtroEstado)
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

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map)
  }, [])

  const onUnmount = useCallback(() => {
    setMap(null)
  }, [])

  const prospectosWithCoords = prospectos.filter(
    (p) => p.latitude !== null && p.longitude !== null
  )

  // Fit bounds to show all markers including user location
  useEffect(() => {
    if (map && (prospectosWithCoords.length > 0 || userLocation)) {
      const bounds = new google.maps.LatLngBounds()

      prospectosWithCoords.forEach((p) => {
        if (p.latitude && p.longitude) {
          bounds.extend({ lat: p.latitude, lng: p.longitude })
        }
      })

      if (userLocation) {
        bounds.extend(userLocation)
      }

      if (prospectosWithCoords.length > 0 || userLocation) {
        map.fitBounds(bounds)

        const listener = google.maps.event.addListener(map, "idle", () => {
          const zoom = map.getZoom()
          if (zoom && zoom > 15) {
            map.setZoom(15)
          }
          google.maps.event.removeListener(listener)
        })
      }
    }
  }, [map, prospectosWithCoords, userLocation])

  const getEstadoInfo = (estado: string) => {
    return ESTADOS_PIPELINE.find((e) => e.value === estado) || ESTADOS_PIPELINE[0]
  }

  const getMarkerIcon = (estado: string) => {
    const estadoInfo = getEstadoInfo(estado)
    return {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: estadoInfo.color,
      fillOpacity: 1,
      strokeColor: "#ffffff",
      strokeWeight: 2,
      scale: 10,
    }
  }

  if (loadError) {
    return (
      <div className="bg-card rounded-xl p-6 text-center">
        <svg className="w-10 h-10 mx-auto text-red-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p className="text-red-600 font-medium text-sm">Erro ao carregar Google Maps</p>
        <p className="text-muted-foreground text-xs mt-1">Verifique a chave da API</p>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="bg-card rounded-xl p-6 text-center">
        <svg className="w-6 h-6 animate-spin mx-auto text-purple-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
        </svg>
        <p className="mt-3 text-muted-foreground text-sm">A carregar mapa...</p>
      </div>
    )
  }

  return (
    <div>
      {/* Filter and Legend */}
      <div className="flex items-center gap-2 mb-3">
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="flex-1 md:flex-none px-3 py-1.5 border-2 border-border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-foreground font-medium bg-card text-sm"
        >
          <option value="">Todos os estados</option>
          {ESTADOS_PIPELINE.map((estado) => (
            <option key={estado.value} value={estado.value}>
              {estado.label}
            </option>
          ))}
        </select>

        <button
          onClick={() => setShowLegend(!showLegend)}
          className="md:hidden p-1.5 border-2 border-border rounded-lg bg-card"
        >
          <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>

        {/* Desktop legend inline */}
        <div className="hidden md:flex flex-wrap gap-2 items-center">
          {ESTADOS_PIPELINE.map((estado) => (
            <div key={estado.value} className="flex items-center gap-1 text-xs">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: estado.color }}
              ></div>
              <span className="text-muted-foreground">{estado.label}</span>
            </div>
          ))}
          <div className="flex items-center gap-1 text-xs ml-2">
            <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow"></div>
            <span className="text-muted-foreground">Tu</span>
          </div>
        </div>
      </div>

      {/* Mobile legend */}
      {showLegend && (
        <div className="md:hidden flex flex-wrap gap-2 mb-3 p-2 bg-secondary rounded-lg">
          {ESTADOS_PIPELINE.map((estado) => (
            <div key={estado.value} className="flex items-center gap-1 text-xs">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: estado.color }}
              ></div>
              <span className="text-muted-foreground">{estado.label}</span>
            </div>
          ))}
          <div className="flex items-center gap-1 text-xs">
            <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow"></div>
            <span className="text-muted-foreground">A tua localização</span>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
        <span>{prospectosWithCoords.length}/{prospectos.length} no mapa</span>
        {userLocation && (
          <span className="text-blue-600">• Localização activa</span>
        )}
        {locationError && (
          <span className="text-yellow-600">• {locationError}</span>
        )}
      </div>

      {/* Map */}
      <div className="bg-card rounded-xl shadow-sm overflow-hidden">
        <GoogleMap
          mapContainerStyle={{
            width: "100%",
            height: "calc(100vh - 280px)",
            minHeight: "350px",
            maxHeight: "500px",
          }}
          center={userLocation || defaultCenter}
          zoom={userLocation ? 12 : 7}
          onLoad={onLoad}
          onUnmount={onUnmount}
          options={mapOptions}
        >
          {/* User location marker */}
          {userLocation && (
            <>
              <Circle
                center={userLocation}
                radius={100}
                options={{
                  fillColor: "#3B82F6",
                  fillOpacity: 0.2,
                  strokeColor: "#3B82F6",
                  strokeOpacity: 0.5,
                  strokeWeight: 1,
                }}
              />
              <Marker
                position={userLocation}
                icon={{
                  path: google.maps.SymbolPath.CIRCLE,
                  fillColor: "#3B82F6",
                  fillOpacity: 1,
                  strokeColor: "#ffffff",
                  strokeWeight: 3,
                  scale: 8,
                }}
                title="A tua localização"
              />
            </>
          )}

          {/* Prospecto markers */}
          {prospectosWithCoords.map((prospecto) => (
            <Marker
              key={prospecto.id}
              position={{
                lat: prospecto.latitude!,
                lng: prospecto.longitude!,
              }}
              icon={getMarkerIcon(prospecto.estado)}
              onClick={() => setSelectedProspecto(prospecto)}
              title={prospecto.nomeEmpresa}
            />
          ))}

          {selectedProspecto && selectedProspecto.latitude && selectedProspecto.longitude && (
            <InfoWindow
              position={{
                lat: selectedProspecto.latitude,
                lng: selectedProspecto.longitude,
              }}
              onCloseClick={() => setSelectedProspecto(null)}
            >
              <div className="p-1 min-w-[160px] max-w-[220px]">
                <h3 className="font-bold text-gray-900 text-sm mb-1">
                  {selectedProspecto.nomeEmpresa}
                </h3>
                {selectedProspecto.tipoNegocio && (
                  <p className="text-xs text-gray-600 mb-1">
                    {selectedProspecto.tipoNegocio}
                  </p>
                )}
                <span
                  className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium text-white mb-1"
                  style={{
                    backgroundColor: getEstadoInfo(selectedProspecto.estado).color,
                  }}
                >
                  {getEstadoInfo(selectedProspecto.estado).label}
                </span>
                {selectedProspecto.telefone && (
                  <p className="text-xs text-gray-600">{selectedProspecto.telefone}</p>
                )}
                <Link
                  href={`/prospectos/${selectedProspecto.id}`}
                  className="inline-block mt-1.5 text-xs text-purple-600 font-medium hover:underline"
                >
                  Ver detalhes →
                </Link>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </div>

      {/* No coordinates warning */}
      {prospectos.length > 0 && prospectosWithCoords.length === 0 && (
        <div className="mt-3 bg-yellow-50 text-yellow-800 p-3 rounded-lg text-xs">
          <p className="font-medium">Nenhum prospecto com localização</p>
          <p className="mt-0.5">
            Use o botão &quot;Obter Coordenadas&quot; ao editar um prospecto.
          </p>
        </div>
      )}
    </div>
  )
}
