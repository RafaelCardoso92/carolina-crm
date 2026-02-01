import { NextResponse } from "next/server"
import { requirePermission } from "@/lib/api-auth"
import { PERMISSIONS } from "@/lib/permissions"

// This endpoint uses Google Places API to find nearby places
export async function POST(request: Request) {
  try {
    await requirePermission(PERMISSIONS.ROTAS_READ)
    const body = await request.json()
    const { lat, lng, type, radius = 2000 } = body

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      return NextResponse.json({ places: [], error: "API key not configured" })
    }

    // Map type to Google Places type
    const placeType = type === "parking" ? "parking" : "gas_station"

    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${placeType}&key=${apiKey}`

    const response = await fetch(url)
    const data = await response.json()

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      console.error("Google Places API error:", data.status)
      return NextResponse.json({ places: [], error: data.status })
    }

    const places = (data.results || []).map((place: {
      place_id: string
      name: string
      vicinity?: string
      geometry: { location: { lat: number; lng: number } }
      rating?: number
      opening_hours?: { open_now?: boolean }
    }) => {
      // Calculate distance
      const R = 6371e3 // Earth radius in meters
      const phi1 = lat * Math.PI / 180
      const phi2 = place.geometry.location.lat * Math.PI / 180
      const deltaPhi = (place.geometry.location.lat - lat) * Math.PI / 180
      const deltaLambda = (place.geometry.location.lng - lng) * Math.PI / 180

      const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
                Math.cos(phi1) * Math.cos(phi2) *
                Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      const distance = Math.round(R * c)

      return {
        id: place.place_id,
        name: place.name,
        address: place.vicinity || null,
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
        distance,
        type,
        rating: place.rating,
        openNow: place.opening_hours?.open_now,
      }
    })

    // Sort by distance
    places.sort((a: { distance: number }, b: { distance: number }) => a.distance - b.distance)

    return NextResponse.json({ places })
  } catch (error) {
    if (error instanceof NextResponse) return error
    console.error("Error finding nearby places:", error)
    return NextResponse.json({ places: [], error: "Erro ao procurar locais" }, { status: 500 })
  }
}
