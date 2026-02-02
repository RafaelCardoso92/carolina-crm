import { NextRequest, NextResponse } from "next/server"

// POST - Geocode an address using Google Geocoding API or Nominatim fallback
export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json()

    if (!address) {
      return NextResponse.json(
        { error: "Morada é obrigatória" },
        { status: 400 }
      )
    }

    // Try Google first if we have a server-side API key
    const googleApiKey = process.env.GOOGLE_GEOCODING_API_KEY || process.env.GOOGLE_MAPS_API_KEY

    if (googleApiKey) {
      const googleResult = await tryGoogleGeocoding(address, googleApiKey)
      if (googleResult.success) {
        return NextResponse.json(googleResult.data)
      }
      // If Google fails due to restrictions, fall through to Nominatim
      console.log("Google geocoding failed:", googleResult.error, "- trying Nominatim fallback")
    }

    // Fallback to Nominatim (OpenStreetMap) - free, no API key needed
    const nominatimResult = await tryNominatimGeocoding(address)
    if (nominatimResult.success) {
      return NextResponse.json(nominatimResult.data)
    }

    return NextResponse.json(
      { error: nominatimResult.error || "Erro ao geocodificar morada" },
      { status: 500 }
    )
  } catch (error) {
    console.error("Error geocoding address:", error)
    return NextResponse.json(
      { error: "Erro ao geocodificar morada" },
      { status: 500 }
    )
  }
}

async function tryGoogleGeocoding(address: string, apiKey: string): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const encodedAddress = encodeURIComponent(address)
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`

    const response = await fetch(url)
    const data = await response.json()

    if (data.status === "OK" && data.results.length > 0) {
      const location = data.results[0].geometry.location
      return {
        success: true,
        data: {
          latitude: location.lat,
          longitude: location.lng,
          formattedAddress: data.results[0].formatted_address,
          source: "google"
        }
      }
    } else if (data.status === "ZERO_RESULTS") {
      return { success: false, error: "Morada não encontrada" }
    } else {
      return { success: false, error: data.error_message || data.status }
    }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

async function tryNominatimGeocoding(address: string): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const encodedAddress = encodeURIComponent(address)
    const url = `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&limit=1&countrycodes=pt`

    const response = await fetch(url, {
      headers: {
        "User-Agent": "CarolinaCRM/1.0"
      }
    })

    if (!response.ok) {
      return { success: false, error: "Nominatim service unavailable" }
    }

    const data = await response.json()

    if (data.length > 0) {
      return {
        success: true,
        data: {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon),
          formattedAddress: data[0].display_name,
          source: "nominatim"
        }
      }
    }

    return { success: false, error: "Morada não encontrada" }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}
