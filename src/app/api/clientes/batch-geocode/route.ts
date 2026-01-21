import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// POST - Batch geocode all customers without coordinates
export async function POST(request: NextRequest) {
  try {
    // Get all customers without coordinates that have an address
    const clientes = await prisma.cliente.findMany({
      where: {
        latitude: null,
        OR: [
          { morada: { not: null } },
          { cidade: { not: null } }
        ]
      },
      select: {
        id: true,
        nome: true,
        morada: true,
        cidade: true,
        codigoPostal: true,
      }
    })

    const results = {
      total: clientes.length,
      success: 0,
      failed: 0,
      errors: [] as { id: string; nome: string; error: string }[]
    }

    const googleApiKey = process.env.GOOGLE_MAPS_API_KEY

    for (const cliente of clientes) {
      // Build address from available fields
      const parts = [
        cliente.morada,
        cliente.cidade,
        cliente.codigoPostal,
        "Portugal"
      ].filter(Boolean)

      if (parts.length < 2) {
        results.failed++
        results.errors.push({
          id: cliente.id,
          nome: cliente.nome,
          error: "Morada insuficiente"
        })
        continue
      }

      const address = parts.join(", ")

      try {
        let lat: number | null = null
        let lng: number | null = null

        // Try Google first
        if (googleApiKey) {
          const googleResult = await geocodeWithGoogle(address, googleApiKey)
          if (googleResult.success) {
            lat = googleResult.latitude!
            lng = googleResult.longitude!
          }
        }

        // Fallback to Nominatim
        if (!lat || !lng) {
          const nominatimResult = await geocodeWithNominatim(address)
          if (nominatimResult.success) {
            lat = nominatimResult.latitude!
            lng = nominatimResult.longitude!
          }
        }

        if (lat && lng) {
          await prisma.cliente.update({
            where: { id: cliente.id },
            data: { latitude: lat, longitude: lng }
          })
          results.success++
        } else {
          results.failed++
          results.errors.push({
            id: cliente.id,
            nome: cliente.nome,
            error: "Coordenadas não encontradas"
          })
        }

        // Rate limiting - wait 200ms between requests
        await new Promise(resolve => setTimeout(resolve, 200))

      } catch (error) {
        results.failed++
        results.errors.push({
          id: cliente.id,
          nome: cliente.nome,
          error: String(error)
        })
      }
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error("Error batch geocoding:", error)
    return NextResponse.json(
      { error: "Erro ao geocodificar clientes" },
      { status: 500 }
    )
  }
}

// GET - Get geocoding status (how many need geocoding)
export async function GET() {
  try {
    const total = await prisma.cliente.count({
      where: { ativo: true }
    })

    const withCoords = await prisma.cliente.count({
      where: {
        ativo: true,
        latitude: { not: null },
        longitude: { not: null }
      }
    })

    const withAddress = await prisma.cliente.count({
      where: {
        ativo: true,
        latitude: null,
        OR: [
          { morada: { not: null } },
          { cidade: { not: null } }
        ]
      }
    })

    return NextResponse.json({
      total,
      withCoordinates: withCoords,
      pendingGeocoding: withAddress,
      noAddress: total - withCoords - withAddress
    })
  } catch (error) {
    console.error("Error getting geocode status:", error)
    return NextResponse.json(
      { error: "Erro ao obter estado" },
      { status: 500 }
    )
  }
}

async function geocodeWithGoogle(address: string, apiKey: string): Promise<{ success: boolean; latitude?: number; longitude?: number }> {
  try {
    const encodedAddress = encodeURIComponent(address)
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`

    const response = await fetch(url)
    const data = await response.json()

    if (data.status === "OK" && data.results.length > 0) {
      const location = data.results[0].geometry.location
      return {
        success: true,
        latitude: location.lat,
        longitude: location.lng
      }
    }
    return { success: false }
  } catch {
    return { success: false }
  }
}

async function geocodeWithNominatim(address: string): Promise<{ success: boolean; latitude?: number; longitude?: number }> {
  try {
    const encodedAddress = encodeURIComponent(address)
    const url = `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&limit=1&countrycodes=pt`

    const response = await fetch(url, {
      headers: { "User-Agent": "CarolinaCRM/1.0" }
    })

    const data = await response.json()

    if (data.length > 0) {
      return {
        success: true,
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon)
      }
    }
    return { success: false }
  } catch {
    return { success: false }
  }
}
