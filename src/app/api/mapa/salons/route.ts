import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export interface SalonResult {
  placeId: string
  name: string
  address: string
  latitude: number
  longitude: number
  distance: number
  rating?: number
  openNow?: boolean
  phone?: string
  website?: string
  photoUrl?: string
  types?: string[]
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371e3
  const phi1 = (lat1 * Math.PI) / 180
  const phi2 = (lat2 * Math.PI) / 180
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180
  const deltaLambda = ((lng2 - lng1) * Math.PI) / 180
  const a = Math.sin(deltaPhi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.round(R * c)
}

// Google Places API with better data
async function searchWithGoogle(lat: number, lng: number, radius: number, apiKey: string): Promise<SalonResult[] | null> {
  try {
    // Portuguese beauty/aesthetics keywords
    const query = encodeURIComponent("estetica estética centro estetica espaco estetica salao beleza cabeleireiro beauty salon")
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&keyword=${query}&key=${apiKey}`

    const response = await fetch(url)
    const data = await response.json()

    if (data.status === "REQUEST_DENIED" || data.status === "OVER_QUERY_LIMIT" || data.status === "INVALID_REQUEST") {
      console.log("Google Places API issue:", data.status, data.error_message)
      return null
    }

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      return null
    }

    const salons: SalonResult[] = []

    for (const place of data.results || []) {
      const salon: SalonResult = {
        placeId: place.place_id,
        name: place.name || "Sem nome",
        address: place.vicinity || place.formatted_address || "Morada nao disponivel",
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
        distance: calculateDistance(lat, lng, place.geometry.location.lat, place.geometry.location.lng),
        rating: place.rating,
        openNow: place.opening_hours?.open_now,
        types: place.types,
      }

      // Get photo URL if available
      if (place.photos && place.photos.length > 0) {
        const photoRef = place.photos[0].photo_reference
        salon.photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${photoRef}&key=${apiKey}`
      }

      salons.push(salon)
    }

    return salons
  } catch (error) {
    console.error("Google Places error:", error)
    return null
  }
}

// OpenStreetMap Overpass API - improved query
async function searchWithOpenStreetMap(lat: number, lng: number, radius: number): Promise<SalonResult[]> {
  try {
    // More comprehensive query for beauty businesses
    const query = `
      [out:json][timeout:30];
      (
        nwr["shop"="hairdresser"](around:${radius},${lat},${lng});
        nwr["shop"="beauty"](around:${radius},${lat},${lng});
        nwr["amenity"="beauty_salon"](around:${radius},${lat},${lng});
        nwr["leisure"="spa"](around:${radius},${lat},${lng});
        nwr["shop"="cosmetics"](around:${radius},${lat},${lng});
        nwr["healthcare"="beauty"](around:${radius},${lat},${lng});
        nwr["craft"="hairdresser"](around:${radius},${lat},${lng});
      );
      out body center;
    `

    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: `data=${encodeURIComponent(query)}`,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    })

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.status}`)
    }

    const data = await response.json()

    return (data.elements || []).map((el: {
      id: number
      type: string
      lat?: number
      lon?: number
      center?: { lat: number; lon: number }
      tags?: Record<string, string>
    }) => {
      const elLat = el.lat || el.center?.lat || 0
      const elLng = el.lon || el.center?.lon || 0
      const tags = el.tags || {}

      // Build full address from tags
      const addressParts: string[] = []
      if (tags["addr:street"]) {
        const street = tags["addr:housenumber"]
          ? `${tags["addr:street"]} ${tags["addr:housenumber"]}`
          : tags["addr:street"]
        addressParts.push(street)
      }
      if (tags["addr:city"]) addressParts.push(tags["addr:city"])
      if (tags["addr:postcode"]) addressParts.push(tags["addr:postcode"])

      // Determine business type
      const businessType = tags["shop"] || tags["amenity"] || tags["leisure"] || tags["craft"] || "beauty"
      const typeLabels: Record<string, string> = {
        hairdresser: "Cabeleireiro",
        beauty: "Salao de Beleza",
        beauty_salon: "Salao de Beleza",
        spa: "Spa",
        cosmetics: "Cosmeticos",
      }

      return {
        placeId: `osm-${el.type}-${el.id}`,
        name: tags.name || tags["name:pt"] || tags.brand || typeLabels[businessType] || "Salao de Beleza",
        address: addressParts.length > 0 ? addressParts.join(", ") : (tags["addr:full"] || "Ver no mapa"),
        latitude: elLat,
        longitude: elLng,
        distance: calculateDistance(lat, lng, elLat, elLng),
        phone: tags.phone || tags["contact:phone"],
        website: tags.website || tags["contact:website"],
        types: [typeLabels[businessType] || businessType],
      }
    }).filter((s: SalonResult) => s.latitude !== 0 && s.longitude !== 0)
  } catch (error) {
    console.error("OpenStreetMap error:", error)
    return []
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { lat, lng, radius = 5000 } = body

    if (!lat || !lng) {
      return NextResponse.json({ error: "Coordenadas obrigatorias" }, { status: 400 })
    }

    let salons: SalonResult[] = []
    let source = "openstreetmap"

    // Try Google Places first
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (apiKey) {
      const googleResults = await searchWithGoogle(lat, lng, radius, apiKey)
      if (googleResults !== null && googleResults.length > 0) {
        salons = googleResults
        source = "google"
      }
    }

    // Fallback to OpenStreetMap
    if (salons.length === 0) {
      salons = await searchWithOpenStreetMap(lat, lng, radius)
      source = "openstreetmap"
    }

    // Sort by distance and limit results
    salons.sort((a, b) => a.distance - b.distance)
    salons = salons.slice(0, 30)

    return NextResponse.json({ salons, source, count: salons.length })
  } catch (error) {
    console.error("Salon search error:", error)
    return NextResponse.json({ salons: [], error: "Erro ao procurar" }, { status: 500 })
  }
}
