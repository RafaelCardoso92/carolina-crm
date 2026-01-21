import { NextRequest, NextResponse } from "next/server"

export interface NearbyPlace {
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

// POST - Find nearby places (parking, GPL stations)
export async function POST(request: NextRequest) {
  try {
    const { lat, lng, type, radius = 2000 } = await request.json()

    if (!lat || !lng) {
      return NextResponse.json(
        { error: "Coordenadas são obrigatórias" },
        { status: 400 }
      )
    }

    if (!type || !["parking", "gas_station"].includes(type)) {
      return NextResponse.json(
        { error: "Tipo deve ser 'parking' ou 'gas_station'" },
        { status: 400 }
      )
    }

    // Try Google Places first if API key is available
    const googleApiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY

    if (googleApiKey) {
      const googleResult = await tryGooglePlaces(lat, lng, type, radius, googleApiKey)
      if (googleResult.success) {
        return NextResponse.json({ places: googleResult.places })
      }
      console.log("Google Places failed:", googleResult.error, "- trying Overpass fallback")
    }

    // Fallback to OpenStreetMap Overpass API
    const overpassResult = await tryOverpassAPI(lat, lng, type, radius)
    if (overpassResult.success) {
      return NextResponse.json({ places: overpassResult.places })
    }

    return NextResponse.json(
      { error: overpassResult.error || "Erro ao procurar locais" },
      { status: 500 }
    )
  } catch (error) {
    console.error("Error finding nearby places:", error)
    return NextResponse.json(
      { error: "Erro ao procurar locais próximos" },
      { status: 500 }
    )
  }
}

async function tryGooglePlaces(
  lat: number,
  lng: number,
  type: string,
  radius: number,
  apiKey: string
): Promise<{ success: boolean; places?: NearbyPlace[]; error?: string }> {
  try {
    const googleType = type === "gas_station" ? "gas_station" : "parking"
    const keyword = type === "gas_station" ? "GPL+autogas+LPG" : ""

    let url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${googleType}&key=${apiKey}`
    if (keyword) {
      url += `&keyword=${keyword}`
    }

    const response = await fetch(url)
    const data = await response.json()

    if (data.status === "OK" || data.status === "ZERO_RESULTS") {
      const places: NearbyPlace[] = (data.results || []).map((place: any) => ({
        id: place.place_id,
        name: place.name,
        address: place.vicinity,
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
        distance: calculateDistance(lat, lng, place.geometry.location.lat, place.geometry.location.lng),
        type: type as "parking" | "gas_station",
        hasGPL: type === "gas_station" ? checkForGPL(place.name) : undefined,
        rating: place.rating,
        openNow: place.opening_hours?.open_now,
      }))

      // Sort by distance
      places.sort((a, b) => a.distance - b.distance)

      return { success: true, places }
    }

    return { success: false, error: data.error_message || data.status }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

async function tryOverpassAPI(
  lat: number,
  lng: number,
  type: string,
  radius: number
): Promise<{ success: boolean; places?: NearbyPlace[]; error?: string }> {
  try {
    // Build Overpass query
    let query: string

    if (type === "parking") {
      query = `
        [out:json][timeout:25];
        (
          node["amenity"="parking"](around:${radius},${lat},${lng});
          way["amenity"="parking"](around:${radius},${lat},${lng});
        );
        out center;
      `
    } else {
      // Gas station with GPL/LPG
      query = `
        [out:json][timeout:25];
        (
          node["amenity"="fuel"](around:${radius},${lat},${lng});
          way["amenity"="fuel"](around:${radius},${lat},${lng});
        );
        out center;
      `
    }

    const url = "https://overpass-api.de/api/interpreter"
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `data=${encodeURIComponent(query)}`,
    })

    if (!response.ok) {
      return { success: false, error: "Overpass API unavailable" }
    }

    const data = await response.json()
    const places: NearbyPlace[] = []

    for (const element of data.elements || []) {
      const nodeLat = element.lat || element.center?.lat
      const nodeLng = element.lon || element.center?.lon

      if (!nodeLat || !nodeLng) continue

      const tags = element.tags || {}
      const name = tags.name || (type === "parking" ? "Estacionamento" : "Posto de Combustível")

      // Check for GPL/LPG in gas stations
      const hasGPL = type === "gas_station" ? (
        tags["fuel:lpg"] === "yes" ||
        tags["fuel:autogas"] === "yes" ||
        (tags.name || "").toLowerCase().includes("gpl") ||
        (tags.name || "").toLowerCase().includes("autogas")
      ) : undefined

      const address = buildAddress(tags)

      places.push({
        id: `osm-${element.type}-${element.id}`,
        name,
        address,
        latitude: nodeLat,
        longitude: nodeLng,
        distance: calculateDistance(lat, lng, nodeLat, nodeLng),
        type: type as "parking" | "gas_station",
        hasGPL,
      })
    }

    // Sort by distance
    places.sort((a, b) => a.distance - b.distance)

    // If searching for GPL, prioritize GPL stations
    if (type === "gas_station") {
      places.sort((a, b) => {
        if (a.hasGPL && !b.hasGPL) return -1
        if (!a.hasGPL && b.hasGPL) return 1
        return a.distance - b.distance
      })
    }

    return { success: true, places: places.slice(0, 20) }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000 // Earth radius in meters
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.round(R * c)
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180)
}

function checkForGPL(name: string): boolean {
  const lower = name.toLowerCase()
  return lower.includes("gpl") || lower.includes("lpg") || lower.includes("autogas")
}

function buildAddress(tags: Record<string, string>): string | null {
  const parts = []
  if (tags["addr:street"]) {
    let street = tags["addr:street"]
    if (tags["addr:housenumber"]) {
      street += " " + tags["addr:housenumber"]
    }
    parts.push(street)
  }
  if (tags["addr:city"]) {
    parts.push(tags["addr:city"])
  }
  if (tags["addr:postcode"]) {
    parts.push(tags["addr:postcode"])
  }
  return parts.length > 0 ? parts.join(", ") : null
}
