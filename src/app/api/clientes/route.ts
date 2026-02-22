import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import { requirePermission, userScopedWhere, getEffectiveUserId } from "@/lib/api-auth"
import { PERMISSIONS } from "@/lib/permissions"
import { parsePaginationParams, calculateSkip, buildPaginatedResponse } from "@/lib/pagination"
import { clienteListSelect, buildSearchFilter } from "@/lib/query-utils"
import { cache, cacheKeys, cacheTags } from "@/lib/cache"
import { logger } from "@/lib/logger"

export async function GET(request: Request) {
  try {
    console.log("[clientes] GET request started")
    const session = await requirePermission(PERMISSIONS.CLIENTES_READ)
    console.log("[clientes] Session authenticated:", session.user?.id)
    const { searchParams } = new URL(request.url)

    // Check if full list is requested (for backward compatibility)
    const all = searchParams.get('all') === 'true'
    console.log("[clientes] all param:", all)

    if (all) {
      // Return full list for dropdowns, etc. (cached)
      const userId = session.user?.id || 'anonymous'
      const cacheKey = cacheKeys.clientesList(userId)
      console.log("[clientes] Fetching all clientes for user:", userId)

      const clientes = await cache.getOrSet(
        cacheKey,
        async () => {
          const result = await prisma.cliente.findMany({
            where: { ...userScopedWhere(session), ativo: true },
            select: { id: true, nome: true, codigo: true },
            orderBy: { nome: "asc" }
          })
          console.log("[clientes] Found", result.length, "clientes")
          return result
        },
        { ttl: 300, tags: [cacheTags.clientes] }
      )
      console.log("[clientes] Returning", clientes.length, "clientes")
      return NextResponse.json(clientes)
    }

    // Paginated response
    const pagination = parsePaginationParams(searchParams)
    const search = searchParams.get('search')
    const ativo = searchParams.get('ativo')

    // Build where clause
    const baseWhere = userScopedWhere(session)
    const searchWhere = buildSearchFilter(search, ['nome', 'codigo', 'email', 'telefone', 'cidade'])
    const ativoWhere = ativo !== null ? { ativo: ativo === 'true' } : {}

    const where = { ...baseWhere, ...searchWhere, ...ativoWhere }

    // Execute queries in parallel
    const [clientes, total] = await Promise.all([
      prisma.cliente.findMany({
        where,
        select: clienteListSelect,
        orderBy: { [pagination.sortBy || 'nome']: pagination.sortOrder || 'asc' },
        skip: calculateSkip(pagination.page!, pagination.limit!),
        take: pagination.limit
      }),
      prisma.cliente.count({ where })
    ])

    logger.debug('Clientes fetched', { count: clientes.length, total, page: pagination.page })

    return NextResponse.json(buildPaginatedResponse(clientes, total, pagination))
  } catch (error) {
    if (error instanceof NextResponse) {
      return error
    }
    logger.error("Error fetching clientes", { error: String(error) })
    return NextResponse.json({ error: "Erro ao buscar clientes" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await requirePermission(PERMISSIONS.CLIENTES_WRITE)

    const data = await request.json()

    if (!data.nome) {
      return NextResponse.json({ error: "Nome e obrigatorio" }, { status: 400 })
    }

    // Check if codigo already exists
    if (data.codigo) {
      const existing = await prisma.cliente.findUnique({
        where: { codigo: data.codigo }
      })
      if (existing) {
        return NextResponse.json({ error: "Ja existe um cliente com este codigo" }, { status: 400 })
      }
    }

    const cliente = await prisma.cliente.create({
      data: {
        nome: data.nome,
        codigo: data.codigo || null,
        telefone: data.telefone || null,
        email: data.email || null,
        morada: data.morada || null,
        cidade: data.cidade || null,
        codigoPostal: data.codigoPostal || null,
        latitude: data.latitude || null,
        longitude: data.longitude || null,
        notas: data.notas || null,
        userId: getEffectiveUserId(session)
      }
    })

    // Invalidate caches
    cache.invalidateByTag(cacheTags.clientes)
    cache.invalidateByTag(cacheTags.dashboard)

    logger.info('Cliente created', { clienteId: cliente.id, userId: session.user?.id })

    return NextResponse.json(cliente, { status: 201 })
  } catch (error) {
    if (error instanceof NextResponse) {
      return error
    }
    logger.error("Error creating cliente", { error: String(error) })
    return NextResponse.json({ error: "Erro ao criar cliente" }, { status: 500 })
  }
}
