import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requirePermission, getEffectiveUserId, userScopedWhere } from "@/lib/api-auth"
import { PERMISSIONS } from "@/lib/permissions"

export async function GET(request: Request) {
  try {
    const session = await requirePermission(PERMISSIONS.ROTAS_READ)
    const userWhere = userScopedWhere(session)
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    const where: Record<string, unknown> = { ...userWhere }

    if (startDate && endDate) {
      where.data = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    const routes = await prisma.rotaSalva.findMany({
      where,
      orderBy: { data: "desc" },
    })

    return NextResponse.json(routes)
  } catch (error) {
    if (error instanceof NextResponse) return error
    console.error("Error fetching saved routes:", error)
    return NextResponse.json({ error: "Erro ao buscar rotas" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await requirePermission(PERMISSIONS.ROTAS_WRITE)
    const userId = getEffectiveUserId(session)
    const body = await request.json()

    const route = await prisma.rotaSalva.create({
      data: {
        userId,
        nome: body.nome,
        data: new Date(body.data),
        origemLatitude: body.origemLatitude,
        origemLongitude: body.origemLongitude,
        origemEndereco: body.origemEndereco,
        locais: body.locais,
        paragens: body.paragens,
        distanciaTotal: body.distanciaTotal,
        duracaoTotal: body.duracaoTotal,
        custoPortagens: body.custoPortagens,
        numPortagens: body.numPortagens,
        custoCombuistivel: body.custoCombuistivel,
        consumoMedio: body.consumoMedio,
        precoLitro: body.precoLitro,
        custoEstacionamento: body.custoEstacionamento,
        notasCustos: body.notasCustos,
        concluida: false,
      },
    })

    return NextResponse.json(route)
  } catch (error) {
    if (error instanceof NextResponse) return error
    console.error("Error saving route:", error)
    return NextResponse.json({ error: "Erro ao guardar rota" }, { status: 500 })
  }
}
