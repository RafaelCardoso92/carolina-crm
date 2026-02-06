"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, Circle, Polyline } from "@react-google-maps/api"
import { GOOGLE_MAPS_CONFIG } from "@/lib/google-maps"
import Link from "next/link"
import AddProspectFromSalonModal from "./AddProspectFromSalonModal"
import EstadoColorSettings from "./EstadoColorSettings"
import { useEstadoColors } from "@/hooks/useEstadoColors"

const COLORS = { salon: "#F59E0B", user: "#3B82F6", searchPin: "#EF4444", task: "#8B5CF6", overdue: "#DC2626" }

interface MapLocation {
  id: string
  name: string
  type: "cliente" | "prospecto"
  latitude: number
  longitude: number
  cidade: string | null
  morada: string | null
  telefone: string | null
  email: string | null
  estado?: string
  tipoNegocio?: string
}

interface SalonResult {
  placeId: string
  name: string
  address: string
  latitude: number
  longitude: number
  distance: number
  rating?: number
  phone?: string
  website?: string
  photoUrl?: string
}

interface MapTask {
  id: string
  titulo: string
  tipo: string | null
  prioridade: string
  dataVencimento: string | null
  locationId: string
  locationType: "cliente" | "prospecto"
  locationName: string
  latitude: number
  longitude: number
  cidade: string | null
  telefone: string | null
  isOverdue: boolean
}

interface MapStats {
  revenue: Record<string, number>
  maxRevenue: number
  lastVisit: Record<string, string>
  coverage: Record<string, number>
}

const DEFAULT_CENTER = { lat: 39.3999, lng: -8.2245 }
const MAP_OPTIONS = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
  styles: [{ featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }],
}

// Calculate days since date
function daysSince(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

// Get visit status color
function getVisitStatusColor(days: number | null): string {
  if (days === null) return "#9CA3AF" // gray - never visited
  if (days <= 30) return "#22C55E" // green - recent
  if (days <= 60) return "#F59E0B" // amber - moderate
  if (days <= 90) return "#F97316" // orange - needs attention
  return "#EF4444" // red - overdue
}

// Calculate optimal route (nearest neighbor algorithm)
function calculateOptimalRoute(
  points: { id: string; lat: number; lng: number }[],
  startPoint?: { lat: number; lng: number }
): { id: string; lat: number; lng: number }[] {
  if (points.length <= 1) return points

  const remaining = [...points]
  const route: { id: string; lat: number; lng: number }[] = []
  let current = startPoint || remaining[0]

  if (!startPoint && remaining.length > 0) {
    route.push(remaining.shift()!)
    current = route[0]
  }

  while (remaining.length > 0) {
    let nearestIdx = 0
    let nearestDist = Infinity

    for (let i = 0; i < remaining.length; i++) {
      const dist = Math.sqrt(
        Math.pow(remaining[i].lat - current.lat, 2) + Math.pow(remaining[i].lng - current.lng, 2)
      )
      if (dist < nearestDist) {
        nearestDist = dist
        nearestIdx = i
      }
    }

    const nearest = remaining.splice(nearestIdx, 1)[0]
    route.push(nearest)
    current = nearest
  }

  return route
}

export default function UnifiedMap() {
  // Core state
  const [locations, setLocations] = useState<MapLocation[]>([])
  const [cidades, setCidades] = useState<string[]>([])
  const [salons, setSalons] = useState<SalonResult[]>([])
  const [stats, setStats] = useState<MapStats | null>(null)
  const [tasks, setTasks] = useState<{ today: MapTask[]; overdue: MapTask[] }>({ today: [], overdue: [] })

  // Selection state
  const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(null)
  const [selectedSalon, setSelectedSalon] = useState<SalonResult | null>(null)
  const [selectedTask, setSelectedTask] = useState<MapTask | null>(null)
  const [salonToAdd, setSalonToAdd] = useState<SalonResult | null>(null)

  // Filter state
  const [typeFilter, setTypeFilter] = useState<"all" | "clients" | "prospects">("all")
  const [estadoFilter, setEstadoFilter] = useState<string>("")
  const [cidadeFilter, setCidadeFilter] = useState<string>("")
  const [visitFilter, setVisitFilter] = useState<string>("")

  // Search state
  const [searchPin, setSearchPin] = useState<{ lat: number; lng: number } | null>(null)
  const [isPlacingPin, setIsPlacingPin] = useState(false)
  const [searchRadius, setSearchRadius] = useState(2)
  const [searchingNearby, setSearchingNearby] = useState(false)

  // UI state
  const [loading, setLoading] = useState(true)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [showLegend, setShowLegend] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [showColorSettings, setShowColorSettings] = useState(false)
  const [activePanel, setActivePanel] = useState<"filters" | "route" | "tasks" | "nearby" | null>("filters")

  // Route planner state
  const [routeMode, setRouteMode] = useState(false)
  const [selectedForRoute, setSelectedForRoute] = useState<Set<string>>(new Set())
  const [optimizedRoute, setOptimizedRoute] = useState<{ id: string; lat: number; lng: number }[]>([])

  // Near me state
  const [nearbyLocations, setNearbyLocations] = useState<MapLocation[]>([])
  const [nearbyRadius, setNearbyRadius] = useState(2) // km

  // Quick visit state
  const [showQuickVisit, setShowQuickVisit] = useState(false)
  const [quickVisitTarget, setQuickVisitTarget] = useState<{ type: "cliente" | "prospecto"; id: string; name: string } | null>(null)
  const [quickVisitNote, setQuickVisitNote] = useState("")
  const [savingVisit, setSavingVisit] = useState(false)

  const { colors: estadoColors, getColor, getLabel } = useEstadoColors()

  const hasInitialFit = useRef(false)
  const { isLoaded, loadError } = useJsApiLoader(GOOGLE_MAPS_CONFIG)

  // Fetch user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.error("Location error:", err),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      )
    }
  }, [])

  // Fetch locations when filters change
  useEffect(() => { fetchLocations() }, [typeFilter, estadoFilter, cidadeFilter])

  // Fetch stats and tasks
  useEffect(() => {
    fetchStats()
    fetchTasks()
  }, [])

  // Update nearby locations when user location changes
  useEffect(() => {
    if (userLocation && locations.length > 0) {
      updateNearbyLocations()
    }
  }, [userLocation, locations, nearbyRadius])

  // Initial fit bounds
  useEffect(() => {
    if (!map || !isLoaded || hasInitialFit.current) return
    if (locations.length === 0 && !userLocation) return

    const bounds = new google.maps.LatLngBounds()
    let hasPoints = false

    locations.forEach((loc) => { bounds.extend({ lat: loc.latitude, lng: loc.longitude }); hasPoints = true })
    if (userLocation) { bounds.extend(userLocation); hasPoints = true }

    if (hasPoints) {
      map.fitBounds(bounds)
      google.maps.event.addListenerOnce(map, "idle", () => {
        const zoom = map.getZoom()
        if (zoom && zoom > 14) map.setZoom(14)
      })
      hasInitialFit.current = true
    }
  }, [map, locations, userLocation, isLoaded])

  // Calculate optimized route when selection changes
  useEffect(() => {
    if (selectedForRoute.size > 0) {
      const points = locations
        .filter((l) => selectedForRoute.has(`${l.type}-${l.id}`))
        .map((l) => ({ id: `${l.type}-${l.id}`, lat: l.latitude, lng: l.longitude }))
      const route = calculateOptimalRoute(points, userLocation || undefined)
      setOptimizedRoute(route)
    } else {
      setOptimizedRoute([])
    }
  }, [selectedForRoute, locations, userLocation])

  async function fetchLocations() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (typeFilter !== "all") params.set("type", typeFilter)
      if (estadoFilter) params.set("estado", estadoFilter)
      if (cidadeFilter) params.set("cidade", cidadeFilter)
      const res = await fetch(`/api/mapa?${params}`)
      if (res.ok) {
        const data = await res.json()
        setLocations(data.locations || [])
        if (data.cidades) setCidades(data.cidades)
      }
    } catch (err) { console.error("Fetch error:", err) }
    finally { setLoading(false) }
  }

  async function fetchStats() {
    try {
      const res = await fetch("/api/mapa/stats")
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (err) { console.error("Stats error:", err) }
  }

  async function fetchTasks() {
    try {
      const res = await fetch("/api/mapa/tarefas")
      if (res.ok) {
        const data = await res.json()
        setTasks({ today: data.today || [], overdue: data.overdue || [] })
      }
    } catch (err) { console.error("Tasks error:", err) }
  }

  function updateNearbyLocations() {
    if (!userLocation) return
    const nearby = locations.filter((loc) => {
      const dist = Math.sqrt(
        Math.pow((loc.latitude - userLocation.lat) * 111, 2) +
        Math.pow((loc.longitude - userLocation.lng) * 111 * Math.cos(userLocation.lat * Math.PI / 180), 2)
      )
      return dist <= nearbyRadius
    })
    setNearbyLocations(nearby)
  }

  async function searchNearbySalons(center: { lat: number; lng: number }) {
    setSearchingNearby(true)
    setSalons([])
    try {
      const res = await fetch("/api/mapa/salons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat: center.lat, lng: center.lng, radius: searchRadius * 1000 }),
      })
      if (res.ok) {
        const data = await res.json()
        setSalons(data.salons || [])
        if (map) {
          map.panTo(center)
          const currentZoom = map.getZoom()
          if (currentZoom && currentZoom < 13) map.setZoom(13)
        }
        if (!data.salons?.length) alert("Nenhum salao encontrado.")
      }
    } catch (err) { console.error("Search error:", err) }
    finally { setSearchingNearby(false) }
  }

  async function logQuickVisit() {
    if (!quickVisitTarget) return
    setSavingVisit(true)
    try {
      const res = await fetch("/api/mapa/visita", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          [quickVisitTarget.type === "cliente" ? "clienteId" : "prospectoId"]: quickVisitTarget.id,
          notas: quickVisitNote || null,
        }),
      })
      if (res.ok) {
        setShowQuickVisit(false)
        setQuickVisitTarget(null)
        setQuickVisitNote("")
        fetchStats() // Refresh stats to show updated visit
        alert("Visita registada!")
      }
    } catch (err) { console.error("Visit error:", err) }
    finally { setSavingVisit(false) }
  }

  async function completeTask(taskId: string) {
    try {
      const res = await fetch("/api/mapa/visita", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tarefaId: taskId }),
      })
      if (res.ok) {
        fetchTasks()
        setSelectedTask(null)
        alert("Tarefa concluida!")
      }
    } catch (err) { console.error("Task error:", err) }
  }

  const onMapLoad = useCallback((m: google.maps.Map) => setMap(m), [])
  const onMapUnmount = useCallback(() => setMap(null), [])

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (isPlacingPin && e.latLng) {
      setSearchPin({ lat: e.latLng.lat(), lng: e.latLng.lng() })
      setIsPlacingPin(false)
      map?.panTo({ lat: e.latLng.lat(), lng: e.latLng.lng() })
    } else {
      setSelectedLocation(null)
      setSelectedSalon(null)
      setSelectedTask(null)
    }
  }

  const handleMarkerClick = (loc: MapLocation) => {
    if (routeMode) {
      const key = `${loc.type}-${loc.id}`
      const newSelected = new Set(selectedForRoute)
      if (newSelected.has(key)) {
        newSelected.delete(key)
      } else {
        newSelected.add(key)
      }
      setSelectedForRoute(newSelected)
    } else {
      setSelectedLocation(loc)
      setSelectedSalon(null)
      setSelectedTask(null)
    }
  }

  const openInMaps = () => {
    if (optimizedRoute.length === 0) return
    const waypoints = optimizedRoute.map((p) => `${p.lat},${p.lng}`).join("/")
    const origin = userLocation ? `${userLocation.lat},${userLocation.lng}` : waypoints.split("/")[0]
    const url = `https://www.google.com/maps/dir/${origin}/${waypoints}`
    window.open(url, "_blank")
  }

  const openSingleNavigation = (lat: number, lng: number) => {
    const origin = userLocation ? `${userLocation.lat},${userLocation.lng}` : ""
    const url = `https://www.google.com/maps/dir/${origin}/${lat},${lng}`
    window.open(url, "_blank")
  }

  const openWhatsApp = (phone: string, name: string) => {
    const cleanPhone = phone.replace(/\D/g, "")
    const message = encodeURIComponent(`Ola ${name}, tudo bem?`)
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, "_blank")
  }

  // Filter locations by visit status
  const filteredLocations = locations.filter((loc) => {
    if (!visitFilter) return true
    const key = `${loc.type}-${loc.id}`
    const lastVisit = stats?.lastVisit[key]
    const days = daysSince(lastVisit)

    if (visitFilter === "never" && days === null) return true
    if (visitFilter === "30" && days !== null && days > 30) return true
    if (visitFilter === "60" && days !== null && days > 60) return true
    if (visitFilter === "90" && days !== null && days > 90) return true
    if (visitFilter === "recent" && days !== null && days <= 30) return true
    return !visitFilter
  })

  if (loadError) return <div className="h-64 bg-white rounded-2xl border flex items-center justify-center"><p className="text-red-600">Erro ao carregar o mapa</p></div>
  if (!isLoaded) return <div className="h-64 bg-white rounded-2xl border flex items-center justify-center"><p className="text-gray-500 animate-pulse">A carregar mapa...</p></div>

  // Icons
  const clientIcon = { url: "/babor-rose.png", scaledSize: new google.maps.Size(22, 32), anchor: new google.maps.Point(11, 16) }

  const getProspectIcon = (estado: string, isSelected: boolean = false) => ({
    path: google.maps.SymbolPath.CIRCLE,
    fillColor: getColor(estado || "NOVO"),
    fillOpacity: 1,
    strokeColor: isSelected ? "#000" : "#fff",
    strokeWeight: isSelected ? 3 : 2,
    scale: isSelected ? 14 : 10,
  })

  const taskIcon = (isOverdue: boolean) => ({
    path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
    fillColor: isOverdue ? COLORS.overdue : COLORS.task,
    fillOpacity: 1,
    strokeColor: "#fff",
    strokeWeight: 2,
    scale: 7,
  })

  const salonIcon = {
    path: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
    fillColor: COLORS.salon, fillOpacity: 1, strokeColor: "#fff", strokeWeight: 2, scale: 1.2,
    anchor: new google.maps.Point(12, 12),
  }

  const searchPinIcon = { path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW, fillColor: COLORS.searchPin, fillOpacity: 1, strokeColor: "#fff", strokeWeight: 2, scale: 6 }
  const userIcon = { path: google.maps.SymbolPath.CIRCLE, fillColor: COLORS.user, fillOpacity: 1, strokeColor: "#fff", strokeWeight: 3, scale: 8 }

  const clientCount = filteredLocations.filter((l) => l.type === "cliente").length
  const prospectCount = filteredLocations.filter((l) => l.type === "prospecto").length

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActivePanel(activePanel === "filters" ? null : "filters")}
            className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${activePanel === "filters" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
            Filtros
          </button>
          <button
            onClick={() => { setActivePanel(activePanel === "route" ? null : "route"); if (activePanel !== "route") setRouteMode(true); else { setRouteMode(false); setSelectedForRoute(new Set()); } }}
            className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${activePanel === "route" ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
            Rota ({selectedForRoute.size})
          </button>
          <button
            onClick={() => setActivePanel(activePanel === "tasks" ? null : "tasks")}
            className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${activePanel === "tasks" ? "bg-violet-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
            Agenda ({tasks.today.length + tasks.overdue.length})
          </button>
          <button
            onClick={() => setActivePanel(activePanel === "nearby" ? null : "nearby")}
            className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${activePanel === "nearby" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
            Perto ({nearbyLocations.length})
          </button>
          <button
            onClick={() => setShowColorSettings(true)}
            className="px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 bg-gray-100 text-gray-700 hover:bg-gray-200 ml-auto"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>
          </button>
        </div>
      </div>

      {/* Panels */}
      {activePanel === "filters" && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setTypeFilter("all")} className={`px-3 py-2 rounded-lg text-sm font-medium ${typeFilter === "all" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700"}`}>Todos ({filteredLocations.length})</button>
            <button onClick={() => setTypeFilter("clients")} className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${typeFilter === "clients" ? "bg-green-600 text-white" : "bg-gray-100 text-gray-700"}`}>
              <img src="/babor-rose.png" alt="" className="h-4 w-auto" />Clientes ({clientCount})
            </button>
            <button onClick={() => setTypeFilter("prospects")} className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${typeFilter === "prospects" ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-700"}`}>Prospectos ({prospectCount})</button>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            {typeFilter !== "clients" && (
              <select value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value)} className="flex-1 px-3 py-2 bg-gray-50 border rounded-lg text-sm">
                <option value="">Todos os estados</option>
                {estadoColors.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
              </select>
            )}
            <select value={cidadeFilter} onChange={(e) => setCidadeFilter(e.target.value)} className="flex-1 px-3 py-2 bg-gray-50 border rounded-lg text-sm">
              <option value="">Todas as cidades</option>
              {cidades.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={visitFilter} onChange={(e) => setVisitFilter(e.target.value)} className="flex-1 px-3 py-2 bg-gray-50 border rounded-lg text-sm">
              <option value="">Ultima visita</option>
              <option value="never">Nunca visitado</option>
              <option value="90">+90 dias</option>
              <option value="60">+60 dias</option>
              <option value="30">+30 dias</option>
              <option value="recent">Recente (30 dias)</option>
            </select>
          </div>
          {/* Salon Search */}
          <div className="bg-amber-50 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">Procurar Saloes</span>
              <div className="flex gap-2">
                <button onClick={() => setIsPlacingPin(!isPlacingPin)} className={`px-2 py-1 rounded text-xs font-medium ${isPlacingPin ? "bg-red-500 text-white" : "bg-white border"}`}>
                  {isPlacingPin ? "Clique no mapa" : "Marcar"}
                </button>
                {searchPin && <button onClick={() => searchNearbySalons(searchPin)} disabled={searchingNearby} className="px-2 py-1 bg-amber-500 text-white rounded text-xs font-medium">Procurar</button>}
                {userLocation && <button onClick={() => searchNearbySalons(userLocation)} disabled={searchingNearby} className="px-2 py-1 bg-blue-500 text-white rounded text-xs font-medium">Perto de mim</button>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600">Raio:</span>
              <input type="range" min={0.5} max={5} step={0.5} value={searchRadius} onChange={(e) => setSearchRadius(Number(e.target.value))} className="flex-1 h-1.5 accent-amber-500" />
              <span className="text-xs font-medium text-amber-600">{searchRadius}km</span>
            </div>
          </div>
        </div>
      )}

      {activePanel === "route" && (
        <div className="bg-purple-50 rounded-xl border border-purple-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Planear Rota</h3>
              <p className="text-xs text-gray-600">Clique nos marcadores para adicionar a rota</p>
            </div>
            {selectedForRoute.size > 0 && (
              <button onClick={() => setSelectedForRoute(new Set())} className="text-xs text-gray-500 hover:text-gray-700">Limpar</button>
            )}
          </div>
          {selectedForRoute.size > 0 && (
            <>
              <div className="bg-white rounded-lg p-3">
                <div className="text-sm text-gray-600 mb-2">{selectedForRoute.size} pontos selecionados</div>
                <div className="space-y-1">
                  {optimizedRoute.map((p, i) => {
                    const loc = locations.find((l) => `${l.type}-${l.id}` === p.id)
                    return loc ? (
                      <div key={p.id} className="flex items-center gap-2 text-sm">
                        <span className="w-5 h-5 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs">{i + 1}</span>
                        <span className="flex-1 truncate">{loc.name}</span>
                        <span className="text-xs text-gray-500">{loc.cidade}</span>
                      </div>
                    ) : null
                  })}
                </div>
              </div>
              <button onClick={openInMaps} className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg font-medium flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                Abrir no Google Maps
              </button>
            </>
          )}
        </div>
      )}

      {activePanel === "tasks" && (
        <div className="bg-violet-50 rounded-xl border border-violet-200 p-4 space-y-3">
          <h3 className="font-semibold text-gray-900">Agenda de Hoje</h3>
          {tasks.overdue.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-medium text-red-600 uppercase">Atrasadas ({tasks.overdue.length})</span>
              {tasks.overdue.slice(0, 3).map((t) => (
                <button key={t.id} onClick={() => { setSelectedTask(t); map?.panTo({ lat: t.latitude, lng: t.longitude }) }} className="w-full p-2 bg-red-50 border border-red-200 rounded-lg text-left">
                  <div className="font-medium text-sm text-gray-900 truncate">{t.titulo}</div>
                  <div className="text-xs text-gray-600">{t.locationName}</div>
                </button>
              ))}
            </div>
          )}
          {tasks.today.length > 0 ? (
            <div className="space-y-2">
              <span className="text-xs font-medium text-violet-600 uppercase">Hoje ({tasks.today.length})</span>
              {tasks.today.map((t) => (
                <button key={t.id} onClick={() => { setSelectedTask(t); map?.panTo({ lat: t.latitude, lng: t.longitude }) }} className="w-full p-2 bg-white border rounded-lg text-left">
                  <div className="font-medium text-sm text-gray-900 truncate">{t.titulo}</div>
                  <div className="text-xs text-gray-600">{t.locationName}</div>
                </button>
              ))}
            </div>
          ) : tasks.overdue.length === 0 && (
            <p className="text-sm text-gray-500">Sem tarefas para hoje</p>
          )}
        </div>
      )}

      {activePanel === "nearby" && (
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Perto de Ti</h3>
            <div className="flex items-center gap-2">
              <input type="range" min={1} max={10} value={nearbyRadius} onChange={(e) => setNearbyRadius(Number(e.target.value))} className="w-20 h-1.5 accent-blue-500" />
              <span className="text-xs font-medium text-blue-600">{nearbyRadius}km</span>
            </div>
          </div>
          {userLocation ? (
            nearbyLocations.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {nearbyLocations.slice(0, 10).map((loc) => (
                  <button key={`${loc.type}-${loc.id}`} onClick={() => { setSelectedLocation(loc); map?.panTo({ lat: loc.latitude, lng: loc.longitude }) }} className="w-full p-2 bg-white border rounded-lg text-left flex items-center gap-2">
                    {loc.type === "cliente" ? <img src="/babor-rose.png" alt="" className="h-4 w-auto" /> : <span className="w-3 h-3 rounded-full" style={{ backgroundColor: getColor(loc.estado || "NOVO") }} />}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-900 truncate">{loc.name}</div>
                      <div className="text-xs text-gray-500">{loc.cidade}</div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Nenhum local num raio de {nearbyRadius}km</p>
            )
          ) : (
            <p className="text-sm text-gray-500">A obter localizacao...</p>
          )}
        </div>
      )}

      {/* Map */}
      <div className="bg-white rounded-xl border overflow-hidden relative">
        <GoogleMap
          mapContainerStyle={{ width: "100%", height: "calc(100vh - 300px)", minHeight: "400px", maxHeight: "600px" }}
          center={userLocation || DEFAULT_CENTER}
          zoom={12}
          options={{ ...MAP_OPTIONS, draggableCursor: isPlacingPin ? "crosshair" : routeMode ? "pointer" : undefined }}
          onLoad={onMapLoad}
          onUnmount={onMapUnmount}
          onClick={handleMapClick}
        >
          {/* User location */}
          {userLocation && (
            <>
              <Circle center={userLocation} radius={nearbyRadius * 1000} options={{ fillColor: COLORS.user, fillOpacity: 0.05, strokeColor: COLORS.user, strokeOpacity: 0.3, strokeWeight: 1 }} />
              <Marker position={userLocation} icon={userIcon} title="Tu" zIndex={1000} />
            </>
          )}

          {/* Search pin and radius */}
          {searchPin && (
            <>
              <Circle center={searchPin} radius={searchRadius * 1000} options={{ fillColor: COLORS.searchPin, fillOpacity: 0.08, strokeColor: COLORS.searchPin, strokeOpacity: 0.4, strokeWeight: 2 }} />
              <Marker position={searchPin} icon={searchPinIcon} title="Pesquisa" draggable onDragEnd={(e) => e.latLng && setSearchPin({ lat: e.latLng.lat(), lng: e.latLng.lng() })} zIndex={999} />
            </>
          )}

          {/* Route line */}
          {optimizedRoute.length > 1 && (
            <Polyline
              path={userLocation ? [userLocation, ...optimizedRoute] : optimizedRoute}
              options={{ strokeColor: "#8B5CF6", strokeOpacity: 0.8, strokeWeight: 3, icons: [{ icon: { path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW }, offset: "50%", repeat: "100px" }] }}
            />
          )}

          {/* Client markers */}
          {filteredLocations.filter((l) => l.type === "cliente").map((loc) => (
            <Marker key={`cliente-${loc.id}`} position={{ lat: loc.latitude, lng: loc.longitude }} icon={clientIcon} onClick={() => handleMarkerClick(loc)} title={loc.name} opacity={selectedForRoute.has(`cliente-${loc.id}`) ? 1 : routeMode ? 0.5 : 1} />
          ))}

          {/* Prospect markers */}
          {filteredLocations.filter((l) => l.type === "prospecto").map((loc) => (
            <Marker key={`prospecto-${loc.id}`} position={{ lat: loc.latitude, lng: loc.longitude }} icon={getProspectIcon(loc.estado || "NOVO", selectedForRoute.has(`prospecto-${loc.id}`))} onClick={() => handleMarkerClick(loc)} title={loc.name} />
          ))}

          {/* Task markers */}
          {[...tasks.today, ...tasks.overdue].map((t) => (
            <Marker key={`task-${t.id}`} position={{ lat: t.latitude, lng: t.longitude }} icon={taskIcon(t.isOverdue)} onClick={() => setSelectedTask(t)} title={t.titulo} zIndex={900} />
          ))}

          {/* Salon markers */}
          {salons.map((salon) => (
            <Marker key={salon.placeId} position={{ lat: salon.latitude, lng: salon.longitude }} icon={salonIcon} onClick={() => setSelectedSalon(salon)} title={salon.name} />
          ))}

          {/* Location InfoWindow */}
          {selectedLocation && (
            <InfoWindow position={{ lat: selectedLocation.latitude, lng: selectedLocation.longitude }} onCloseClick={() => setSelectedLocation(null)}>
              <div className="p-1 min-w-[220px] max-w-[280px]">
                <div className="flex items-center gap-2 mb-2">
                  {selectedLocation.type === "cliente" ? (
                    <span className="px-2 py-1 rounded text-xs font-semibold text-white bg-green-600">Cliente</span>
                  ) : (
                    <span className="px-2 py-1 rounded text-xs font-semibold text-white" style={{ backgroundColor: getColor(selectedLocation.estado || "NOVO") }}>{getLabel(selectedLocation.estado || "NOVO")}</span>
                  )}
                  {stats?.lastVisit[`${selectedLocation.type}-${selectedLocation.id}`] && (
                    <span className="text-xs text-gray-500">Visitado ha {daysSince(stats.lastVisit[`${selectedLocation.type}-${selectedLocation.id}`])} dias</span>
                  )}
                </div>
                <h3 className="font-bold text-gray-900 mb-1">{selectedLocation.name}</h3>
                {selectedLocation.cidade && <p className="text-sm text-gray-600 mb-2">{selectedLocation.morada ? `${selectedLocation.morada}, ` : ""}{selectedLocation.cidade}</p>}

                {/* Quick Actions */}
                <div className="grid grid-cols-4 gap-1 mb-2">
                  {selectedLocation.telefone && (
                    <>
                      <a href={`tel:${selectedLocation.telefone}`} className="p-2 bg-green-100 hover:bg-green-200 rounded-lg flex items-center justify-center" title="Ligar">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                      </a>
                      <button onClick={() => openWhatsApp(selectedLocation.telefone!, selectedLocation.name)} className="p-2 bg-green-100 hover:bg-green-200 rounded-lg flex items-center justify-center" title="WhatsApp">
                        <svg className="w-4 h-4 text-green-600" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      </button>
                    </>
                  )}
                  <button onClick={() => openSingleNavigation(selectedLocation.latitude, selectedLocation.longitude)} className="p-2 bg-blue-100 hover:bg-blue-200 rounded-lg flex items-center justify-center" title="Navegar">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                  </button>
                  <button onClick={() => { setQuickVisitTarget({ type: selectedLocation.type, id: selectedLocation.id, name: selectedLocation.name }); setShowQuickVisit(true); setSelectedLocation(null); }} className="p-2 bg-purple-100 hover:bg-purple-200 rounded-lg flex items-center justify-center" title="Registar visita">
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                  </button>
                </div>

                <Link href={`/${selectedLocation.type === "cliente" ? "clientes" : "prospectos"}/${selectedLocation.id}`} className="block w-full text-center px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium rounded-lg">Ver detalhes</Link>
              </div>
            </InfoWindow>
          )}

          {/* Task InfoWindow */}
          {selectedTask && (
            <InfoWindow position={{ lat: selectedTask.latitude, lng: selectedTask.longitude }} onCloseClick={() => setSelectedTask(null)}>
              <div className="p-1 min-w-[220px]">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-1 rounded text-xs font-semibold text-white ${selectedTask.isOverdue ? "bg-red-600" : "bg-violet-600"}`}>
                    {selectedTask.isOverdue ? "Atrasada" : "Hoje"}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 mb-1">{selectedTask.titulo}</h3>
                <p className="text-sm text-gray-600 mb-2">{selectedTask.locationName}</p>
                <div className="flex gap-2">
                  <button onClick={() => completeTask(selectedTask.id)} className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg">Concluir</button>
                  <button onClick={() => openSingleNavigation(selectedTask.latitude, selectedTask.longitude)} className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                  </button>
                </div>
              </div>
            </InfoWindow>
          )}

          {/* Salon InfoWindow */}
          {selectedSalon && (
            <InfoWindow position={{ lat: selectedSalon.latitude, lng: selectedSalon.longitude }} onCloseClick={() => setSelectedSalon(null)}>
              <div className="p-1 min-w-[220px]">
                <span className="px-2 py-1 rounded text-xs font-semibold text-white bg-amber-500 mb-2 inline-block">Salao</span>
                <h3 className="font-bold text-gray-900 mb-1">{selectedSalon.name}</h3>
                <p className="text-sm text-gray-600 mb-2">{selectedSalon.address}</p>
                <button onClick={() => { setSalonToAdd(selectedSalon); setSelectedSalon(null); }} className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg">Adicionar Prospecto</button>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>

        {/* Legend */}
        <button onClick={() => setShowLegend(!showLegend)} className="absolute bottom-3 left-3 px-3 py-2 bg-white border rounded-lg text-xs font-medium shadow-sm">Legenda</button>
        {showLegend && (
          <div className="absolute bottom-12 left-3 bg-white border rounded-xl shadow-lg p-3 text-xs space-y-1.5">
            <div className="flex items-center gap-2"><img src="/babor-rose.png" alt="" className="h-4 w-auto" /><span>Cliente BABOR</span></div>
            {estadoColors.slice(0, 5).map((e) => <div key={e.value} className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: e.color }} /><span>{e.label}</span></div>)}
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-violet-600" /><span>Tarefa hoje</span></div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-600" /><span>Tarefa atrasada</span></div>
            <div className="flex items-center gap-2"><span className="text-amber-500">★</span><span>Salao</span></div>
          </div>
        )}

        {loading && <div className="absolute inset-0 bg-white/60 flex items-center justify-center"><p className="text-gray-500 animate-pulse text-sm">A carregar...</p></div>}
      </div>

      {/* Salon Results */}
      {salons.length > 0 && (
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold">{salons.length} saloes encontrados</span>
            <button onClick={() => { setSalons([]); setSearchPin(null); }} className="text-sm text-gray-500">Limpar</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {salons.slice(0, 8).map((s) => (
              <button key={s.placeId} onClick={() => { setSelectedSalon(s); map?.panTo({ lat: s.latitude, lng: s.longitude }); }} className="p-2 bg-gray-50 hover:bg-amber-50 border rounded-lg text-left">
                <div className="font-medium text-sm truncate">{s.name}</div>
                <div className="text-xs text-gray-500">{(s.distance / 1000).toFixed(1)}km</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {salonToAdd && <AddProspectFromSalonModal salon={salonToAdd} onClose={() => setSalonToAdd(null)} onSuccess={() => { setSalonToAdd(null); fetchLocations(); }} />}
      <EstadoColorSettings isOpen={showColorSettings} onClose={() => setShowColorSettings(false)} />

      {/* Quick Visit Modal */}
      {showQuickVisit && quickVisitTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowQuickVisit(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="font-bold text-lg mb-1">Registar Visita</h3>
            <p className="text-sm text-gray-600 mb-4">{quickVisitTarget.name}</p>
            <textarea
              value={quickVisitNote}
              onChange={(e) => setQuickVisitNote(e.target.value)}
              placeholder="Notas da visita (opcional)"
              className="w-full p-3 border rounded-lg mb-4 text-sm"
              rows={3}
            />
            <div className="flex gap-2">
              <button onClick={() => setShowQuickVisit(false)} className="flex-1 px-4 py-2 border rounded-lg font-medium">Cancelar</button>
              <button onClick={logQuickVisit} disabled={savingVisit} className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium disabled:opacity-50">
                {savingVisit ? "A guardar..." : "Registar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
