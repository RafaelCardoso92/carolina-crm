"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { GoogleMap, useJsApiLoader, Marker, DirectionsRenderer, InfoWindow } from "@react-google-maps/api"
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
  // Match Portuguese postal code format: 4 digits, optional dash/space, 3 digits
  const match = morada.match(/(\d{4})[-\s]?(\d{3})/)
  if (match) {
    return `${match[1]}-${match[2]}`
  }
  return null
}

// Extract city name from address (usually comes after the postal code)
const extractCityFromAddress = (morada: string | null): string | null => {
  if (!morada) return null
  // Match text after postal code (4 digits, dash/space, 3 digits)
  const match = morada.match(/\d{4}[-\s]?\d{3}\s+(.+?)(?:\s*$|\s*,|\s*-\s*[A-Z])/)
  if (match && match[1]) {
    return match[1].trim()
  }
  // Try to get the last word as city name
  const parts = morada.split(/\s+/)
  if (parts.length > 0) {
    const lastPart = parts[parts.length - 1]
    // If it's not a number or postal code, it might be a city
    if (!/^\d/.test(lastPart)) {
      return lastPart
    }
  }
  return null
}

// Portuguese postal code to district mapping
// Format: first 4 digits of postal code -> district
// Falls back to city name if postal code is not available
const getDistrictFromPostalCode = (postalCode: string | null, cityFallback?: string | null): string => {
  if (!postalCode) {
    // Fall back to city if no postal code
    return cityFallback || "Sem Localização"
  }

  // Extract first 4 digits
  const code = postalCode.replace(/\D/g, "").substring(0, 4)
  const num = parseInt(code, 10)

  if (isNaN(num)) {
    return cityFallback || "Sem Localização"
  }

  // Lisboa
  if (num >= 1000 && num <= 1998) return "Lisboa"
  if (num >= 2500 && num <= 2599) return "Leiria" // Caldas da Rainha
  if (num >= 2600 && num <= 2699) return "Lisboa" // Vila Franca de Xira
  if (num >= 2700 && num <= 2799) return "Lisboa" // Amadora
  if (num >= 2800 && num <= 2829) return "Setúbal" // Almada
  if (num >= 2830 && num <= 2999) return "Setúbal"
  if (num >= 2000 && num <= 2139) return "Santarém"
  if (num >= 2140 && num <= 2199) return "Santarém" // Chamusca
  if (num >= 2200 && num <= 2299) return "Santarém" // Abrantes
  if (num >= 2300 && num <= 2399) return "Leiria" // Tomar area
  if (num >= 2400 && num <= 2499) return "Leiria"

  // Coimbra, Aveiro, Viseu
  if (num >= 3000 && num <= 3099) return "Coimbra"
  if (num >= 3100 && num <= 3199) return "Leiria" // Pombal
  if (num >= 3200 && num <= 3299) return "Coimbra" // Lousã
  if (num >= 3300 && num <= 3399) return "Coimbra" // Arganil
  if (num >= 3400 && num <= 3499) return "Coimbra" // Oliveira do Hospital
  if (num >= 3500 && num <= 3599) return "Viseu"
  if (num >= 3600 && num <= 3699) return "Viseu" // Castro Daire
  if (num >= 3700 && num <= 3799) return "Aveiro" // São João da Madeira
  if (num >= 3800 && num <= 3899) return "Aveiro"

  // Porto, Braga, Viana, Vila Real, Bragança
  if (num >= 4000 && num <= 4099) return "Porto"
  if (num >= 4100 && num <= 4199) return "Porto"
  if (num >= 4200 && num <= 4299) return "Porto"
  if (num >= 4300 && num <= 4399) return "Porto"
  if (num >= 4400 && num <= 4499) return "Porto" // Vila Nova de Gaia
  if (num >= 4500 && num <= 4599) return "Aveiro" // Espinho
  if (num >= 4600 && num <= 4699) return "Porto" // Amarante
  if (num >= 4700 && num <= 4799) return "Braga"
  if (num >= 4800 && num <= 4899) return "Braga" // Guimarães
  if (num >= 4900 && num <= 4999) return "Viana do Castelo"
  if (num >= 5000 && num <= 5099) return "Vila Real"
  if (num >= 5100 && num <= 5199) return "Viseu" // Lamego
  if (num >= 5200 && num <= 5299) return "Bragança" // Mogadouro
  if (num >= 5300 && num <= 5399) return "Bragança"
  if (num >= 5400 && num <= 5499) return "Vila Real" // Chaves

  // Castelo Branco, Guarda
  if (num >= 6000 && num <= 6099) return "Castelo Branco"
  if (num >= 6100 && num <= 6199) return "Castelo Branco" // Sertã
  if (num >= 6200 && num <= 6299) return "Castelo Branco" // Covilhã
  if (num >= 6300 && num <= 6399) return "Guarda"

  // Alentejo
  if (num >= 7000 && num <= 7099) return "Évora"
  if (num >= 7100 && num <= 7199) return "Évora" // Estremoz
  if (num >= 7200 && num <= 7299) return "Évora" // Reguengos
  if (num >= 7300 && num <= 7399) return "Portalegre"
  if (num >= 7400 && num <= 7499) return "Portalegre" // Ponte de Sor
  if (num >= 7500 && num <= 7599) return "Setúbal" // Santiago do Cacém
  if (num >= 7600 && num <= 7699) return "Beja" // Aljustrel
  if (num >= 7700 && num <= 7799) return "Beja" // Odemira
  if (num >= 7800 && num <= 7899) return "Beja"

  // Algarve
  if (num >= 8000 && num <= 8999) return "Faro"

  // Islands
  if (num >= 9000 && num <= 9499) return "Madeira"
  if (num >= 9500 && num <= 9999) return "Açores"

  // Unknown postal code, fall back to city
  return cityFallback || "Sem Localização"
}

// Get route letter (A, B, C, etc.)
const getRouteLetter = (index: number): string => {
  return String.fromCharCode(65 + index) // A=65 in ASCII
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

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""
  })

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

  // Get available districts from locations based on postal codes (fallback to city)
  const availableDistricts = useMemo(() => {
    const districts = new Set<string>()
    locations.forEach(loc => {
      // Extract postal code from morada if not in dedicated field
      const postalCode = loc.codigoPostal || extractPostalCodeFromAddress(loc.morada)
      const city = loc.cidade || extractCityFromAddress(loc.morada)
      const district = getDistrictFromPostalCode(postalCode, city)
      if (district !== "Sem Localização") {
        districts.add(district)
      }
    })
    return Array.from(districts).sort()
  }, [locations])

  // Get location's district (or city as fallback)
  // Extracts postal code from morada if codigoPostal field is empty
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

  // Handle map click for pinpointing location
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

      // Update local state
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

      // District filter based on postal code
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

  // Group locations by district (from postal code)
  const locationsByDistrict = useMemo(() => {
    const grouped: Record<string, RouteLocation[]> = {}
    filteredLocations.forEach(loc => {
      const district = getLocationDistrict(loc)
      if (!grouped[district]) grouped[district] = []
      grouped[district].push(loc)
    })
    // Sort districts alphabetically
    return Object.fromEntries(
      Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b))
    )
  }, [filteredLocations, getLocationDistrict])

  // Get the route index for a location (if selected and in optimized route)
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

      const waypointOrder = route.waypoint_order || []
      const optimized: RouteLocation[] = []

      if (waypoints.length > 0) {
        waypointOrder.forEach(i => optimized.push(selected[i]))
        optimized.push(selected[selected.length - 1])
      } else {
        optimized.push(selected[0])
      }

      setOptimizedRoute(optimized)
      setParkingStops([])

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
    setParkingStops(prev => [...prev, newParking])
    setNearbyPanelOpen(false)
  }

  const removeParkingStop = (index: number) => {
    setParkingStops(prev => prev.filter((_, i) => i !== index))
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
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
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
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="hidden sm:inline">A geocodificar...</span>
              </>
            ) : (
              <>
                <span>Geocodificar</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
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

        {routesForSelectedDate.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground mb-2">Rotas para {selectedDate}:</p>
            <div className="flex flex-wrap gap-2">
              {routesForSelectedDate.map(route => (
                <div key={route.id} className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-lg text-sm">
                  <button onClick={() => loadSavedRoute(route)} className="hover:underline">
                    {route.nome || "Rota"} ({route.locais.length} locais)
                    {route.custoTotal && <span className="ml-1 text-xs opacity-75">· €{Number(route.custoTotal).toFixed(2)}</span>}
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
                        {route.custoTotal && <span className="ml-1 text-green-600 font-medium">· €{Number(route.custoTotal).toFixed(2)}</span>}
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
                        title="Eliminar" aria-label="Eliminar"
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
        <div className="lg:col-span-1 space-y-3 lg:space-y-4 order-2 lg:order-1">
          {/* Filters */}
          <div className="bg-card rounded-xl shadow-sm p-4">
            <h3 className="text-xs sm:text-sm font-semibold text-foreground mb-2 sm:mb-3">Filtros</h3>

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
                    onClick={() => setFilterType(opt.value as typeof filterType)}
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

            {/* District Filter - based on postal code */}
            <div className="mb-3">
              <label className="text-xs text-muted-foreground mb-1.5 block">Distrito</label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setFilterDistrict("")}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                    filterDistrict === ""
                      ? "bg-primary text-white"
                      : "bg-secondary text-foreground hover:bg-secondary/80"
                  }`}
                >
                  Todos
                </button>
                {availableDistricts.map(district => (
                  <button
                    key={district}
                    onClick={() => setFilterDistrict(filterDistrict === district ? "" : district)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                      filterDistrict === district
                        ? "bg-primary text-white"
                        : "bg-secondary text-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {district}
                  </button>
                ))}
              </div>
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

          {/* Calcular Rota Button */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl shadow-sm p-2 sm:p-3 border border-emerald-200 dark:border-emerald-800">
            <button
              onClick={() => {
                if (!startingPoint.latitude && !startingPoint.longitude) {
                  Swal.fire({
                    icon: "warning",
                    title: "Ponto de partida não definido",
                    text: "Defina o ponto de partida antes de calcular a rota",
                    confirmButtonColor: "#10b981"
                  })
                  return
                }
                if (selectedLocations.length === 0) {
                  Swal.fire({
                    icon: "info",
                    title: "Nenhum local selecionado",
                    text: "Selecione pelo menos um local para calcular a rota",
                    confirmButtonColor: "#10b981"
                  })
                  return
                }
                calculateRoute()
              }}
              disabled={calculatingRoute}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {calculatingRoute ? (
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              )}
              Calcular Rota
            </button>
          </div>

          {/* Location List - Grouped by District */}
          <div className="bg-card rounded-xl shadow-sm p-4 max-h-[40vh] sm:max-h-[50vh] lg:max-h-[500px] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">
                Locais ({filteredLocations.length})
              </h3>
              <span className="text-xs text-muted-foreground">
                {selectedLocations.length} selecionados
              </span>
            </div>

            {Object.keys(locationsByDistrict).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum local encontrado</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(locationsByDistrict).map(([district, locs]) => (
                  <div key={district}>
                    <div className="flex items-center justify-between mb-1.5 sticky top-0 bg-card py-1">
                      <h4 className="text-xs font-semibold text-primary uppercase tracking-wide flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        {district}
                        <span className="text-muted-foreground font-normal">({locs.length})</span>
                      </h4>
                      <button
                        onClick={() => selectAllInDistrict(district)}
                        className="text-xs text-primary hover:underline"
                      >
                        {locs.filter(l => l.latitude).every(l => selectedLocations.includes(l.id)) ? "Desmarcar" : "Selecionar"} todos
                      </button>
                    </div>
                    <div className="space-y-1">
                      {locs.map(loc => {
                        const routeIndex = getRouteIndex(loc.id)
                        const isInRoute = routeIndex >= 0

                        return (
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
                                  {/* Route letter badge (starts from B since A is starting point) */}
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
                                  <p className="text-xs text-muted-foreground truncate mt-0.5 ml-7">{loc.morada}</p>
                                )}
                                {loc.codigoPostal && (
                                  <p className="text-xs text-muted-foreground/70 ml-7">{loc.codigoPostal} {loc.cidade && `· ${loc.cidade}`}</p>
                                )}
                                {loc.tipo === "prospecto" && loc.estado && (
                                  <div className="mt-0.5 ml-7">{getStateBadge(loc.estado)}</div>
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
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    onClick={() => geocodeInlineAddress(loc.id, loc.tipo)}
                                    disabled={geocodingInline || (!editAddress.morada && !editAddress.cidade)}
                                    className="flex-1 px-3 py-1.5 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700 disabled:opacity-50"
                                  >
                                    {geocodingInline ? "A localizar..." : "Localizar"}
                                  </button>
                                  <button
                                    onClick={() => {
                                      setPinpointingLocation({ id: loc.id, tipo: loc.tipo })
                                      Swal.fire({
                                        icon: "info",
                                        title: "Marcar no mapa",
                                        text: "Clique no mapa para definir a localização exacta",
                                        confirmButtonColor: "#10b981",
                                        timer: 3000
                                      })
                                    }}
                                    className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700"
                                  >
                                    Marcar no mapa
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
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Map & Route */}
        <div className="lg:col-span-2 space-y-3 lg:space-y-4 order-1 lg:order-2">
          {/* Actions */}
          <div className="bg-card rounded-xl shadow-sm p-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={calculateRoute}
                disabled={calculatingRoute || selectedLocations.length === 0 || (!startingPoint.latitude && !startingPoint.longitude)}
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
                <>
                  <button
                    onClick={() => setShowCostPanel(!showCostPanel)}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Custos
                  </button>
                  <button
                    onClick={clearRoute}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-secondary text-foreground rounded-xl font-medium hover:bg-secondary/80 transition"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Limpar
                  </button>
                </>
              )}
            </div>

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
                  {costs.numPortagens && costs.numPortagens > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground">Portagens</p>
                      <p className="font-bold text-amber-600">{costs.numPortagens} · €{(costs.custoPortagens || 0).toFixed(2)}</p>
                    </div>
                  )}
                  {costs.custoTotal && costs.custoTotal > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground">Custo Est.</p>
                      <p className="font-bold text-green-600">€{costs.custoTotal.toFixed(2)}</p>
                    </div>
                  )}
                  {parkingStops.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground">Paragens</p>
                      <p className="font-bold text-blue-600">{parkingStops.length}</p>
                    </div>
                  )}
                </div>

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

          {/* Cost Panel */}
          {showCostPanel && optimizedRoute.length > 0 && (
            <div className="bg-card rounded-xl shadow-sm p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Estimativa de Custos
                {costs.numPortagens && costs.numPortagens > 0 && (
                  <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full ml-2">
                    {costs.numPortagens} portagen{costs.numPortagens > 1 ? "s" : ""} detetada{costs.numPortagens > 1 ? "s" : ""}
                  </span>
                )}
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
                  <label className="text-xs text-muted-foreground block mb-1">Nº Portagens</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={costs.numPortagens || ""}
                    onChange={(e) => setCosts(prev => ({ ...prev, numPortagens: e.target.value ? parseInt(e.target.value) : null }))}
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
                    onChange={(e) => {
                      const val = e.target.value ? parseFloat(e.target.value) : null
                      setCosts(prev => ({
                        ...prev,
                        custoCombuistivel: val,
                        custoTotal: (prev.custoPortagens || 0) + (val || 0) + (prev.custoEstacionamento || 0) || null
                      }))
                    }}
                    className="w-full px-2 py-1.5 bg-secondary border border-border rounded-lg text-sm"
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
              </div>

              <div className="mt-3">
                <label className="text-xs text-muted-foreground block mb-1">Notas</label>
                <input
                  type="text"
                  placeholder="Notas sobre custos..."
                  value={costs.notasCustos}
                  onChange={(e) => setCosts(prev => ({ ...prev, notasCustos: e.target.value }))}
                  className="w-full px-2 py-1.5 bg-secondary border border-border rounded-lg text-sm"
                />
              </div>

              <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                <span className="font-medium text-foreground">Total Estimado:</span>
                <span className="text-xl font-bold text-green-600">€{(costs.custoTotal || 0).toFixed(2)}</span>
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
                Paragens de Estacionamento ({parkingStops.length})
              </h3>
              <div className="space-y-2">
                {parkingStops.map((parking, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <span className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">P</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{parking.nome}</p>
                      {parking.endereco && <p className="text-xs text-muted-foreground truncate">{parking.endereco}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.50"
                        placeholder="€"
                        value={parking.custoEstimado || ""}
                        onChange={(e) => updateParkingCost(i, e.target.value ? parseFloat(e.target.value) : null)}
                        className="w-16 px-2 py-1 bg-card border border-border rounded text-xs text-center"
                      />
                      <button
                        onClick={() => removeParkingStop(i)}
                        className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pinpointing Mode Indicator */}
          {pinpointingLocation && (
            <div className="bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 rounded-xl p-3 mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Clique no mapa para marcar a localização
                </span>
              </div>
              <button
                onClick={() => setPinpointingLocation(null)}
                className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700"
              >
                Cancelar
              </button>
            </div>
          )}

          {/* Map */}
          <div className="bg-card rounded-xl shadow-sm overflow-hidden h-[400px] sm:h-[500px] lg:h-[550px]">
            {isLoaded ? (
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={mapCenter}
                zoom={10}
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
                      {selectedMarker.codigoPostal && (
                        <p className="text-xs text-gray-500">{selectedMarker.codigoPostal} {selectedMarker.cidade}</p>
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
                <h3 className="text-sm font-semibold text-foreground">Ordem Otimizada</h3>
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
                      <span className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-bold">
                        {getRouteLetter(i + 1)}
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
                        {nearbyType === "parking" && nearbySearchPoint && (
                          <button
                            onClick={() => addParkingToRoute(place, nearbySearchPoint.index)}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                          >
                            + Adicionar
                          </button>
                        )}
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

      {/* Mobile Navigation Bar */}
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
