import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { userScopedWhere, getEffectiveUserId } from "@/lib/permissions"
import { EstadoPipeline } from "@prisma/client"

// GET - List all prospects with filters
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const estado = searchParams.get("estado") as EstadoPipeline | null
    const cidade = searchParams.get("cidade")
    const search = searchParams.get("search")
    const ativo = searchParams.get("ativo")
    const seller = searchParams.get("seller")

    const userFilter = userScopedWhere(session, seller)
    const where: Record<string, unknown> = { ...userFilter }

    if (estado) {
      where.estado = estado
    }

    if (cidade) {
      where.cidade = cidade
    }

    if (ativo !== null) {
      where.ativo = ativo === "true"
    }

    if (search) {
      where.OR = [
        { nomeEmpresa: { contains: search, mode: "insensitive" } },
        { nomeContacto: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { telefone: { contains: search, mode: "insensitive" } },
        { cidade: { contains: search, mode: "insensitive" } },
      ]
    }

    const prospectos = await prisma.prospecto.findMany({
      where,
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(prospectos)
  } catch (error) {
    console.error("Error fetching prospectos:", error)
    return NextResponse.json(
      { error: "Erro ao buscar prospectos" },
      { status: 500 }
    )
  }
}

// POST - Create new prospect
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()
    const userId = getEffectiveUserId(session)

    const prospecto = await prisma.prospecto.create({
      data: {
        userId,
        nomeEmpresa: data.nomeEmpresa,
        tipoNegocio: data.tipoNegocio || null,
        website: data.website || null,
        facebook: data.facebook || null,
        instagram: data.instagram || null,
        nomeContacto: data.nomeContacto || null,
        cargoContacto: data.cargoContacto || null,
        telefone: data.telefone || null,
        email: data.email || null,
        morada: data.morada || null,
        cidade: data.cidade || null,
        codigoPostal: data.codigoPostal || null,
        latitude: data.latitude || null,
        longitude: data.longitude || null,
        estado: data.estado || "NOVO",
        proximaAccao: data.proximaAccao || null,
        dataProximaAccao: data.dataProximaAccao ? new Date(data.dataProximaAccao) : null,
        notas: data.notas || null,
        fonte: data.fonte || null,
      },
    })

    return NextResponse.json(prospecto, { status: 201 })
  } catch (error) {
    console.error("Error creating prospecto:", error)
    return NextResponse.json(
      { error: "Erro ao criar prospecto" },
      { status: 500 }
    )
  }
}
