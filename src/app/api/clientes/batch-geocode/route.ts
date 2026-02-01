import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requirePermission, userScopedWhere } from "@/lib/api-auth"
import { PERMISSIONS } from "@/lib/permissions"

// GET: Return geocoding status
export async function GET() {
  try {
    const session = await requirePermission(PERMISSIONS.CLIENTES_READ)
    const userWhere = userScopedWhere(session)

    // Count clientes with and without coordinates
    const [totalClientes, clientesWithCoords, totalProspectos, prospectosWithCoords] = await Promise.all([
      prisma.cliente.count({ where: { ...userWhere, ativo: true } }),
      prisma.cliente.count({ where: { ...userWhere, ativo: true, latitude: { not: null } } }),
      prisma.prospecto.count({ where: { ...userWhere, ativo: true } }),
      prisma.prospecto.count({ where: { ...userWhere, ativo: true, latitude: { not: null } } }),
    ])

    return NextResponse.json({
      clientes: {
        total: totalClientes,
        withCoords: clientesWithCoords,
        withoutCoords: totalClientes - clientesWithCoords,
      },
      prospectos: {
        total: totalProspectos,
        withCoords: prospectosWithCoords,
        withoutCoords: totalProspectos - prospectosWithCoords,
      },
      total: totalClientes + totalProspectos,
      totalWithCoords: clientesWithCoords + prospectosWithCoords,
      totalWithoutCoords: (totalClientes - clientesWithCoords) + (totalProspectos - prospectosWithCoords),
    })
  } catch (error) {
    if (error instanceof NextResponse) return error
    console.error("Error fetching geocode status:", error)
    return NextResponse.json({ error: "Erro ao buscar status" }, { status: 500 })
  }
}

// POST: Batch geocode all clientes and prospectos without coordinates
export async function POST() {
  try {
    const session = await requirePermission(PERMISSIONS.CLIENTES_WRITE)
    const userWhere = userScopedWhere(session)

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured", success: 0, failed: 0 })
    }

    // Get clientes without coordinates
    const clientes = await prisma.cliente.findMany({
      where: {
        ...userWhere,
        ativo: true,
        latitude: null,
        morada: { not: null },
      },
      select: { id: true, morada: true, cidade: true, codigoPostal: true },
    })

    // Get prospectos without coordinates
    const prospectos = await prisma.prospecto.findMany({
      where: {
        ...userWhere,
        ativo: true,
        latitude: null,
        morada: { not: null },
      },
      select: { id: true, morada: true, cidade: true, codigoPostal: true },
    })

    let success = 0
    let failed = 0

    // Geocode function
    const geocode = async (address: string): Promise<{ lat: number; lng: number } | null> => {
      try {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
        const response = await fetch(url)
        const data = await response.json()

        if (data.status === "OK" && data.results?.[0]) {
          const location = data.results[0].geometry.location
          return { lat: location.lat, lng: location.lng }
        }
        return null
      } catch {
        return null
      }
    }

    // Process clientes
    for (const cliente of clientes) {
      const address = [cliente.morada, cliente.cidade, cliente.codigoPostal, "Portugal"]
        .filter(Boolean)
        .join(", ")

      const coords = await geocode(address)
      if (coords) {
        await prisma.cliente.update({
          where: { id: cliente.id },
          data: { latitude: coords.lat, longitude: coords.lng },
        })
        success++
      } else {
        failed++
      }

      // Rate limiting - Google allows 50 requests per second
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    // Process prospectos
    for (const prospecto of prospectos) {
      const address = [prospecto.morada, prospecto.cidade, prospecto.codigoPostal, "Portugal"]
        .filter(Boolean)
        .join(", ")

      const coords = await geocode(address)
      if (coords) {
        await prisma.prospecto.update({
          where: { id: prospecto.id },
          data: { latitude: coords.lat, longitude: coords.lng },
        })
        success++
      } else {
        failed++
      }

      await new Promise(resolve => setTimeout(resolve, 100))
    }

    return NextResponse.json({ success, failed })
  } catch (error) {
    if (error instanceof NextResponse) return error
    console.error("Error batch geocoding:", error)
    return NextResponse.json({ error: "Erro ao geocodificar", success: 0, failed: 0 }, { status: 500 })
  }
}
