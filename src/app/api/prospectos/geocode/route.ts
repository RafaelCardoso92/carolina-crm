import { NextRequest, NextResponse } from "next/server"

// POST - Geocode an address using Google Geocoding API
export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json()

    if (!address) {
      return NextResponse.json(
        { error: "Morada é obrigatória" },
        { status: 400 }
      )
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: "Google Maps API key não configurada" },
        { status: 500 }
      )
    }

    const encodedAddress = encodeURIComponent(address)
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`

    const response = await fetch(url)
    const data = await response.json()

    if (data.status === "OK" && data.results.length > 0) {
      const location = data.results[0].geometry.location
      return NextResponse.json({
        latitude: location.lat,
        longitude: location.lng,
        formattedAddress: data.results[0].formatted_address,
      })
    } else if (data.status === "ZERO_RESULTS") {
      return NextResponse.json(
        { error: "Morada não encontrada" },
        { status: 404 }
      )
    } else {
      console.error("Geocoding error:", data.status, data.error_message)
      return NextResponse.json(
        { error: "Erro ao geocodificar morada" },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Error geocoding address:", error)
    return NextResponse.json(
      { error: "Erro ao geocodificar morada" },
      { status: 500 }
    )
  }
}
