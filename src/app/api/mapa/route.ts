import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { userScopedWhere } from "@/lib/permissions"

export interface MapLocation {
  id: string
  name: string
  type: "cliente" | "prospecto"
  latitude: number
  longitude: number
  cidade: string | null
  morada: string | null
  telefone: string | null
  email: string | null
  // Prospect-specific
  estado?: string
  tipoNegocio?: string
  nomeContacto?: string
  // Client-specific
  codigo?: string
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const typeFilter = searchParams.get("type") // "all" | "clients" | "prospects"
    const estado = searchParams.get("estado")
    const cidade = searchParams.get("cidade")

    const userFilter = userScopedWhere(session)
    const locations: MapLocation[] = []
    const cidadesSet = new Set<string>()

    // Fetch clients if not filtering only prospects
    if (typeFilter !== "prospects") {
      const clienteWhere: Record<string, unknown> = {
        ...userFilter,
        ativo: true,
        latitude: { not: null },
        longitude: { not: null },
      }

      if (cidade) {
        clienteWhere.cidade = cidade
      }

      const clientes = await prisma.cliente.findMany({
        where: clienteWhere,
        select: {
          id: true,
          nome: true,
          codigo: true,
          cidade: true,
          morada: true,
          telefone: true,
          email: true,
          latitude: true,
          longitude: true,
        },
      })

      clientes.forEach((c) => {
        if (c.latitude && c.longitude) {
          locations.push({
            id: c.id,
            name: c.nome,
            type: "cliente",
            latitude: c.latitude,
            longitude: c.longitude,
            cidade: c.cidade,
            morada: c.morada,
            telefone: c.telefone,
            email: c.email,
            codigo: c.codigo || undefined,
          })
          if (c.cidade) cidadesSet.add(c.cidade)
        }
      })
    }

    // Fetch prospects if not filtering only clients
    if (typeFilter !== "clients") {
      const prospectWhere: Record<string, unknown> = {
        ...userFilter,
        ativo: true,
        latitude: { not: null },
        longitude: { not: null },
      }

      if (estado) {
        prospectWhere.estado = estado
      }

      if (cidade) {
        prospectWhere.cidade = cidade
      }

      const prospectos = await prisma.prospecto.findMany({
        where: prospectWhere,
        select: {
          id: true,
          nomeEmpresa: true,
          tipoNegocio: true,
          nomeContacto: true,
          cidade: true,
          morada: true,
          telefone: true,
          email: true,
          estado: true,
          latitude: true,
          longitude: true,
        },
      })

      prospectos.forEach((p) => {
        if (p.latitude && p.longitude) {
          locations.push({
            id: p.id,
            name: p.nomeEmpresa,
            type: "prospecto",
            latitude: p.latitude,
            longitude: p.longitude,
            cidade: p.cidade,
            morada: p.morada,
            telefone: p.telefone,
            email: p.email,
            estado: p.estado,
            tipoNegocio: p.tipoNegocio || undefined,
            nomeContacto: p.nomeContacto || undefined,
          })
          if (p.cidade) cidadesSet.add(p.cidade)
        }
      })
    }

    // Get all distinct cities for the filter (regardless of current filter)
    const allClientCities = await prisma.cliente.findMany({
      where: { ...userFilter, ativo: true, cidade: { not: null } },
      select: { cidade: true },
      distinct: ["cidade"],
    })

    const allProspectCities = await prisma.prospecto.findMany({
      where: { ...userFilter, ativo: true, cidade: { not: null } },
      select: { cidade: true },
      distinct: ["cidade"],
    })

    const allCidades = new Set<string>()
    allClientCities.forEach((c) => c.cidade && allCidades.add(c.cidade))
    allProspectCities.forEach((p) => p.cidade && allCidades.add(p.cidade))

    const cidades = Array.from(allCidades).sort((a, b) => a.localeCompare(b, "pt"))

    return NextResponse.json({ locations, cidades })
  } catch (error) {
    console.error("Error fetching map locations:", error)
    return NextResponse.json(
      { error: "Erro ao buscar localizacoes" },
      { status: 500 }
    )
  }
}
