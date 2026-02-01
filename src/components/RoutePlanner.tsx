"use client"

import { useState, useEffect, useCallback } from "react"
import { GoogleMap, useJsApiLoader, Marker, DirectionsRenderer } from "@react-google-maps/api"
import { GOOGLE_MAPS_CONFIG } from "@/lib/google-maps"

interface Location {
  id: string
  nome: string
  morada: string | null
  latitude: number | null
  longitude: number | null
  tipo: "cliente" | "prospecto"
}

interface Props {
  locations: Location[]
}

const mapContainerStyle = {
  width: "100%",
  height: "400px"
}

const defaultCenter = { lat: 38.7223, lng: -9.1393 } // Lisbon

export default function RoutePlanner({ locations }: Props) {
  const [selectedLocations, setSelectedLocations] = useState<string[]>([])
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null)
  const [optimizedRoute, setOptimizedRoute] = useState<Location[]>([])
  const [totalDistance, setTotalDistance] = useState<string>("")
  const [totalDuration, setTotalDuration] = useState<string>("")

  const { isLoaded } = useJsApiLoader(GOOGLE_MAPS_CONFIG)

  const validLocations = locations.filter(l => l.latitude && l.longitude)

  const toggleLocation = (id: string) => {
    setSelectedLocations(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const calculateRoute = useCallback(async () => {
    if (selectedLocations.length < 2) return

    const selected = validLocations.filter(l => selectedLocations.includes(l.id))
    if (selected.length < 2) return

    const directionsService = new google.maps.DirectionsService()

    const origin = { lat: selected[0].latitude!, lng: selected[0].longitude! }
    const destination = { lat: selected[selected.length - 1].latitude!, lng: selected[selected.length - 1].longitude! }
    const waypoints = selected.slice(1, -1).map(l => ({
      location: { lat: l.latitude!, lng: l.longitude! },
      stopover: true
    }))

    try {
      const result = await directionsService.route({
        origin,
        destination,
        waypoints,
        optimizeWaypoints: true,
        travelMode: google.maps.TravelMode.DRIVING
      })

      setDirections(result)

      // Calculate totals
      const route = result.routes[0]
      let distance = 0
      let duration = 0
      route.legs.forEach(leg => {
        distance += leg.distance?.value || 0
        duration += leg.duration?.value || 0
      })

      setTotalDistance(`${(distance / 1000).toFixed(1)} km`)
      setTotalDuration(`${Math.round(duration / 60)} min`)

      // Get optimized order
      const waypointOrder = route.waypoint_order
      const optimized = [selected[0]]
      waypointOrder.forEach(i => optimized.push(selected[i + 1]))
      optimized.push(selected[selected.length - 1])
      setOptimizedRoute(optimized)
    } catch (error) {
      console.error("Directions error:", error)
    }
  }, [selectedLocations, validLocations])

  const openInGoogleMaps = () => {
    if (optimizedRoute.length < 2) return

    const origin = `${optimizedRoute[0].latitude},${optimizedRoute[0].longitude}`
    const destination = `${optimizedRoute[optimizedRoute.length - 1].latitude},${optimizedRoute[optimizedRoute.length - 1].longitude}`
    const waypoints = optimizedRoute.slice(1, -1).map(l => `${l.latitude},${l.longitude}`).join("|")

    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypoints ? `&waypoints=${waypoints}` : ""}&travelmode=driving`
    window.open(url, "_blank")
  }

  if (!isLoaded) {
    return (
      <div className="bg-card rounded-xl shadow-sm p-6">
        <div className="animate-pulse h-96 bg-muted rounded-lg"></div>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Planear Rota</h3>

      {/* Location Selection */}
      <div className="mb-4">
        <p className="text-sm text-muted-foreground mb-2">Seleciona os locais a visitar:</p>
        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
          {validLocations.map(loc => (
            <button
              key={loc.id}
              onClick={() => toggleLocation(loc.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                selectedLocations.includes(loc.id)
                  ? "bg-primary text-white"
                  : "bg-secondary text-foreground hover:bg-secondary/80"
              }`}
            >
              {loc.nome}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={calculateRoute}
          disabled={selectedLocations.length < 2}
          className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-hover transition disabled:opacity-50"
        >
          Calcular Rota
        </button>
        {optimizedRoute.length > 0 && (
          <button
            onClick={openInGoogleMaps}
            className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-hover transition flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C7.31 0 3.07 3.35 2 8c-.12.57-.2 1.14-.2 1.74 0 1.21.29 2.35.79 3.37l9.39 10.89 9.39-10.89c.5-1.02.79-2.16.79-3.37 0-.6-.08-1.17-.2-1.74C20.93 3.35 16.69 0 12 0zm0 12c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
            </svg>
            Abrir no Maps
          </button>
        )}
      </div>

      {/* Route Info */}
      {totalDistance && (
        <div className="flex gap-4 mb-4 p-3 bg-secondary/50 rounded-lg">
          <div>
            <p className="text-xs text-muted-foreground">Distancia</p>
            <p className="font-bold text-foreground">{totalDistance}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Duracao</p>
            <p className="font-bold text-foreground">{totalDuration}</p>
          </div>
        </div>
      )}

      {/* Optimized Order */}
      {optimizedRoute.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-medium text-foreground mb-2">Ordem otimizada:</p>
          <ol className="space-y-1">
            {optimizedRoute.map((loc, i) => (
              <li key={loc.id} className="flex items-center gap-2 text-sm">
                <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
                  {i + 1}
                </span>
                <span className="text-foreground">{loc.nome}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Map */}
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={validLocations[0] ? { lat: validLocations[0].latitude!, lng: validLocations[0].longitude! } : defaultCenter}
        zoom={10}
      >
        {directions ? (
          <DirectionsRenderer directions={directions} />
        ) : (
          validLocations
            .filter(l => selectedLocations.includes(l.id))
            .map(loc => (
              <Marker
                key={loc.id}
                position={{ lat: loc.latitude!, lng: loc.longitude! }}
                title={loc.nome}
              />
            ))
        )}
      </GoogleMap>
    </div>
  )
}
