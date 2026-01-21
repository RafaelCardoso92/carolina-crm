import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export type LocationType = "cliente" | "prospecto"

export interface RouteLocation {
  id: string
  nome: string
  tipo: LocationType
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

// GET - Fetch all clients and prospects with coordinates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const cidade = searchParams.get("cidade")
    const estado = searchParams.get("estado")
    const tipo = searchParams.get("tipo") as LocationType | null

    const locations: RouteLocation[] = []

    // Fetch clients
    if (!tipo || tipo === "cliente") {
      const clienteWhere: any = {
        ativo: true,
      }
      if (cidade) {
        clienteWhere.cidade = { contains: cidade, mode: "insensitive" }
      }

      const clientes = await prisma.cliente.findMany({
        where: clienteWhere,
        select: {
          id: true,
          nome: true,
          codigo: true,
          morada: true,
          cidade: true,
          codigoPostal: true,
          latitude: true,
          longitude: true,
          telefone: true,
          email: true,
        },
        orderBy: { nome: "asc" }
      })

      for (const c of clientes) {
        locations.push({
          id: c.id,
          nome: c.nome,
          tipo: "cliente",
          morada: c.morada,
          cidade: c.cidade,
          codigoPostal: c.codigoPostal,
          latitude: c.latitude,
          longitude: c.longitude,
          telefone: c.telefone,
          email: c.email,
          codigo: c.codigo,
        })
      }
    }

    // Fetch prospects
    if (!tipo || tipo === "prospecto") {
      const prospectoWhere: any = {
        ativo: true,
      }
      if (cidade) {
        prospectoWhere.cidade = { contains: cidade, mode: "insensitive" }
      }
      if (estado) {
        prospectoWhere.estado = estado
      }

      const prospectos = await prisma.prospecto.findMany({
        where: prospectoWhere,
        select: {
          id: true,
          nomeEmpresa: true,
          nomeContacto: true,
          tipoNegocio: true,
          morada: true,
          cidade: true,
          codigoPostal: true,
          latitude: true,
          longitude: true,
          telefone: true,
          email: true,
          estado: true,
        },
        orderBy: { nomeEmpresa: "asc" }
      })

      for (const p of prospectos) {
        locations.push({
          id: p.id,
          nome: p.nomeEmpresa,
          tipo: "prospecto",
          morada: p.morada,
          cidade: p.cidade,
          codigoPostal: p.codigoPostal,
          latitude: p.latitude,
          longitude: p.longitude,
          telefone: p.telefone,
          email: p.email,
          estado: p.estado,
          nomeContacto: p.nomeContacto,
          tipoNegocio: p.tipoNegocio,
        })
      }
    }

    // Get unique cities for filtering
    const cities = [...new Set(locations.map(l => l.cidade).filter(Boolean))] as string[]

    return NextResponse.json({
      locations,
      cities: cities.sort(),
      total: locations.length
    })
  } catch (error) {
    console.error("Error fetching locations:", error)
    return NextResponse.json(
      { error: "Erro ao carregar localizações" },
      { status: 500 }
    )
  }
}
