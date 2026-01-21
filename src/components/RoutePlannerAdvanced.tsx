"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { GoogleMap, useJsApiLoader, Marker, DirectionsRenderer, InfoWindow } from "@react-google-maps/api"

interface RouteLocation {
  id: string
  nome: string
  tipo: "cliente" | "prospecto"
  morada: string | null
  cidade: string | null
  codigoPostal: string | null
  latitude: number | null
  longitude: number | null
  telefone: string | null
  email: string | null
  codigo?: string | null
  estado?: string
  nomeContacto?: string | null
  tipoNegocio?: string | null
}

interface NearbyPlace {
  id: string
  name: string
  address: string | null
  latitude: number
  longitude: number
  distance: number
  type: "parking" | "gas_station"
  hasGPL?: boolean
  rating?: number
  openNow?: boolean
}

interface SavedRoute {
  id: string
  nome: string | null
  data: string
  origemLatitude: number
  origemLongitude: number
  origemEndereco: string | null
  locais: { id: string; tipo: string; ordem: number }[]
  distanciaTotal: string | null
  duracaoTotal: string | null
  concluida: boolean
}

interface StartingPoint {
  type: "gps" | "address"
  latitude: number | null
  longitude: number | null
  address: string
}

const mapContainerStyle = {
  width: "100%",
  height: "100%"
}

const defaultCenter = { lat: 38.7223, lng: -9.1393 }

const PIPELINE_STATES = [
  { value: "NOVO", label: "Novo", color: "bg-blue-100 text-blue-800" },
  { value: "CONTACTADO", label: "Contactado", color: "bg-cyan-100 text-cyan-800" },
  { value: "REUNIAO", label: "Reunião", color: "bg-purple-100 text-purple-800" },
  { value: "PROPOSTA", label: "Proposta", color: "bg-amber-100 text-amber-800" },
  { value: "NEGOCIACAO", label: "Negociação", color: "bg-orange-100 text-orange-800" },
  { value: "GANHO", label: "Ganho", color: "bg-green-100 text-green-800" },
  { value: "PERDIDO", label: "Perdido", color: "bg-red-100 text-red-800" },
]

export default function RoutePlannerAdvanced() {
  // Data state
  const [locations, setLocations] = useState<RouteLocation[]>([])
  const [cities, setCities] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>([])

  // Filter state
  const [filterCity, setFilterCity] = useState<string>("")
  const [filterType, setFilterType] = useState<"all" | "cliente" | "prospecto">("all")
  const [filterStates, setFilterStates] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  // Selection state
  const [selectedLocations, setSelectedLocations] = useState<string[]>([])
  const [startingPoint, setStartingPoint] = useState<StartingPoint>({
    type: "address",
    latitude: null,
    longitude: null,
    address: ""
  })

  // Route state
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null)
  const [optimizedRoute, setOptimizedRoute] = useState<RouteLocation[]>([])
  const [totalDistance, setTotalDistance] = useState<string>("")
  const [totalDuration, setTotalDuration] = useState<string>("")
  const [calculatingRoute, setCalculatingRoute] = useState(false)

  // Calendar/Date state
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0])
  const [routeName, setRouteName] = useState("")
  const [showSavedRoutes, setShowSavedRoutes] = useState(false)
  const [savingRoute, setSavingRoute] = useState(false)

  // Inline edit state
  const [editingLocation, setEditingLocation] = useState<string | null>(null)
  const [editAddress, setEditAddress] = useState({ morada: "", cidade: "", codigoPostal: "" })
  const [geocodingInline, setGeocodingInline] = useState(false)

  // Nearby places state
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([])
  const [loadingNearby, setLoadingNearby] = useState(false)
  const [nearbyPanelOpen, setNearbyPanelOpen] = useState(false)
  const [nearbySearchPoint, setNearbySearchPoint] = useState<{ lat: number; lng: number; index: number } | null>(null)
  const [nearbyType, setNearbyType] = useState<"parking" | "gas_station">("parking")

  // Batch geocode state
  const [batchGeocoding, setBatchGeocoding] = useState(false)
  const [geocodeStatus, setGeocodeStatus] = useState<{ total: number; withCoordinates: number; pendingGeocoding: number } | null>(null)

  // Map state
  const [selectedMarker, setSelectedMarker] = useState<RouteLocation | null>(null)

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""
  })

  // Fetch locations and geocode status
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [locResponse, statusResponse] = await Promise.all([
          fetch("/api/rotas/locations"),
          fetch("/api/clientes/batch-geocode")
        ])
        const locData = await locResponse.json()
        const statusData = await statusResponse.json()
        setLocations(locData.locations || [])
        setCities(locData.cities || [])
        setGeocodeStatus(statusData)
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Fetch saved routes for current month
  useEffect(() => {
    const fetchSavedRoutes = async () => {
      const date = new Date(selectedDate)
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1).toISOString()
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString()

      try {
        const response = await fetch(`/api/rotas/saved?startDate=${startOfMonth}&endDate=${endOfMonth}`)
        const data = await response.json()
        setSavedRoutes(data)
      } catch (error) {
        console.error("Error fetching saved routes:", error)
      }
    }
    fetchSavedRoutes()
  }, [selectedDate])

  // Get current GPS location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocalização não suportada pelo browser")
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setStartingPoint({
          type: "gps",
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          address: "Localização atual"
        })
      },
      (error) => {
        console.error("Geolocation error:", error)
        alert("Erro ao obter localização: " + error.message)
      }
    )
  }

  // Geocode address for starting point
  const geocodeStartingAddress = async () => {
    if (!startingPoint.address.trim()) return

    try {
      const response = await fetch("/api/clientes/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: startingPoint.address + ", Portugal" })
      })
      const data = await response.json()

      if (data.latitude && data.longitude) {
        setStartingPoint(prev => ({
          ...prev,
          latitude: data.latitude,
          longitude: data.longitude
        }))
      } else {
        alert("Morada não encontrada")
      }
    } catch (error) {
      console.error("Geocode error:", error)
      alert("Erro ao geocodificar morada")
    }
  }

  // Batch geocode all customers
  const runBatchGeocode = async () => {
    if (!confirm("Isto vai geocodificar todos os clientes sem coordenadas. Continuar?")) return

    setBatchGeocoding(true)
    try {
      const response = await fetch("/api/clientes/batch-geocode", { method: "POST" })
      const result = await response.json()
      alert(`Geocodificação completa!\nSucesso: ${result.success}\nFalhados: ${result.failed}`)

      // Refresh data
      const [locResponse, statusResponse] = await Promise.all([
        fetch("/api/rotas/locations"),
        fetch("/api/clientes/batch-geocode")
      ])
      const locData = await locResponse.json()
      const statusData = await statusResponse.json()
      setLocations(locData.locations || [])
      setGeocodeStatus(statusData)
    } catch (error) {
      console.error("Batch geocode error:", error)
      alert("Erro ao geocodificar clientes")
    } finally {
      setBatchGeocoding(false)
    }
  }

  // Inline geocode for a single location
  const geocodeInlineAddress = async (locationId: string, tipo: "cliente" | "prospecto") => {
    setGeocodingInline(true)
    try {
      const parts = [editAddress.morada, editAddress.cidade, editAddress.codigoPostal, "Portugal"].filter(Boolean)
      const address = parts.join(", ")

      const geocodeResponse = await fetch("/api/clientes/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address })
      })
      const geocodeData = await geocodeResponse.json()

      if (!geocodeData.latitude || !geocodeData.longitude) {
        alert("Morada não encontrada")
        return
      }

      // Update the location in database
      const endpoint = tipo === "cliente" ? `/api/clientes/${locationId}` : `/api/prospectos/${locationId}`
      await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          morada: editAddress.morada || undefined,
          cidade: editAddress.cidade || undefined,
          codigoPostal: editAddress.codigoPostal || undefined,
          latitude: geocodeData.latitude,
          longitude: geocodeData.longitude
        })
      })

      // Update local state
      setLocations(prev => prev.map(loc =>
        loc.id === locationId
          ? { ...loc, ...editAddress, latitude: geocodeData.latitude, longitude: geocodeData.longitude }
          : loc
      ))

      setEditingLocation(null)
      setEditAddress({ morada: "", cidade: "", codigoPostal: "" })
    } catch (error) {
      console.error("Inline geocode error:", error)
      alert("Erro ao geocodificar morada")
    } finally {
      setGeocodingInline(false)
    }
  }

  // Filtered locations
  const filteredLocations = useMemo(() => {
    return locations.filter(loc => {
      if (filterType !== "all" && loc.tipo !== filterType) return false
      if (filterCity && loc.cidade?.toLowerCase() !== filterCity.toLowerCase()) return false
      if (filterStates.length > 0 && loc.tipo === "prospecto") {
        if (!loc.estado || !filterStates.includes(loc.estado)) return false
      }
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        if (!loc.nome.toLowerCase().includes(query) &&
            !(loc.morada?.toLowerCase().includes(query)) &&
            !(loc.nomeContacto?.toLowerCase().includes(query))) {
          return false
        }
      }
      return true
    })
  }, [locations, filterType, filterCity, filterStates, searchQuery])

  const validLocations = useMemo(() => {
    return filteredLocations.filter(l => l.latitude && l.longitude)
  }, [filteredLocations])

  const locationsByCity = useMemo(() => {
    const grouped: Record<string, RouteLocation[]> = {}
    filteredLocations.forEach(loc => {
      const city = loc.cidade || "Sem cidade"
      if (!grouped[city]) grouped[city] = []
      grouped[city].push(loc)
    })
    return grouped
  }, [filteredLocations])

  const toggleLocation = (id: string) => {
    setSelectedLocations(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const selectAllInCity = (city: string) => {
    const cityLocations = locationsByCity[city] || []
    const cityIds = cityLocations.filter(l => l.latitude && l.longitude).map(l => l.id)
    const allSelected = cityIds.every(id => selectedLocations.includes(id))

    if (allSelected) {
      setSelectedLocations(prev => prev.filter(id => !cityIds.includes(id)))
    } else {
      setSelectedLocations(prev => [...new Set([...prev, ...cityIds])])
    }
  }

  // Calculate route
  const calculateRoute = useCallback(async () => {
    if (selectedLocations.length < 1) {
      alert("Seleciona pelo menos 1 local para visitar")
      return
    }

    if (!startingPoint.latitude || !startingPoint.longitude) {
      alert("Define um ponto de partida primeiro")
      return
    }

    setCalculatingRoute(true)

    const selected = validLocations.filter(l => selectedLocations.includes(l.id))
    if (selected.length === 0) {
      alert("Nenhum dos locais selecionados tem coordenadas")
      setCalculatingRoute(false)
      return
    }

    const directionsService = new google.maps.DirectionsService()

    const origin = { lat: startingPoint.latitude, lng: startingPoint.longitude }

    let destination: google.maps.LatLngLiteral
    let waypoints: google.maps.DirectionsWaypoint[] = []

    if (selected.length === 1) {
      destination = { lat: selected[0].latitude!, lng: selected[0].longitude! }
    } else {
      destination = { lat: selected[selected.length - 1].latitude!, lng: selected[selected.length - 1].longitude! }
      waypoints = selected.slice(0, -1).map(l => ({
        location: { lat: l.latitude!, lng: l.longitude! },
        stopover: true
      }))
    }

    try {
      const result = await directionsService.route({
        origin,
        destination,
        waypoints,
        optimizeWaypoints: waypoints.length > 0,
        travelMode: google.maps.TravelMode.DRIVING
      })

      setDirections(result)

      const route = result.routes[0]
      let distance = 0
      let duration = 0
      route.legs.forEach(leg => {
        distance += leg.distance?.value || 0
        duration += leg.duration?.value || 0
      })

      setTotalDistance(`${(distance / 1000).toFixed(1)} km`)
      setTotalDuration(`${Math.round(duration / 60)} min`)

      const waypointOrder = route.waypoint_order || []
      const optimized: RouteLocation[] = []

      if (waypoints.length > 0) {
        waypointOrder.forEach(i => optimized.push(selected[i]))
        optimized.push(selected[selected.length - 1])
      } else {
        optimized.push(selected[0])
      }

      setOptimizedRoute(optimized)
    } catch (error) {
      console.error("Directions error:", error)
      alert("Erro ao calcular rota. Verifica se os locais tem coordenadas válidas.")
    } finally {
      setCalculatingRoute(false)
    }
  }, [selectedLocations, validLocations, startingPoint])

  // Save route
  const saveRoute = async () => {
    if (optimizedRoute.length === 0) {
      alert("Calcula uma rota primeiro")
      return
    }

    setSavingRoute(true)
    try {
      const response = await fetch("/api/rotas/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: routeName || `Rota ${selectedDate}`,
          data: selectedDate,
          origemLatitude: startingPoint.latitude,
          origemLongitude: startingPoint.longitude,
          origemEndereco: startingPoint.address,
          locais: optimizedRoute.map((loc, i) => ({ id: loc.id, tipo: loc.tipo, ordem: i })),
          distanciaTotal: totalDistance,
          duracaoTotal: totalDuration
        })
      })

      if (response.ok) {
        const newRoute = await response.json()
        setSavedRoutes(prev => [...prev, newRoute])
        alert("Rota guardada com sucesso!")
        setRouteName("")
      } else {
        alert("Erro ao guardar rota")
      }
    } catch (error) {
      console.error("Save route error:", error)
      alert("Erro ao guardar rota")
    } finally {
      setSavingRoute(false)
    }
  }

  // Load saved route
  const loadSavedRoute = async (route: SavedRoute) => {
    setStartingPoint({
      type: "address",
      latitude: route.origemLatitude,
      longitude: route.origemLongitude,
      address: route.origemEndereco || ""
    })

    const locationIds = route.locais.map(l => l.id)
    setSelectedLocations(locationIds)
    setSelectedDate(route.data.split("T")[0])
    setRouteName(route.nome || "")
    setShowSavedRoutes(false)

    // Recalculate the route
    setTimeout(() => {
      calculateRoute()
    }, 500)
  }

  // Delete saved route
  const deleteSavedRoute = async (routeId: string) => {
    if (!confirm("Eliminar esta rota?")) return

    try {
      await fetch(`/api/rotas/saved/${routeId}`, { method: "DELETE" })
      setSavedRoutes(prev => prev.filter(r => r.id !== routeId))
    } catch (error) {
      console.error("Delete route error:", error)
      alert("Erro ao eliminar rota")
    }
  }

  // Find nearby places
  const findNearbyPlaces = async (lat: number, lng: number, type: "parking" | "gas_station", index: number) => {
    setLoadingNearby(true)
    setNearbyPanelOpen(true)
    setNearbySearchPoint({ lat, lng, index })
    setNearbyType(type)

    try {
      const response = await fetch("/api/rotas/nearby", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lng, type, radius: 2000 })
      })
      const data = await response.json()
      setNearbyPlaces(data.places || [])
    } catch (error) {
      console.error("Nearby places error:", error)
      alert("Erro ao procurar locais próximos")
    } finally {
      setLoadingNearby(false)
    }
  }

  // Generate navigation URL for Google Maps
  const getGoogleMapsUrl = () => {
    if (optimizedRoute.length === 0 || !startingPoint.latitude || !startingPoint.longitude) return ""

    const origin = `${startingPoint.latitude},${startingPoint.longitude}`
    const destination = `${optimizedRoute[optimizedRoute.length - 1].latitude},${optimizedRoute[optimizedRoute.length - 1].longitude}`

    let waypointsStr = ""
    if (optimizedRoute.length > 1) {
      waypointsStr = optimizedRoute.slice(0, -1).map(l => `${l.latitude},${l.longitude}`).join("|")
    }

    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypointsStr ? `&waypoints=${waypointsStr}` : ""}&travelmode=driving`
  }

  // Generate navigation URL for Waze
  const getWazeUrl = () => {
    if (optimizedRoute.length === 0) return ""
    // Waze only supports single destination, so use the first stop
    const firstStop = optimizedRoute[0]
    return `https://waze.com/ul?ll=${firstStop.latitude},${firstStop.longitude}&navigate=yes`
  }

  // Open navigation app
  const openNavigation = (app: "google" | "waze") => {
    const url = app === "google" ? getGoogleMapsUrl() : getWazeUrl()
    if (url) window.open(url, "_blank")
  }

  // Navigate to nearby place
  const navigateToPlace = (place: NearbyPlace, app: "google" | "waze") => {
    let url = ""
    if (app === "google") {
      url = `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}&travelmode=driving`
    } else {
      url = `https://waze.com/ul?ll=${place.latitude},${place.longitude}&navigate=yes`
    }
    window.open(url, "_blank")
  }

  // Clear route
  const clearRoute = () => {
    setDirections(null)
    setOptimizedRoute([])
    setTotalDistance("")
    setTotalDuration("")
    setNearbyPlaces([])
    setNearbyPanelOpen(false)
    setRouteName("")
  }

  const getStateBadge = (estado: string | undefined) => {
    const state = PIPELINE_STATES.find(s => s.value === estado)
    if (!state) return null
    return (
      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${state.color}`}>
        {state.label}
      </span>
    )
  }

  const mapCenter = useMemo(() => {
    if (startingPoint.latitude && startingPoint.longitude) {
      return { lat: startingPoint.latitude, lng: startingPoint.longitude }
    }
    if (validLocations.length > 0) {
      return { lat: validLocations[0].latitude!, lng: validLocations[0].longitude! }
    }
    return defaultCenter
  }, [startingPoint, validLocations])

  // Get routes for selected date
  const routesForSelectedDate = savedRoutes.filter(r => r.data.split("T")[0] === selectedDate)

  if (loading) {
    return (
      <div className="bg-card rounded-xl shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-96 bg-muted rounded-lg"></div>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${optimizedRoute.length > 0 ? "pb-20 lg:pb-0" : ""}`}>
      {/* Geocode Status Banner */}
      {geocodeStatus && geocodeStatus.pendingGeocoding > 0 && (
        <div className="flex items-center justify-between gap-4 bg-amber-500 text-white rounded-xl px-4 py-3">
          <div className="flex items-center gap-3">
            <svg
              className="w-5 h-5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
            </svg>
            <span className="text-sm font-medium">
              <span className="font-bold">{geocodeStatus.pendingGeocoding}</span> clientes sem coordenadas
              <span className="hidden sm:inline text-amber-100">
                {" "}· Total: {geocodeStatus.total} · Com coordenadas: {geocodeStatus.withCoordinates}
              </span>
            </span>
          </div>
          <button
            onClick={runBatchGeocode}
            disabled={batchGeocoding}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition disabled:opacity-50"
          >
            {batchGeocoding ? (
              <>
                <svg
                  className="w-4 h-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span className="hidden sm:inline">A geocodificar...</span>
              </>
            ) : (
              <>
                <span>Geocodificar</span>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </>
            )}
          </button>
        </div>
      )}

      {/* Date Selector & Saved Routes */}
      <div className="bg-card rounded-xl shadow-sm p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <label className="block text-xs text-muted-foreground mb-1">Data da Rota</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowSavedRoutes(!showSavedRoutes)}
              className="flex items-center gap-2 px-4 py-2 bg-secondary text-foreground rounded-lg text-sm font-medium hover:bg-secondary/80 transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Rotas Guardadas ({savedRoutes.length})
            </button>
          </div>
        </div>

        {/* Routes for selected date */}
        {routesForSelectedDate.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground mb-2">Rotas para {selectedDate}:</p>
            <div className="flex flex-wrap gap-2">
              {routesForSelectedDate.map(route => (
                <div key={route.id} className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-lg text-sm">
                  <button onClick={() => loadSavedRoute(route)} className="hover:underline">
                    {route.nome || "Rota"} ({route.locais.length} locais)
                  </button>
                  <button onClick={() => deleteSavedRoute(route.id)} className="ml-1 text-red-500 hover:text-red-700">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Saved routes panel */}
        {showSavedRoutes && (
          <div className="mt-3 pt-3 border-t border-border max-h-48 overflow-y-auto">
            {savedRoutes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhuma rota guardada</p>
            ) : (
              <div className="space-y-2">
                {savedRoutes.map(route => (
                  <div key={route.id} className="flex items-center justify-between p-2 bg-secondary/50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{route.nome || "Rota sem nome"}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(route.data).toLocaleDateString("pt-PT")} · {route.locais.length} locais · {route.distanciaTotal}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => loadSavedRoute(route)}
                        className="p-1.5 bg-primary text-white rounded hover:bg-primary-hover"
                        title="Carregar"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                      </button>
                      <button
                        onClick={() => deleteSavedRoute(route.id)}
                        className="p-1.5 bg-red-500 text-white rounded hover:bg-red-600"
                        title="Eliminar"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Starting Point */}
      <div className="bg-card rounded-xl shadow-sm p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Ponto de Partida
        </h3>

        <div className="space-y-2">
          <button
            onClick={getCurrentLocation}
            className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition ${
              startingPoint.type === "gps" && startingPoint.latitude
                ? "bg-green-100 text-green-800 border-2 border-green-500"
                : "bg-secondary text-foreground hover:bg-secondary/80"
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3zm0 0V4m0 16v-4m-8-4H8m12 0h-4" />
            </svg>
            Usar Localização Atual
          </button>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ou inserir morada..."
              value={startingPoint.address}
              onChange={(e) => setStartingPoint(prev => ({
                ...prev,
                type: "address",
                address: e.target.value,
                latitude: null,
                longitude: null
              }))}
              className="flex-1 px-3 py-3 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={geocodeStartingAddress}
              disabled={!startingPoint.address.trim()}
              className="px-4 py-3 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-hover transition disabled:opacity-50"
            >
              <span className="hidden sm:inline">Localizar</span>
              <svg className="w-5 h-5 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </div>

        {startingPoint.latitude && startingPoint.longitude && (
          <p className="mt-2 text-xs text-green-600 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Ponto de partida definido
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Filters & Location List */}
        <div className="lg:col-span-1 space-y-4 order-2 lg:order-1">
          {/* Filters */}
          <div className="bg-card rounded-xl shadow-sm p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Filtros</h3>

            <div className="mb-3">
              <label className="text-xs text-muted-foreground mb-1 block">Tipo</label>
              <div className="flex gap-1">
                {[
                  { value: "all", label: "Todos" },
                  { value: "cliente", label: "Clientes" },
                  { value: "prospecto", label: "Prospectos" }
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setFilterType(opt.value as any)}
                    className={`px-2 py-1 rounded text-xs font-medium transition ${
                      filterType === opt.value
                        ? "bg-primary text-white"
                        : "bg-secondary text-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-3">
              <label className="text-xs text-muted-foreground mb-1 block">Cidade</label>
              <select
                value={filterCity}
                onChange={(e) => setFilterCity(e.target.value)}
                className="w-full px-2 py-1.5 bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Todas</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            {filterType !== "cliente" && (
              <div className="mb-3">
                <label className="text-xs text-muted-foreground mb-1 block">Estado Pipeline</label>
                <div className="flex flex-wrap gap-1">
                  {PIPELINE_STATES.map(state => (
                    <button
                      key={state.value}
                      onClick={() => {
                        setFilterStates(prev =>
                          prev.includes(state.value)
                            ? prev.filter(s => s !== state.value)
                            : [...prev, state.value]
                        )
                      }}
                      className={`px-2 py-0.5 rounded text-xs font-medium transition ${
                        filterStates.includes(state.value)
                          ? state.color + " ring-2 ring-offset-1 ring-gray-400"
                          : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                      }`}
                    >
                      {state.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Pesquisar</label>
              <input
                type="text"
                placeholder="Nome, morada..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-2 py-1.5 bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Location List */}
          <div className="bg-card rounded-xl shadow-sm p-4 max-h-[50vh] lg:max-h-[400px] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">
                Locais ({filteredLocations.length})
              </h3>
              <span className="text-xs text-muted-foreground">
                {selectedLocations.length} selecionados
              </span>
            </div>

            {Object.keys(locationsByCity).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum local encontrado</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(locationsByCity).map(([city, locs]) => (
                  <div key={city}>
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{city}</h4>
                      <button
                        onClick={() => selectAllInCity(city)}
                        className="text-xs text-primary hover:underline"
                      >
                        {locs.filter(l => l.latitude).every(l => selectedLocations.includes(l.id)) ? "Desmarcar" : "Selecionar"} todos
                      </button>
                    </div>
                    <div className="space-y-1">
                      {locs.map(loc => (
                        <div key={loc.id}>
                          <label
                            className={`flex items-start gap-2 p-2 rounded-lg cursor-pointer transition ${
                              selectedLocations.includes(loc.id)
                                ? "bg-primary/10 border border-primary/30"
                                : loc.latitude ? "bg-secondary/50 hover:bg-secondary" : "bg-red-50 dark:bg-red-900/20"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedLocations.includes(loc.id)}
                              onChange={() => loc.latitude ? toggleLocation(loc.id) : setEditingLocation(loc.id)}
                              disabled={!loc.latitude && editingLocation !== loc.id}
                              className="mt-0.5 rounded text-primary focus:ring-primary"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                  loc.tipo === "cliente" ? "bg-blue-500" : "bg-orange-500"
                                }`} />
                                <span className="text-sm font-medium text-foreground truncate">{loc.nome}</span>
                              </div>
                              {loc.tipo === "prospecto" && loc.estado && (
                                <div className="mt-0.5">{getStateBadge(loc.estado)}</div>
                              )}
                              {!loc.latitude && editingLocation !== loc.id && (
                                <button
                                  onClick={(e) => {
                                    e.preventDefault()
                                    setEditingLocation(loc.id)
                                    setEditAddress({
                                      morada: loc.morada || "",
                                      cidade: loc.cidade || "",
                                      codigoPostal: loc.codigoPostal || ""
                                    })
                                  }}
                                  className="text-xs text-red-600 hover:underline mt-0.5"
                                >
                                  + Adicionar morada
                                </button>
                              )}
                            </div>
                          </label>

                          {/* Inline address edit */}
                          {editingLocation === loc.id && (
                            <div className="ml-6 mt-2 p-3 bg-secondary rounded-lg space-y-2">
                              <input
                                type="text"
                                placeholder="Morada"
                                value={editAddress.morada}
                                onChange={(e) => setEditAddress(prev => ({ ...prev, morada: e.target.value }))}
                                className="w-full px-2 py-1.5 bg-card border border-border rounded text-sm"
                              />
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  placeholder="Cidade"
                                  value={editAddress.cidade}
                                  onChange={(e) => setEditAddress(prev => ({ ...prev, cidade: e.target.value }))}
                                  className="flex-1 px-2 py-1.5 bg-card border border-border rounded text-sm"
                                />
                                <input
                                  type="text"
                                  placeholder="Cod. Postal"
                                  value={editAddress.codigoPostal}
                                  onChange={(e) => setEditAddress(prev => ({ ...prev, codigoPostal: e.target.value }))}
                                  className="w-24 px-2 py-1.5 bg-card border border-border rounded text-sm"
                                />
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => geocodeInlineAddress(loc.id, loc.tipo)}
                                  disabled={geocodingInline || (!editAddress.morada && !editAddress.cidade)}
                                  className="flex-1 px-3 py-1.5 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700 disabled:opacity-50"
                                >
                                  {geocodingInline ? "A localizar..." : "Localizar e Guardar"}
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingLocation(null)
                                    setEditAddress({ morada: "", cidade: "", codigoPostal: "" })
                                  }}
                                  className="px-3 py-1.5 bg-secondary text-foreground rounded text-xs font-medium hover:bg-secondary/80"
                                >
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Map & Route */}
        <div className="lg:col-span-2 space-y-4 order-1 lg:order-2">
          {/* Actions */}
          <div className="bg-card rounded-xl shadow-sm p-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={calculateRoute}
                disabled={calculatingRoute || selectedLocations.length === 0}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-hover transition disabled:opacity-50"
              >
                {calculatingRoute ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                )}
                Calcular Rota
              </button>

              {optimizedRoute.length > 0 && (
                <button
                  onClick={clearRoute}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-secondary text-foreground rounded-xl font-medium hover:bg-secondary/80 transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Limpar
                </button>
              )}
            </div>

            {/* Route Info & Save */}
            {totalDistance && (
              <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex flex-wrap items-center gap-4 mb-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Distância</p>
                    <p className="font-bold text-foreground">{totalDistance}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Duração</p>
                    <p className="font-bold text-foreground">{totalDuration}</p>
                  </div>
                </div>

                {/* Save route section */}
                <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-green-200 dark:border-green-800">
                  <input
                    type="text"
                    placeholder="Nome da rota (opcional)"
                    value={routeName}
                    onChange={(e) => setRouteName(e.target.value)}
                    className="flex-1 px-3 py-2 bg-card border border-border rounded-lg text-sm"
                  />
                  <button
                    onClick={saveRoute}
                    disabled={savingRoute}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                  >
                    {savingRoute ? "A guardar..." : "Guardar Rota"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Map */}
          <div className="bg-card rounded-xl shadow-sm overflow-hidden h-[300px] sm:h-[350px] lg:h-[400px]">
            {isLoaded ? (
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={mapCenter}
                zoom={10}
                options={{
                  fullscreenControl: true,
                  zoomControl: true,
                  streetViewControl: false,
                  mapTypeControl: false,
                }}
              >
                {startingPoint.latitude && startingPoint.longitude && (
                  <Marker
                    position={{ lat: startingPoint.latitude, lng: startingPoint.longitude }}
                    icon={{
                      path: google.maps.SymbolPath.CIRCLE,
                      scale: 10,
                      fillColor: "#22c55e",
                      fillOpacity: 1,
                      strokeColor: "#fff",
                      strokeWeight: 2,
                    }}
                    title="Ponto de partida"
                  />
                )}

                {directions ? (
                  <DirectionsRenderer directions={directions} />
                ) : (
                  validLocations
                    .filter(l => selectedLocations.includes(l.id))
                    .map(loc => (
                      <Marker
                        key={loc.id}
                        position={{ lat: loc.latitude!, lng: loc.longitude! }}
                        icon={{
                          path: google.maps.SymbolPath.CIRCLE,
                          scale: 8,
                          fillColor: loc.tipo === "cliente" ? "#3b82f6" : "#f97316",
                          fillOpacity: 1,
                          strokeColor: "#fff",
                          strokeWeight: 2,
                        }}
                        title={loc.nome}
                        onClick={() => setSelectedMarker(loc)}
                      />
                    ))
                )}

                {selectedMarker && (
                  <InfoWindow
                    position={{ lat: selectedMarker.latitude!, lng: selectedMarker.longitude! }}
                    onCloseClick={() => setSelectedMarker(null)}
                  >
                    <div className="p-1">
                      <h4 className="font-medium text-gray-900">{selectedMarker.nome}</h4>
                      <p className="text-xs text-gray-600 capitalize">{selectedMarker.tipo}</p>
                      {selectedMarker.morada && (
                        <p className="text-xs text-gray-500 mt-1">{selectedMarker.morada}</p>
                      )}
                    </div>
                  </InfoWindow>
                )}
              </GoogleMap>
            ) : (
              <div className="h-full bg-muted animate-pulse flex items-center justify-center">
                <span className="text-muted-foreground">A carregar mapa...</span>
              </div>
            )}
          </div>

          {/* Optimized Route List */}
          {optimizedRoute.length > 0 && (
            <div className="bg-card rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground">Ordem Otimizada</h3>
                {/* Navigation buttons - hidden on mobile (shown in bottom bar) */}
                <div className="hidden lg:flex gap-2">
                  <button
                    onClick={() => openNavigation("google")}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                    Google Maps
                  </button>
                  <button
                    onClick={() => openNavigation("waze")}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#33ccff] text-white rounded-lg text-xs font-medium hover:bg-[#2ab8e6]"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                    Waze
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {/* Starting point */}
                <div className="flex items-center gap-3 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <span className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  </span>
                  <span className="text-sm font-medium text-foreground">Ponto de Partida</span>
                </div>

                {optimizedRoute.map((loc, i) => (
                  <div key={loc.id}>
                    <div className="flex items-center gap-3 p-2 bg-secondary/50 rounded-lg">
                      <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-foreground">{loc.nome}</span>
                        {loc.morada && (
                          <p className="text-xs text-muted-foreground truncate">{loc.morada}</p>
                        )}
                      </div>
                      <span className={`w-2 h-2 rounded-full ${
                        loc.tipo === "cliente" ? "bg-blue-500" : "bg-orange-500"
                      }`} />
                    </div>

                    {/* Find nearby buttons */}
                    {i < optimizedRoute.length - 1 && (
                      <div className="flex gap-2 ml-9 my-2">
                        <button
                          onClick={() => findNearbyPlaces(loc.latitude!, loc.longitude!, "parking", i)}
                          className="text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 px-2 py-1.5 rounded-lg flex items-center gap-1.5 transition"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          Parking
                        </button>
                        <button
                          onClick={() => findNearbyPlaces(loc.latitude!, loc.longitude!, "gas_station", i)}
                          className="text-xs text-amber-600 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20 dark:hover:bg-amber-900/30 px-2 py-1.5 rounded-lg flex items-center gap-1.5 transition"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          GPL
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Nearby Places Panel */}
      {nearbyPanelOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setNearbyPanelOpen(false)}
          />
          <div className="fixed inset-0 sm:inset-y-0 sm:right-0 sm:left-auto sm:w-80 bg-card shadow-xl z-50 overflow-y-auto">
            <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between">
              <h3 className="font-semibold text-foreground">
                {nearbyType === "parking" ? "Estacionamentos" : "Postos GPL"} Próximos
              </h3>
              <button
                onClick={() => setNearbyPanelOpen(false)}
                className="p-2 hover:bg-secondary rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

          <div className="p-4">
            {loadingNearby ? (
              <div className="flex items-center justify-center py-8">
                <svg className="w-6 h-6 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : nearbyPlaces.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum local encontrado</p>
            ) : (
              <div className="space-y-3">
                {nearbyPlaces.map(place => (
                  <div key={place.id} className="bg-secondary/50 rounded-lg p-3">
                    <div className="flex-1 min-w-0 mb-2">
                      <h4 className="text-sm font-medium text-foreground">{place.name}</h4>
                      {place.address && (
                        <p className="text-xs text-muted-foreground mt-0.5">{place.address}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-primary font-medium">{place.distance}m</span>
                        {place.hasGPL && (
                          <span className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded">GPL</span>
                        )}
                        {place.rating && (
                          <span className="text-xs text-amber-600 flex items-center gap-0.5">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            {place.rating}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigateToPlace(place, "google")}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                        </svg>
                        Maps
                      </button>
                      <button
                        onClick={() => navigateToPlace(place, "waze")}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-[#33ccff] text-white rounded-lg text-sm font-medium hover:bg-[#2ab8e6]"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                        Waze
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        </>
      )}

      {/* Mobile Navigation Bar - Fixed at bottom when route is calculated */}
      {optimizedRoute.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-3 z-30 lg:hidden safe-area-bottom">
          <div className="flex gap-2">
            <button
              onClick={() => openNavigation("google")}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              Google Maps
            </button>
            <button
              onClick={() => openNavigation("waze")}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#33ccff] text-white rounded-xl font-medium hover:bg-[#2ab8e6]"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              Waze
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
