"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { GoogleMap, useJsApiLoader, Marker, DirectionsRenderer, InfoWindow, Autocomplete } from "@react-google-maps/api"
import { GOOGLE_MAPS_CONFIG } from "@/lib/google-maps"
import Swal from "sweetalert2"

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

interface ParkingStop {
  lat: number
  lng: number
  nome: string
  endereco: string | null
  custoEstimado: number | null
  afterStopIndex: number
}

interface RouteCosts {
  custoPortagens: number | null
  numPortagens: number | null
  custoCombuistivel: number | null
  consumoMedio: number
  precoLitro: number
  custoEstacionamento: number | null
  custoTotal: number | null
  custoReal: number | null
  notasCustos: string
}

interface SavedRoute {
  id: string
  nome: string | null
  data: string
  origemLatitude: number
  origemLongitude: number
  origemEndereco: string | null
  locais: { id: string; tipo: string; ordem: number }[]
  paragens: ParkingStop[] | null
  distanciaTotal: string | null
  duracaoTotal: string | null
  custoPortagens: number | null
  numPortagens: number | null
  custoCombuistivel: number | null
  consumoMedio: number | null
  precoLitro: number | null
  custoEstacionamento: number | null
  custoTotal: number | null
  custoReal: number | null
  notasCustos: string | null
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

const DEFAULT_CONSUMO_MEDIO = 7.5
const DEFAULT_PRECO_LITRO = 0.75
const TOLL_COST_PER_KM = 0.085

// Extract postal code from address string (Portuguese format: XXXX-XXX)
const extractPostalCodeFromAddress = (morada: string | null): string | null => {
  if (!morada) return null
  const match = morada.match(/(\d{4})[-\s]?(\d{3})/)
  if (match) {
    return `${match[1]}-${match[2]}`
  }
  return null
}

// Extract city name from address - handles multi-word cities like "Torres Vedras"
const extractCityFromAddress = (morada: string | null): string | null => {
  if (!morada) return null

  // Try to extract city after postal code (format: 2560-123 Torres Vedras)
  // Use greedy capture (.+) to get the full city name
  const postalCodeMatch = morada.match(/\d{4}[-\s]?\d{3}\s+([A-Za-zÀ-ÿ\s]+?)(?:\s*,|$)/)
  if (postalCodeMatch && postalCodeMatch[1]) {
    const city = postalCodeMatch[1].trim()
    // Remove trailing "Portugal" if present
    return city.replace(/\s*portugal\s*$/i, "").trim()
  }

  // Alternative: try to find city between postal code and end/comma
  const altMatch = morada.match(/\d{4}[-\s]?\d{3}\s+(.+?)$/i)
  if (altMatch && altMatch[1]) {
    const city = altMatch[1].trim()
      .replace(/\s*portugal\s*$/i, "")
      .replace(/\s*,\s*$/, "")
      .trim()
    if (city && !/^\d/.test(city)) {
      return city
    }
  }

  // Fallback: look for city pattern after street address (Rua X, N, Cidade)
  const parts = morada.split(/,\s*/)
  for (let i = parts.length - 1; i >= 0; i--) {
    const part = parts[i].trim()
    // Skip if it's a postal code, number, or "Portugal"
    if (!/^\d/.test(part) && !/portugal/i.test(part) && part.length > 2) {
      // Check if it looks like a city name (not a street with "Rua", "Av", etc.)
      if (!/^(rua|av\.|avenida|travessa|largo|praca|estrada|beco)/i.test(part)) {
        return part
      }
    }
  }

  return null
}

// Portuguese postal code to district mapping
const getDistrictFromPostalCode = (postalCode: string | null, cityFallback?: string | null): string => {
  if (!postalCode) {
    return cityFallback || "Sem Localização"
  }

  const code = postalCode.replace(/\D/g, "").substring(0, 4)
  const num = parseInt(code, 10)

  if (isNaN(num)) {
    return cityFallback || "Sem Localização"
  }

  // Lisboa
  if (num >= 1000 && num <= 1998) return "Lisboa"
  if (num >= 2500 && num <= 2599) return "Leiria"
  if (num >= 2600 && num <= 2699) return "Lisboa"
  if (num >= 2700 && num <= 2799) return "Lisboa"
  if (num >= 2800 && num <= 2829) return "Setúbal"
  if (num >= 2830 && num <= 2999) return "Setúbal"
  if (num >= 2000 && num <= 2139) return "Santarém"
  if (num >= 2140 && num <= 2199) return "Santarém"
  if (num >= 2200 && num <= 2299) return "Santarém"
  if (num >= 2300 && num <= 2399) return "Leiria"
  if (num >= 2400 && num <= 2499) return "Leiria"

  // Coimbra, Aveiro, Viseu
  if (num >= 3000 && num <= 3099) return "Coimbra"
  if (num >= 3100 && num <= 3199) return "Leiria"
  if (num >= 3200 && num <= 3299) return "Coimbra"
  if (num >= 3300 && num <= 3399) return "Coimbra"
  if (num >= 3400 && num <= 3499) return "Coimbra"
  if (num >= 3500 && num <= 3599) return "Viseu"
  if (num >= 3600 && num <= 3699) return "Viseu"
  if (num >= 3700 && num <= 3799) return "Aveiro"
  if (num >= 3800 && num <= 3899) return "Aveiro"

  // Porto, Braga, Viana, Vila Real, Bragança
  if (num >= 4000 && num <= 4099) return "Porto"
  if (num >= 4100 && num <= 4199) return "Porto"
  if (num >= 4200 && num <= 4299) return "Porto"
  if (num >= 4300 && num <= 4399) return "Porto"
  if (num >= 4400 && num <= 4499) return "Porto"
  if (num >= 4500 && num <= 4599) return "Aveiro"
  if (num >= 4600 && num <= 4699) return "Porto"
  if (num >= 4700 && num <= 4799) return "Braga"
  if (num >= 4800 && num <= 4899) return "Braga"
  if (num >= 4900 && num <= 4999) return "Viana do Castelo"
  if (num >= 5000 && num <= 5099) return "Vila Real"
  if (num >= 5100 && num <= 5199) return "Viseu"
  if (num >= 5200 && num <= 5299) return "Bragança"
  if (num >= 5300 && num <= 5399) return "Bragança"
  if (num >= 5400 && num <= 5499) return "Vila Real"

  // Castelo Branco, Guarda
  if (num >= 6000 && num <= 6099) return "Castelo Branco"
  if (num >= 6100 && num <= 6199) return "Castelo Branco"
  if (num >= 6200 && num <= 6299) return "Castelo Branco"
  if (num >= 6300 && num <= 6399) return "Guarda"

  // Alentejo
  if (num >= 7000 && num <= 7099) return "Évora"
  if (num >= 7100 && num <= 7199) return "Évora"
  if (num >= 7200 && num <= 7299) return "Évora"
  if (num >= 7300 && num <= 7399) return "Portalegre"
  if (num >= 7400 && num <= 7499) return "Portalegre"
  if (num >= 7500 && num <= 7599) return "Setúbal"
  if (num >= 7600 && num <= 7699) return "Beja"
  if (num >= 7700 && num <= 7799) return "Beja"
  if (num >= 7800 && num <= 7899) return "Beja"

  // Algarve
  if (num >= 8000 && num <= 8999) return "Faro"

  // Islands
  if (num >= 9000 && num <= 9499) return "Madeira"
  if (num >= 9500 && num <= 9999) return "Açores"

  return cityFallback || "Sem Localização"
}

const getRouteLetter = (index: number): string => {
  return String.fromCharCode(65 + index)
}

// Calculate distance between two points using Haversine formula
const haversineDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371 // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Nearest Neighbor algorithm for initial route optimization
const nearestNeighborOptimization = (
  startLat: number,
  startLng: number,
  locations: Array<{ lat: number; lng: number; index: number }>
): number[] => {
  if (locations.length <= 1) return locations.map(l => l.index)

  const unvisited = [...locations]
  const route: number[] = []
  let currentLat = startLat
  let currentLng = startLng

  while (unvisited.length > 0) {
    let nearestIdx = 0
    let nearestDist = Infinity

    for (let i = 0; i < unvisited.length; i++) {
      const dist = haversineDistance(currentLat, currentLng, unvisited[i].lat, unvisited[i].lng)
      if (dist < nearestDist) {
        nearestDist = dist
        nearestIdx = i
      }
    }

    const nearest = unvisited[nearestIdx]
    route.push(nearest.index)
    currentLat = nearest.lat
    currentLng = nearest.lng
    unvisited.splice(nearestIdx, 1)
  }

  return route
}

// 2-opt local search to improve route
const twoOptImprove = (
  route: number[],
  locations: Array<{ lat: number; lng: number }>,
  startLat: number,
  startLng: number
): number[] => {
  if (route.length <= 2) return route

  const getRouteDistance = (r: number[]): number => {
    let dist = haversineDistance(startLat, startLng, locations[r[0]].lat, locations[r[0]].lng)
    for (let i = 0; i < r.length - 1; i++) {
      dist += haversineDistance(locations[r[i]].lat, locations[r[i]].lng, locations[r[i + 1]].lat, locations[r[i + 1]].lng)
    }
    return dist
  }

  let improved = true
  let bestRoute = [...route]
  let bestDist = getRouteDistance(bestRoute)

  while (improved) {
    improved = false
    for (let i = 0; i < bestRoute.length - 1; i++) {
      for (let j = i + 1; j < bestRoute.length; j++) {
        // Reverse the segment between i and j
        const newRoute = [
          ...bestRoute.slice(0, i),
          ...bestRoute.slice(i, j + 1).reverse(),
          ...bestRoute.slice(j + 1)
        ]
        const newDist = getRouteDistance(newRoute)
        if (newDist < bestDist - 0.1) { // Small threshold to avoid floating point issues
          bestRoute = newRoute
          bestDist = newDist
          improved = true
        }
      }
    }
  }

  return bestRoute
}

// Optimize route order using nearest neighbor + 2-opt
const optimizeRouteOrder = (
  startLat: number,
  startLng: number,
  locations: Array<{ lat: number; lng: number; index: number }>
): number[] => {
  if (locations.length <= 1) return locations.map(l => l.index)

  // First pass: nearest neighbor
  const nnRoute = nearestNeighborOptimization(startLat, startLng, locations)

  // Second pass: 2-opt improvement
  const locArray = locations.map(l => ({ lat: l.lat, lng: l.lng }))
  const optimizedOrder = twoOptImprove(
    nnRoute.map(i => locations.findIndex(l => l.index === i)),
    locArray,
    startLat,
    startLng
  )

  return optimizedOrder.map(i => locations[i].index)
}

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
  const [locations, setLocations] = useState<RouteLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>([])

  // Filter state
  const [filterDistrict, setFilterDistrict] = useState<string>("")
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

  // Parking stops state
  const [parkingStops, setParkingStops] = useState<ParkingStop[]>([])

  // Cost state
  const [costs, setCosts] = useState<RouteCosts>({
    custoPortagens: null,
    numPortagens: null,
    custoCombuistivel: null,
    consumoMedio: DEFAULT_CONSUMO_MEDIO,
    precoLitro: DEFAULT_PRECO_LITRO,
    custoEstacionamento: null,
    custoTotal: null,
    custoReal: null,
    notasCustos: ""
  })
  const [showCostPanel, setShowCostPanel] = useState(false)

  // Calendar/Date state
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0])
  const [routeName, setRouteName] = useState("")
  const [showSavedRoutes, setShowSavedRoutes] = useState(false)
  const [savingRoute, setSavingRoute] = useState(false)

  // Inline edit state
  const [editingLocation, setEditingLocation] = useState<string | null>(null)
  const [editAddress, setEditAddress] = useState({ morada: "", cidade: "", codigoPostal: "" })
  const [pinpointingLocation, setPinpointingLocation] = useState<{ id: string; tipo: "cliente" | "prospecto" } | null>(null)
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

  // Address search state
  const [searchAutocomplete, setSearchAutocomplete] = useState<google.maps.places.Autocomplete | null>(null)
  const [startingPointAutocomplete, setStartingPointAutocomplete] = useState<google.maps.places.Autocomplete | null>(null)
  const [searchMarker, setSearchMarker] = useState<{ lat: number; lng: number; address: string } | null>(null)
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null)

  // Collapsible panels state
  const [expandedPanels, setExpandedPanels] = useState<Set<string>>(new Set(["origin", "locations"]))

  const { isLoaded } = useJsApiLoader(GOOGLE_MAPS_CONFIG)

  const togglePanel = (panel: string) => {
    setExpandedPanels(prev => {
      const newSet = new Set(prev)
      if (newSet.has(panel)) {
        newSet.delete(panel)
      } else {
        newSet.add(panel)
      }
      return newSet
    })
  }

  const calculateFuelCost = useCallback((distanceStr: string, consumo: number, preco: number) => {
    const distanceKm = parseFloat(distanceStr.replace(/[^\d.]/g, ""))
    if (isNaN(distanceKm)) return null
    return Math.round((distanceKm / 100) * consumo * preco * 100) / 100
  }, [])

  const estimateTollCost = useCallback((result: google.maps.DirectionsResult) => {
    const route = result.routes[0]
    if (!route) return { cost: null, count: null }

    let tollDistance = 0
    let tollCount = 0
    const tollRoads = new Set<string>()

    route.legs.forEach(leg => {
      leg.steps.forEach(step => {
        const instructions = step.instructions?.toLowerCase() || ""
        const tollMatches = instructions.match(/\b(a-?\d+|ic\d+|ip\d+|vci|crep|cril|crel)\b/gi)
        if (tollMatches) {
          tollMatches.forEach(road => {
            const normalized = road.toUpperCase().replace("-", "")
            if (normalized.startsWith("A") || normalized === "VCI" || normalized === "CREP" || normalized === "CRIL" || normalized === "CREL") {
              if (!tollRoads.has(normalized)) {
                tollRoads.add(normalized)
                tollCount++
              }
              tollDistance += step.distance?.value || 0
            }
          })
        }
      })
    })

    if (tollDistance > 0) {
      const tollKm = tollDistance / 1000
      const estimatedCost = Math.round(tollKm * TOLL_COST_PER_KM * 100) / 100
      return { cost: estimatedCost, count: tollCount }
    }

    return { cost: null, count: null }
  }, [])

  const totalParkingCost = useMemo(() => {
    return parkingStops.reduce((sum, p) => sum + (p.custoEstimado || 0), 0)
  }, [parkingStops])

  useEffect(() => {
    if (totalDistance) {
      const fuelCost = calculateFuelCost(totalDistance, costs.consumoMedio, costs.precoLitro)
      setCosts(prev => ({
        ...prev,
        custoCombuistivel: fuelCost,
        custoEstacionamento: totalParkingCost || null,
        custoTotal: (prev.custoPortagens || 0) + (fuelCost || 0) + (totalParkingCost || 0) || null
      }))
    }
  }, [totalDistance, costs.consumoMedio, costs.precoLitro, totalParkingCost, calculateFuelCost])

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
        setGeocodeStatus(statusData)
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

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

  // Get available districts from locations
  const availableDistricts = useMemo(() => {
    const districts = new Set<string>()
    locations.forEach(loc => {
      const postalCode = loc.codigoPostal || extractPostalCodeFromAddress(loc.morada)
      const city = loc.cidade || extractCityFromAddress(loc.morada)
      const district = getDistrictFromPostalCode(postalCode, city)
      if (district !== "Sem Localização") {
        districts.add(district)
      }
    })
    return Array.from(districts).sort()
  }, [locations])

  const getLocationDistrict = useCallback((loc: RouteLocation): string => {
    const postalCode = loc.codigoPostal || extractPostalCodeFromAddress(loc.morada)
    const city = loc.cidade || extractCityFromAddress(loc.morada)
    return getDistrictFromPostalCode(postalCode, city)
  }, [])

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
        Swal.fire({
          icon: "warning",
          title: "Morada não encontrada",
          text: "Verifique a morada e tente novamente",
          confirmButtonColor: "#10b981"
        })
      }
    } catch (error) {
      console.error("Geocode error:", error)
      Swal.fire({
        icon: "error",
        title: "Erro",
        text: "Erro ao geocodificar morada",
        confirmButtonColor: "#10b981"
      })
    }
  }

  // Handle starting point autocomplete selection
  const onStartingPointPlaceSelect = () => {
    if (startingPointAutocomplete) {
      const place = startingPointAutocomplete.getPlace()
      if (place.geometry?.location) {
        setStartingPoint({
          type: "address",
          latitude: place.geometry.location.lat(),
          longitude: place.geometry.location.lng(),
          address: place.formatted_address || place.name || ""
        })
      }
    }
  }

  const runBatchGeocode = async () => {
    if (!confirm("Isto vai geocodificar todos os clientes sem coordenadas. Continuar?")) return

    setBatchGeocoding(true)
    try {
      const response = await fetch("/api/clientes/batch-geocode", { method: "POST" })
      const result = await response.json()
      alert(`Geocodificação completa!\nSucesso: ${result.success}\nFalhados: ${result.failed}`)

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
        Swal.fire({
          icon: "warning",
          title: "Morada não encontrada",
          text: "Deseja marcar a localização no mapa?",
          showCancelButton: true,
          confirmButtonText: "Sim, marcar no mapa",
          cancelButtonText: "Cancelar",
          confirmButtonColor: "#10b981"
        }).then((result) => {
          if (result.isConfirmed) {
            setPinpointingLocation({ id: locationId, tipo })
            Swal.fire({
              icon: "info",
              title: "Clique no mapa",
              text: "Clique no mapa para definir a localização exacta",
              timer: 3000,
              showConfirmButton: false
            })
          }
        })
        return
      }

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

      setLocations(prev => prev.map(loc =>
        loc.id === locationId
          ? { ...loc, ...editAddress, latitude: geocodeData.latitude, longitude: geocodeData.longitude }
          : loc
      ))

      setEditingLocation(null)
      setEditAddress({ morada: "", cidade: "", codigoPostal: "" })
    } catch (error) {
      console.error("Inline geocode error:", error)
      Swal.fire({
          icon: "error",
          title: "Erro",
          text: "Erro ao geocodificar morada",
          confirmButtonColor: "#10b981"
        })
    } finally {
      setGeocodingInline(false)
    }
  }

  const handleMapClick = useCallback(async (e: google.maps.MapMouseEvent) => {
    if (!pinpointingLocation || !e.latLng) return

    const lat = e.latLng.lat()
    const lng = e.latLng.lng()

    try {
      const endpoint = pinpointingLocation.tipo === "cliente"
        ? `/api/clientes/${pinpointingLocation.id}`
        : `/api/prospectos/${pinpointingLocation.id}`

      await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: lat,
          longitude: lng
        })
      })

      setLocations(prev => prev.map(loc =>
        loc.id === pinpointingLocation.id
          ? { ...loc, latitude: lat, longitude: lng }
          : loc
      ))

      Swal.fire({
        icon: "success",
        title: "Localização definida",
        text: "A localização foi guardada com sucesso",
        timer: 2000,
        showConfirmButton: false
      })
    } catch (error) {
      console.error("Error saving pinpointed location:", error)
      Swal.fire({
        icon: "error",
        title: "Erro",
        text: "Erro ao guardar localização",
        confirmButtonColor: "#10b981"
      })
    } finally {
      setPinpointingLocation(null)
      setEditingLocation(null)
      setEditAddress({ morada: "", cidade: "", codigoPostal: "" })
    }
  }, [pinpointingLocation])

  // Filtered locations
  const filteredLocations = useMemo(() => {
    return locations.filter(loc => {
      if (filterType !== "all" && loc.tipo !== filterType) return false

      if (filterDistrict) {
        const locDistrict = getLocationDistrict(loc)
        if (locDistrict !== filterDistrict) return false
      }

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
  }, [locations, filterType, filterDistrict, filterStates, searchQuery, getLocationDistrict])

  const validLocations = useMemo(() => {
    return filteredLocations.filter(l => l.latitude && l.longitude)
  }, [filteredLocations])

  // Group locations by district
  const locationsByDistrict = useMemo(() => {
    const grouped: Record<string, RouteLocation[]> = {}
    filteredLocations.forEach(loc => {
      const district = getLocationDistrict(loc)
      if (!grouped[district]) grouped[district] = []
      grouped[district].push(loc)
    })
    return Object.fromEntries(
      Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b))
    )
  }, [filteredLocations, getLocationDistrict])

  const getRouteIndex = useCallback((locationId: string): number => {
    return optimizedRoute.findIndex(loc => loc.id === locationId)
  }, [optimizedRoute])

  const toggleLocation = (id: string) => {
    setSelectedLocations(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const selectAllInDistrict = (district: string) => {
    const districtLocations = locationsByDistrict[district] || []
    const districtIds = districtLocations.filter(l => l.latitude && l.longitude).map(l => l.id)
    const allSelected = districtIds.every(id => selectedLocations.includes(id))

    if (allSelected) {
      setSelectedLocations(prev => prev.filter(id => !districtIds.includes(id)))
    } else {
      setSelectedLocations(prev => [...new Set([...prev, ...districtIds])])
    }
  }

  const calculateRoute = useCallback(async (existingParkingStops?: ParkingStop[]) => {
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

    // Use our local optimization algorithm first for better results
    const locationsForOptimization = selected.map((loc, i) => ({
      lat: loc.latitude!,
      lng: loc.longitude!,
      index: i
    }))

    const optimizedIndices = optimizeRouteOrder(
      startingPoint.latitude,
      startingPoint.longitude,
      locationsForOptimization
    )

    // Reorder selected locations based on our optimization
    const optimizedSelected = optimizedIndices.map(i => selected[i])

    // Include parking stops in the route if any
    const stopsToInclude = existingParkingStops || []
    const allWaypoints: google.maps.DirectionsWaypoint[] = []

    // Build waypoints with parking stops inserted at correct positions
    for (let i = 0; i < optimizedSelected.length; i++) {
      // Add the location waypoint (except last one which is destination)
      if (i < optimizedSelected.length - 1) {
        allWaypoints.push({
          location: { lat: optimizedSelected[i].latitude!, lng: optimizedSelected[i].longitude! },
          stopover: true
        })
      }

      // Add any parking/gas stops that should come after this location
      const stopsAfterThis = stopsToInclude.filter(s => s.afterStopIndex === i)
      stopsAfterThis.forEach(stop => {
        allWaypoints.push({
          location: { lat: stop.lat, lng: stop.lng },
          stopover: true
        })
      })
    }

    const destination = { lat: optimizedSelected[optimizedSelected.length - 1].latitude!, lng: optimizedSelected[optimizedSelected.length - 1].longitude! }

    try {
      const result = await directionsService.route({
        origin,
        destination,
        waypoints: allWaypoints,
        optimizeWaypoints: false, // We already optimized locally
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

      const distanceStr = `${(distance / 1000).toFixed(1)} km`
      const durationStr = `${Math.round(duration / 60)} min`

      setTotalDistance(distanceStr)
      setTotalDuration(durationStr)

      const tollEstimate = estimateTollCost(result)
      const fuelCost = calculateFuelCost(distanceStr, costs.consumoMedio, costs.precoLitro)

      setCosts(prev => ({
        ...prev,
        custoPortagens: tollEstimate.cost,
        numPortagens: tollEstimate.count,
        custoCombuistivel: fuelCost,
        custoTotal: (tollEstimate.cost || 0) + (fuelCost || 0) + (prev.custoEstacionamento || 0) || null
      }))

      setOptimizedRoute(optimizedSelected)

      // Reset parking stops if this was a fresh calculation (not recalculating with parking)
      if (!existingParkingStops) {
        setParkingStops([])
      }

    } catch (error) {
      console.error("Directions error:", error)
      alert("Erro ao calcular rota. Verifica se os locais tem coordenadas válidas.")
    } finally {
      setCalculatingRoute(false)
    }
  }, [selectedLocations, validLocations, startingPoint, costs.consumoMedio, costs.precoLitro, estimateTollCost, calculateFuelCost])

  const addParkingToRoute = (place: NearbyPlace, afterStopIndex: number) => {
    const newParking: ParkingStop = {
      lat: place.latitude,
      lng: place.longitude,
      nome: place.name,
      endereco: place.address,
      custoEstimado: null,
      afterStopIndex
    }
    const newParkingStops = [...parkingStops, newParking]
    setParkingStops(newParkingStops)
    setNearbyPanelOpen(false)

    // Recalculate route with the new parking stop included
    calculateRoute(newParkingStops)
  }

  const removeParkingStop = (index: number) => {
    const newParkingStops = parkingStops.filter((_, i) => i !== index)
    setParkingStops(newParkingStops)

    // Recalculate route without the removed parking stop
    if (optimizedRoute.length > 0) {
      calculateRoute(newParkingStops)
    }
  }

  const updateParkingCost = (index: number, cost: number | null) => {
    setParkingStops(prev => prev.map((p, i) =>
      i === index ? { ...p, custoEstimado: cost } : p
    ))
  }

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
          paragens: parkingStops.length > 0 ? parkingStops : null,
          distanciaTotal: totalDistance,
          duracaoTotal: totalDuration,
          custoPortagens: costs.custoPortagens,
          numPortagens: costs.numPortagens,
          custoCombuistivel: costs.custoCombuistivel,
          consumoMedio: costs.consumoMedio,
          precoLitro: costs.precoLitro,
          custoEstacionamento: costs.custoEstacionamento || totalParkingCost || null,
          notasCustos: costs.notasCustos || null
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
    setParkingStops(route.paragens || [])

    setCosts({
      custoPortagens: route.custoPortagens,
      numPortagens: route.numPortagens,
      custoCombuistivel: route.custoCombuistivel,
      consumoMedio: route.consumoMedio || DEFAULT_CONSUMO_MEDIO,
      precoLitro: route.precoLitro || DEFAULT_PRECO_LITRO,
      custoEstacionamento: route.custoEstacionamento,
      custoTotal: route.custoTotal,
      custoReal: route.custoReal,
      notasCustos: route.notasCustos || ""
    })

    setShowSavedRoutes(false)

    setTimeout(() => {
      calculateRoute()
    }, 500)
  }

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

  const findNearbyPlaces = async (lat: number, lng: number, type: "parking" | "gas_station", index: number) => {
    setLoadingNearby(true)
    setNearbyPanelOpen(true)
    setNearbySearchPoint({ lat, lng, index })
    setNearbyType(type)

    // Use Google Places Service directly (client-side) to avoid API key restrictions
    if (!mapInstance) {
      setLoadingNearby(false)
      alert("Mapa não carregado")
      return
    }

    const service = new google.maps.places.PlacesService(mapInstance)
    const radius = type === "gas_station" ? 10000 : 5000

    // For GPL, use text search with keyword; for parking use nearby search
    if (type === "gas_station") {
      // Search specifically for GPL/AutoGás stations
      const textRequest: google.maps.places.TextSearchRequest = {
        location: new google.maps.LatLng(lat, lng),
        radius: radius,
        query: "GPL posto combustivel"
      }
      
      service.textSearch(textRequest, (results, status) => {
        processResults(results, status, lat, lng, type)
      })
    } else {
      const request: google.maps.places.PlaceSearchRequest = {
        location: new google.maps.LatLng(lat, lng),
        radius: radius,
        type: "parking"
      }

      service.nearbySearch(request, (results, status) => {
        processResults(results, status, lat, lng, type)
      })
    }
  }

  const processResults = (
    results: google.maps.places.PlaceResult[] | null,
    status: google.maps.places.PlacesServiceStatus,
    lat: number,
    lng: number,
    type: "parking" | "gas_station"
  ) => {
      setLoadingNearby(false)

    setLoadingNearby(false)

    if (status === google.maps.places.PlacesServiceStatus.OK && results) {
      // Filter GPL stations - only show ones with GPL in name
      const filteredResults = type === "gas_station" 
        ? results.filter(p => {
            const name = (p.name || "").toLowerCase()
            return name.includes("gpl") || name.includes("autogás") || name.includes("autogas") || name.includes("glp")
          })
        : results

      const places = filteredResults.map(place => {
          // Calculate distance
          const R = 6371e3
          const phi1 = lat * Math.PI / 180
          const phi2 = (place.geometry?.location?.lat() || 0) * Math.PI / 180
          const deltaPhi = ((place.geometry?.location?.lat() || 0) - lat) * Math.PI / 180
          const deltaLambda = ((place.geometry?.location?.lng() || 0) - lng) * Math.PI / 180

          const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
                    Math.cos(phi1) * Math.cos(phi2) *
                    Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2)
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
          const distance = Math.round(R * c)

          return {
            id: place.place_id || "",
            name: place.name || "",
            address: place.vicinity || null,
            latitude: place.geometry?.location?.lat() || 0,
            longitude: place.geometry?.location?.lng() || 0,
            distance,
            type,
            rating: place.rating,
            openNow: place.opening_hours?.isOpen?.()
          }
        })

        // Sort by distance
        places.sort((a, b) => a.distance - b.distance)
      setNearbyPlaces(places)
    } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
      setNearbyPlaces([])
    } else {
      console.error("Places search failed:", status)
      setNearbyPlaces([])
    }
  }

  const onPlaceSelected = () => {
    if (searchAutocomplete) {
      const place = searchAutocomplete.getPlace()
      if (place.geometry?.location) {
        const lat = place.geometry.location.lat()
        const lng = place.geometry.location.lng()
        setSearchMarker({
          lat,
          lng,
          address: place.formatted_address || ""
        })
        if (mapInstance) { mapInstance.panTo({ lat, lng }); mapInstance.setZoom(15) }
      }
    }
  }

  const getGoogleMapsUrl = () => {
    if (optimizedRoute.length === 0 || !startingPoint.latitude || !startingPoint.longitude) return ""

    const origin = `${startingPoint.latitude},${startingPoint.longitude}`
    const destination = `${optimizedRoute[optimizedRoute.length - 1].latitude},${optimizedRoute[optimizedRoute.length - 1].longitude}`

    // Build waypoints including parking/gas stops at correct positions
    const allWaypoints: string[] = []
    for (let i = 0; i < optimizedRoute.length - 1; i++) {
      allWaypoints.push(`${optimizedRoute[i].latitude},${optimizedRoute[i].longitude}`)
      // Add parking stops that come after this location
      const stopsAfterThis = parkingStops.filter(s => s.afterStopIndex === i)
      stopsAfterThis.forEach(stop => {
        allWaypoints.push(`${stop.lat},${stop.lng}`)
      })
    }

    const waypointsStr = allWaypoints.join("|")
    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypointsStr ? `&waypoints=${waypointsStr}` : ""}&travelmode=driving`
  }

  const getWazeUrl = () => {
    if (optimizedRoute.length === 0) return ""
    const firstStop = optimizedRoute[0]
    return `https://waze.com/ul?ll=${firstStop.latitude},${firstStop.longitude}&navigate=yes`
  }

  const openNavigation = (app: "google" | "waze") => {
    const url = app === "google" ? getGoogleMapsUrl() : getWazeUrl()
    if (url) window.open(url, "_blank")
  }

  const navigateToPlace = (place: NearbyPlace, app: "google" | "waze") => {
    let url = ""
    if (app === "google") {
      url = `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}&travelmode=driving`
    } else {
      url = `https://waze.com/ul?ll=${place.latitude},${place.longitude}&navigate=yes`
    }
    window.open(url, "_blank")
  }

  const clearRoute = () => {
    setDirections(null)
    setOptimizedRoute([])
    setTotalDistance("")
    setTotalDuration("")
    setNearbyPlaces([])
    setNearbyPanelOpen(false)
    setRouteName("")
    setParkingStops([])
    setCosts({
      custoPortagens: null,
      numPortagens: null,
      custoCombuistivel: null,
      consumoMedio: DEFAULT_CONSUMO_MEDIO,
      precoLitro: DEFAULT_PRECO_LITRO,
      custoEstacionamento: null,
      custoTotal: null,
      custoReal: null,
      notasCustos: ""
    })
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

  const routesForSelectedDate = savedRoutes.filter(r => r.data.split("T")[0] === selectedDate)

  // Check if user can calculate route
  const canCalculateRoute = startingPoint.latitude && startingPoint.longitude && selectedLocations.length > 0

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
    <div className={`space-y-3 ${optimizedRoute.length > 0 ? "pb-20 lg:pb-0" : ""}`}>
      {/* Geocode Status Banner */}
      {geocodeStatus && geocodeStatus.pendingGeocoding > 0 && (
        <div className="flex items-center justify-between gap-4 bg-amber-500 text-white rounded-xl px-4 py-3">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            <span className="text-sm font-medium">
              <span className="font-bold">{geocodeStatus.pendingGeocoding}</span> sem coordenadas
            </span>
          </div>
          <button
            onClick={runBatchGeocode}
            disabled={batchGeocoding}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition disabled:opacity-50"
          >
            {batchGeocoding ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <span>Geocodificar</span>
            )}
          </button>
        </div>
      )}

      {/* Quick Stats Bar */}
      <div className="bg-card rounded-xl shadow-sm p-3 flex flex-wrap items-center gap-3 border-l-4 border-emerald-500">
        <div className="flex items-center gap-2 text-sm">
          <span className="w-3 h-3 rounded-full bg-blue-500"></span>
          <span className="text-muted-foreground">Clientes:</span>
          <span className="font-semibold">{locations.filter(l => l.tipo === "cliente").length}</span>
        </div>
        <div className="w-px h-4 bg-border"></div>
        <div className="flex items-center gap-2 text-sm">
          <span className="w-3 h-3 rounded-full bg-orange-500"></span>
          <span className="text-muted-foreground">Prospectos:</span>
          <span className="font-semibold">{locations.filter(l => l.tipo === "prospecto").length}</span>
        </div>
        <div className="w-px h-4 bg-border"></div>
        <div className="flex items-center gap-2 text-sm">
          <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-muted-foreground">Selecionados:</span>
          <span className="font-semibold text-emerald-600">{selectedLocations.length}</span>
        </div>
        {savedRoutes.length > 0 && (
          <>
            <div className="w-px h-4 bg-border"></div>
            <button
              onClick={() => setShowSavedRoutes(!showSavedRoutes)}
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {savedRoutes.length} rotas guardadas
            </button>
          </>
        )}
      </div>

      {/* Saved Routes Dropdown */}
      {showSavedRoutes && (
        <div className="bg-card rounded-xl shadow-sm p-4 border border-primary/20">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground">Rotas Guardadas</h3>
            <button onClick={() => setShowSavedRoutes(false)} className="text-muted-foreground hover:text-foreground">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 bg-secondary border border-border rounded-lg text-sm"
            />
          </div>
          {savedRoutes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma rota guardada</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {savedRoutes.map(route => (
                <div key={route.id} className={`flex items-center justify-between p-3 rounded-lg transition ${
                  route.data.split("T")[0] === selectedDate ? "bg-primary/10 border border-primary/30" : "bg-secondary/50 hover:bg-secondary"
                }`}>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{route.nome || "Rota sem nome"}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(route.data).toLocaleDateString("pt-PT")} · {route.locais.length} locais · {route.distanciaTotal}
                      {route.custoTotal && <span className="text-green-600 font-medium"> · €{Number(route.custoTotal).toFixed(2)}</span>}
                    </p>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <button
                      onClick={() => loadSavedRoute(route)}
                      className="p-2 bg-primary text-white rounded-lg hover:bg-primary-hover"
                      title="Carregar"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                    </button>
                    <button
                      onClick={() => deleteSavedRoute(route.id)}
                      className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Left Panel - Collapsible Steps */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-3 order-2 lg:order-1">

          {/* Step 1: Starting Point */}
          <div className="bg-card rounded-xl shadow-sm overflow-hidden">
            <button
              onClick={() => togglePanel("origin")}
              className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition"
            >
              <div className="flex items-center gap-3">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  startingPoint.latitude ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"
                }`}>
                  {startingPoint.latitude ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : "1"}
                </span>
                <div className="text-left">
                  <h3 className="font-semibold text-foreground text-sm">Ponto de Partida</h3>
                  {startingPoint.latitude && (
                    <p className="text-xs text-green-600 truncate max-w-[180px]">{startingPoint.address || "GPS"}</p>
                  )}
                </div>
              </div>
              <svg className={`w-5 h-5 text-muted-foreground transition-transform ${expandedPanels.has("origin") ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {expandedPanels.has("origin") && (
              <div className="p-4 pt-0 space-y-3 border-t border-border">
                <button
                  onClick={getCurrentLocation}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition ${
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

                <Autocomplete
                  onLoad={(autocomplete) => setStartingPointAutocomplete(autocomplete)}
                  onPlaceChanged={onStartingPointPlaceSelect}
                  options={{
                    componentRestrictions: { country: "pt" },
                    types: ["address"]
                  }}
                >
                  <input
                    type="text"
                    placeholder="Pesquisar morada..."
                    className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </Autocomplete>
              </div>
            )}
          </div>

          {/* Step 2: Filter & Select Locations */}
          <div className="bg-card rounded-xl shadow-sm overflow-hidden">
            <button
              onClick={() => togglePanel("locations")}
              className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition"
            >
              <div className="flex items-center gap-3">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  selectedLocations.length > 0 ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"
                }`}>
                  {selectedLocations.length > 0 ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : "2"}
                </span>
                <div className="text-left">
                  <h3 className="font-semibold text-foreground text-sm">Selecionar Destinos</h3>
                  <p className="text-xs text-muted-foreground">{filteredLocations.length} locais disponíveis</p>
                </div>
              </div>
              <svg className={`w-5 h-5 text-muted-foreground transition-transform ${expandedPanels.has("locations") ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {expandedPanels.has("locations") && (
              <div className="border-t border-border">
                {/* Compact Filters */}
                <div className="p-3 border-b border-border bg-muted/30 space-y-2">
                  {/* Search */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Pesquisar..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>

                  {/* Filter Row */}
                  <div className="flex gap-2">
                    {/* Type Dropdown */}
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value as typeof filterType)}
                      className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="all">Todos os tipos</option>
                      <option value="cliente">Clientes</option>
                      <option value="prospecto">Prospectos</option>
                    </select>

                    {/* District Dropdown */}
                    <select
                      value={filterDistrict}
                      onChange={(e) => setFilterDistrict(e.target.value)}
                      className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Todos os distritos</option>
                      {availableDistricts.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  {/* Estado Filter for Prospectos */}
                  {filterType !== "cliente" && (
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
                          className={`px-2 py-1 rounded text-xs font-medium transition ${
                            filterStates.includes(state.value)
                              ? state.color + " ring-1 ring-offset-1 ring-gray-400"
                              : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                          }`}
                        >
                          {state.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Location List */}
                <div className="max-h-[350px] overflow-y-auto">
                  {Object.keys(locationsByDistrict).length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">Nenhum local encontrado</p>
                  ) : (
                    <div className="divide-y divide-border">
                      {Object.entries(locationsByDistrict).map(([district, locs]) => (
                        <div key={district}>
                          <div className="flex items-center justify-between px-3 py-2 bg-muted/50 sticky top-0">
                            <h4 className="text-xs font-semibold text-primary uppercase tracking-wide flex items-center gap-1.5">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              </svg>
                              {district}
                              <span className="text-muted-foreground font-normal">({locs.length})</span>
                            </h4>
                            <button
                              onClick={() => selectAllInDistrict(district)}
                              className="text-xs text-primary hover:underline font-medium"
                            >
                              {locs.filter(l => l.latitude).every(l => selectedLocations.includes(l.id)) ? "Desmarcar" : "Todos"}
                            </button>
                          </div>
                          <div className="divide-y divide-border/50">
                            {locs.map(loc => {
                              const routeIndex = getRouteIndex(loc.id)
                              const isInRoute = routeIndex >= 0

                              return (
                                <div key={loc.id}>
                                  <label
                                    className={`flex items-start gap-2 p-3 cursor-pointer transition ${
                                      selectedLocations.includes(loc.id)
                                        ? "bg-primary/5"
                                        : loc.latitude ? "hover:bg-muted/30" : "bg-red-50/50 dark:bg-red-900/10"
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
                                        {isInRoute && (
                                          <span className="w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                                            {getRouteLetter(routeIndex + 1)}
                                          </span>
                                        )}
                                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                          loc.tipo === "cliente" ? "bg-blue-500" : "bg-orange-500"
                                        }`} />
                                        <span className="text-sm font-medium text-foreground truncate">{loc.nome}</span>
                                      </div>
                                      {loc.morada && (
                                        <p className="text-xs text-muted-foreground truncate mt-0.5">{loc.morada}</p>
                                      )}
                                      {loc.tipo === "prospecto" && loc.estado && (
                                        <div className="mt-1">{getStateBadge(loc.estado)}</div>
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
                                          className="text-xs text-red-600 hover:underline mt-1"
                                        >
                                          + Adicionar morada
                                        </button>
                                      )}
                                    </div>
                                  </label>

                                  {editingLocation === loc.id && (
                                    <div className="p-3 bg-secondary/50 space-y-2">
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
                                          {geocodingInline ? "..." : "Localizar"}
                                        </button>
                                        <button
                                          onClick={() => {
                                            setPinpointingLocation({ id: loc.id, tipo: loc.tipo })
                                            Swal.fire({
                                              icon: "info",
                                              title: "Marcar no mapa",
                                              text: "Clique no mapa para definir a localização",
                                              confirmButtonColor: "#10b981",
                                              timer: 3000
                                            })
                                          }}
                                          className="px-3 py-1.5 bg-primary text-white rounded text-xs font-medium hover:bg-primary-hover"
                                        >
                                          Mapa
                                        </button>
                                        <button
                                          onClick={() => {
                                            setEditingLocation(null)
                                            setEditAddress({ morada: "", cidade: "", codigoPostal: "" })
                                          }}
                                          className="px-3 py-1.5 bg-secondary text-foreground rounded text-xs"
                                        >
                                          X
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Step 3: Calculate - Always visible as CTA */}
          <button
            onClick={() => {
              if (!startingPoint.latitude && !startingPoint.longitude) {
                Swal.fire({
                  icon: "warning",
                  title: "Ponto de partida",
                  text: "Define o ponto de partida primeiro (Passo 1)",
                  confirmButtonColor: "#10b981"
                })
                setExpandedPanels(prev => new Set([...prev, "origin"]))
                return
              }
              if (selectedLocations.length === 0) {
                Swal.fire({
                  icon: "info",
                  title: "Sem destinos",
                  text: "Seleciona pelo menos um destino (Passo 2)",
                  confirmButtonColor: "#10b981"
                })
                setExpandedPanels(prev => new Set([...prev, "locations"]))
                return
              }
              calculateRoute()
            }}
            disabled={calculatingRoute}
            className={`w-full flex items-center justify-center gap-3 px-5 py-4 rounded-xl font-bold text-lg transition shadow-lg ${
              canCalculateRoute
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {calculatingRoute ? (
              <>
                <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                A calcular...
              </>
            ) : (
              <>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                Calcular Rota
              </>
            )}
          </button>
        </div>

        {/* Right Panel - Map & Route */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-3 order-1 lg:order-2">
          {/* Route Results Summary */}
          {totalDistance && (
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl shadow-lg p-4">
              <div className="flex flex-wrap items-center gap-4 mb-3">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <div>
                    <p className="text-xs text-emerald-100">Distância</p>
                    <p className="font-bold text-lg">{totalDistance}</p>
                  </div>
                </div>
                <div className="w-px h-10 bg-emerald-400/50"></div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-xs text-emerald-100">Duração</p>
                    <p className="font-bold text-lg">{totalDuration}</p>
                  </div>
                </div>
                {costs.custoTotal && costs.custoTotal > 0 && (
                  <>
                    <div className="w-px h-10 bg-emerald-400/50"></div>
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="text-xs text-emerald-100">Custo Est.</p>
                        <p className="font-bold text-lg">€{costs.custoTotal.toFixed(2)}</p>
                      </div>
                    </div>
                  </>
                )}
                <div className="flex-1"></div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowCostPanel(!showCostPanel)}
                    className="flex items-center gap-1 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Custos
                  </button>
                  <button
                    onClick={clearRoute}
                    className="flex items-center gap-1 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Limpar
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-emerald-400/30">
                <input
                  type="text"
                  placeholder="Nome da rota (opcional)"
                  value={routeName}
                  onChange={(e) => setRouteName(e.target.value)}
                  className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-sm placeholder-emerald-200 focus:outline-none focus:ring-2 focus:ring-white/30"
                />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
                />
                <button
                  onClick={saveRoute}
                  disabled={savingRoute}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-emerald-600 rounded-lg text-sm font-bold hover:bg-emerald-50 disabled:opacity-50 transition"
                >
                  {savingRoute ? "..." : "Guardar Rota"}
                </button>
              </div>
            </div>
          )}

          {/* Cost Panel */}
          {showCostPanel && optimizedRoute.length > 0 && (
            <div className="bg-card rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Estimativa de Custos
                </h3>
                <button onClick={() => setShowCostPanel(false)} className="text-muted-foreground hover:text-foreground">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Portagens (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={costs.custoPortagens || ""}
                    onChange={(e) => {
                      const val = e.target.value ? parseFloat(e.target.value) : null
                      setCosts(prev => ({
                        ...prev,
                        custoPortagens: val,
                        custoTotal: (val || 0) + (prev.custoCombuistivel || 0) + (prev.custoEstacionamento || 0) || null
                      }))
                    }}
                    className="w-full px-2 py-1.5 bg-secondary border border-border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Consumo (L/100km)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={costs.consumoMedio}
                    onChange={(e) => setCosts(prev => ({ ...prev, consumoMedio: parseFloat(e.target.value) || DEFAULT_CONSUMO_MEDIO }))}
                    className="w-full px-2 py-1.5 bg-secondary border border-border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Preço GPL (€/L)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={costs.precoLitro}
                    onChange={(e) => setCosts(prev => ({ ...prev, precoLitro: parseFloat(e.target.value) || DEFAULT_PRECO_LITRO }))}
                    className="w-full px-2 py-1.5 bg-secondary border border-border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Combustível (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={costs.custoCombuistivel?.toFixed(2) || ""}
                    readOnly
                    className="w-full px-2 py-1.5 bg-muted border border-border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Estacionamento (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={costs.custoEstacionamento || totalParkingCost || ""}
                    onChange={(e) => {
                      const val = e.target.value ? parseFloat(e.target.value) : null
                      setCosts(prev => ({
                        ...prev,
                        custoEstacionamento: val,
                        custoTotal: (prev.custoPortagens || 0) + (prev.custoCombuistivel || 0) + (val || 0) || null
                      }))
                    }}
                    className="w-full px-2 py-1.5 bg-secondary border border-border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Total</label>
                  <div className="px-2 py-1.5 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg text-sm font-bold text-green-700 dark:text-green-400">
                    €{(costs.custoTotal || 0).toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="mt-3">
                <input
                  type="text"
                  placeholder="Notas sobre custos..."
                  value={costs.notasCustos}
                  onChange={(e) => setCosts(prev => ({ ...prev, notasCustos: e.target.value }))}
                  className="w-full px-2 py-1.5 bg-secondary border border-border rounded-lg text-sm"
                />
              </div>
            </div>
          )}

          {/* Parking Stops */}
          {parkingStops.length > 0 && (
            <div className="bg-card rounded-xl shadow-sm p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Paragens ({parkingStops.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {parkingStops.map((parking, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <span className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">P</span>
                    <span className="text-sm font-medium text-foreground">{parking.nome}</span>
                    <input
                      type="number"
                      step="0.50"
                      placeholder="€"
                      value={parking.custoEstimado || ""}
                      onChange={(e) => updateParkingCost(i, e.target.value ? parseFloat(e.target.value) : null)}
                      className="w-14 px-2 py-1 bg-card border border-border rounded text-xs text-center"
                    />
                    <button
                      onClick={() => removeParkingStop(i)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pinpointing Mode Indicator */}
          {pinpointingLocation && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                <span className="text-sm font-medium text-blue-600">Clique no mapa para marcar a localização</span>
              </div>
              <button
                onClick={() => setPinpointingLocation(null)}
                className="px-3 py-1 bg-primary text-white rounded-lg text-xs font-medium"
              >
                Cancelar
              </button>
            </div>
          )}

          {/* Address Search Bar */}
          {isLoaded && (
            <div className="relative">
              <Autocomplete
                onLoad={(autocomplete) => setSearchAutocomplete(autocomplete)}
                onPlaceChanged={onPlaceSelected}
                options={{
                  componentRestrictions: { country: "pt" },
                  fields: ["formatted_address", "geometry", "name"],
                }}
              >
                <input
                  type="text"
                  placeholder="Pesquisar endereço no mapa..."
                  className="w-full pl-10 pr-10 py-3 border border-border rounded-xl bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </Autocomplete>
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchMarker && (
                <button
                  onClick={() => setSearchMarker(null)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          )}

          {/* Map */}
          <div className="bg-card rounded-xl shadow-sm overflow-hidden h-[400px] sm:h-[500px] lg:h-[550px]">
            {isLoaded ? (
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={mapCenter}
                zoom={10}
                onLoad={(map) => setMapInstance(map)}
                onClick={handleMapClick}
                options={{
                  fullscreenControl: true,
                  zoomControl: true,
                  streetViewControl: false,
                  mapTypeControl: false,
                  draggableCursor: pinpointingLocation ? "crosshair" : undefined,
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

                {searchMarker && (
                  <Marker
                    position={{ lat: searchMarker.lat, lng: searchMarker.lng }}
                    icon={{
                      path: google.maps.SymbolPath.CIRCLE,
                      scale: 12,
                      fillColor: "#8b5cf6",
                      fillOpacity: 1,
                      strokeColor: "#fff",
                      strokeWeight: 2,
                    }}
                    title={searchMarker.address}
                  />
                )}

                {parkingStops.map((parking, i) => (
                  <Marker
                    key={`parking-${i}`}
                    position={{ lat: parking.lat, lng: parking.lng }}
                    icon={{
                      path: google.maps.SymbolPath.CIRCLE,
                      scale: 8,
                      fillColor: "#3b82f6",
                      fillOpacity: 1,
                      strokeColor: "#fff",
                      strokeWeight: 2,
                    }}
                    title={parking.nome}
                  />
                ))}

                {directions ? (
                  <DirectionsRenderer
                    directions={directions}
                    options={{
                      suppressMarkers: false,
                      markerOptions: {
                        clickable: true
                      }
                    }}
                  />
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
                        title={`${loc.nome}${loc.morada ? ` - ${loc.morada}` : ""}${loc.cidade ? `, ${loc.cidade}` : ""}`}
                        onClick={() => setSelectedMarker(loc)}
                      />
                    ))
                )}

                {selectedMarker && (
                  <InfoWindow
                    position={{ lat: selectedMarker.latitude!, lng: selectedMarker.longitude! }}
                    onCloseClick={() => setSelectedMarker(null)}
                  >
                    <div className="p-1 min-w-[180px]">
                      <h4 className="font-bold text-gray-900 text-sm">{selectedMarker.nome}</h4>
                      <p className="text-xs text-gray-600 capitalize mt-0.5">
                        {selectedMarker.tipo === "cliente" ? "Cliente" : "Prospecto"}
                      </p>
                      {selectedMarker.morada && (
                        <p className="text-xs text-gray-500 mt-1">{selectedMarker.morada}</p>
                      )}
                      {selectedMarker.telefone && (
                        <a href={`tel:${selectedMarker.telefone}`} className="text-xs text-blue-600 mt-1 block hover:underline">
                          {selectedMarker.telefone}
                        </a>
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
                <h3 className="font-semibold text-foreground">Ordem Otimizada ({optimizedRoute.length} paragens)</h3>
                <div className="hidden lg:flex gap-2">
                  <button
                    onClick={() => openNavigation("google")}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary-hover"
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
                <div className="flex items-center gap-3 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <span className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold">A</span>
                  <span className="text-sm font-medium text-foreground">Ponto de Partida</span>
                  <span className="text-xs text-muted-foreground truncate flex-1">{startingPoint.address || "GPS"}</span>
                </div>

                {optimizedRoute.map((loc, i) => (
                  <div key={loc.id}>
                    <div className="flex items-center gap-3 p-2 bg-secondary/50 rounded-lg">
                      <span className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-bold">
                        {getRouteLetter(i + 1)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground truncate">{loc.nome}</span>
                          <span className={`w-2 h-2 rounded-full ${loc.tipo === "cliente" ? "bg-blue-500" : "bg-orange-500"}`} />
                        </div>
                        {loc.morada && (
                          <p className="text-xs text-muted-foreground truncate">{loc.morada}</p>
                        )}
                      </div>
                    </div>

                    {i < optimizedRoute.length - 1 && (
                      <div className="flex gap-2 ml-9 my-2">
                        <button
                          onClick={() => findNearbyPlaces(loc.latitude!, loc.longitude!, "parking", i)}
                          className="text-xs text-blue-600 bg-blue-500/10 hover:bg-blue-500/20 px-2 py-1.5 rounded-lg flex items-center gap-1.5 transition"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          Parking
                        </button>
                        <button
                          onClick={() => findNearbyPlaces(loc.latitude!, loc.longitude!, "gas_station", i)}
                          className="text-xs text-amber-600 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-1.5 rounded-lg flex items-center gap-1.5 transition"
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
                      <div className="mb-2">
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
                        {nearbyType === "parking" && nearbySearchPoint && (
                          parkingStops.some(p => p.lat === place.latitude && p.lng === place.longitude) ? (
                            <button
                              onClick={() => {
                                const idx = parkingStops.findIndex(p => p.lat === place.latitude && p.lng === place.longitude)
                                if (idx !== -1) removeParkingStop(idx)
                              }}
                              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
                            >
                              ✓ Remover
                            </button>
                          ) : (
                            <button
                              onClick={() => addParkingToRoute(place, nearbySearchPoint.index)}
                              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                            >
                              + Adicionar
                            </button>
                          )
                        )}
                        <button
                          onClick={() => navigateToPlace(place, "google")}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover"
                        >
                          Maps
                        </button>
                        <button
                          onClick={() => navigateToPlace(place, "waze")}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-[#33ccff] text-white rounded-lg text-sm font-medium hover:bg-[#2ab8e6]"
                        >
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

      {/* Mobile Navigation Bar */}
      {optimizedRoute.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-3 z-30 lg:hidden safe-area-bottom">
          <div className="flex gap-2">
            <button
              onClick={() => openNavigation("google")}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-hover"
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
