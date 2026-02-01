import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requirePermission, getEffectiveUserId, userScopedWhere } from "@/lib/api-auth"
import { PERMISSIONS } from "@/lib/permissions"

export async function GET() {
  try {
    const session = await requirePermission(PERMISSIONS.ROTAS_READ)
    const userWhere = userScopedWhere(session)

    // Get clientes with coordinates
    const clientes = await prisma.cliente.findMany({
      where: {
        ...userWhere,
        ativo: true,
      },
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
    })

    // Get prospectos with coordinates
    const prospectos = await prisma.prospecto.findMany({
      where: {
        ...userWhere,
        ativo: true,
      },
      select: {
        id: true,
        nomeEmpresa: true,
        tipoNegocio: true,
        nomeContacto: true,
        morada: true,
        cidade: true,
        codigoPostal: true,
        latitude: true,
        longitude: true,
        telefone: true,
        email: true,
        estado: true,
      },
    })

    // Format locations for the route planner
    const locations = [
      ...clientes.map(c => ({
        id: c.id,
        nome: c.nome,
        tipo: "cliente" as const,
        codigo: c.codigo,
        morada: c.morada,
        cidade: c.cidade,
        codigoPostal: c.codigoPostal,
        latitude: c.latitude,
        longitude: c.longitude,
        telefone: c.telefone,
        email: c.email,
      })),
      ...prospectos.map(p => ({
        id: p.id,
        nome: p.nomeEmpresa,
        tipo: "prospecto" as const,
        tipoNegocio: p.tipoNegocio,
        nomeContacto: p.nomeContacto,
        morada: p.morada,
        cidade: p.cidade,
        codigoPostal: p.codigoPostal,
        latitude: p.latitude,
        longitude: p.longitude,
        telefone: p.telefone,
        email: p.email,
        estado: p.estado,
      })),
    ]

    return NextResponse.json({ locations })
  } catch (error) {
    if (error instanceof NextResponse) return error
    console.error("Error fetching locations:", error)
    return NextResponse.json({ error: "Erro ao buscar localizações" }, { status: 500 })
  }
}
