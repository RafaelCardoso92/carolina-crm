import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { requirePermission, userScopedWhere, getEffectiveUserId } from "@/lib/api-auth"
import { PERMISSIONS } from "@/lib/permissions"

export async function GET(request: Request) {
  try {
    const session = await requirePermission(PERMISSIONS.CAMPANHAS_READ)

    const { searchParams } = new URL(request.url)
    const mes = searchParams.get("mes") ? parseInt(searchParams.get("mes")!) : undefined
    const ano = searchParams.get("ano") ? parseInt(searchParams.get("ano")!) : undefined
    const ativo = searchParams.get("ativo")

    const where: Record<string, unknown> = { ...userScopedWhere(session) }
    if (mes) where.mes = mes
    if (ano) where.ano = ano
    if (ativo !== null && ativo !== undefined) where.ativo = ativo === "true"

    const campanhas = await prisma.campanha.findMany({
      where,
      include: {
        vendas: {
          include: {
            venda: {
              include: { cliente: true }
            }
          }
        },
        produtos: {
          include: { produto: true }
        }
      },
      orderBy: [{ ano: "desc" }, { mes: "desc" }, { titulo: "asc" }]
    })

    const campanhasComTotais = campanhas.map(c => ({
      ...c,
      totalVendido: c.vendas.reduce((sum, v) => sum + v.quantidade, 0),
      totalVendas: c.vendas.length,
      totalSemIva: c.produtos.reduce((sum, p) => sum + Number(p.precoUnit) * p.quantidade, 0)
    }))

    return NextResponse.json(campanhasComTotais)
  } catch (error) {
    if (error instanceof Response) return error
    console.error("Error fetching campanhas:", error)
    return NextResponse.json({ error: "Erro ao buscar campanhas" }, { status: 500 })
  }
}

type ProdutoInput = {
  produtoId?: string | null
  nome: string
  precoUnit: number
  quantidade: number
}

export async function POST(request: Request) {
  try {
    const session = await requirePermission(PERMISSIONS.CAMPANHAS_WRITE)
    const userId = getEffectiveUserId(session)

    const data = await request.json()

    if (!data.titulo || !data.mes || !data.ano) {
      return NextResponse.json({ error: "Titulo, mes e ano sao obrigatorios" }, { status: 400 })
    }

    const produtosData: ProdutoInput[] = data.produtos || []

    const campanha = await prisma.campanha.create({
      data: {
        userId,
        titulo: data.titulo,
        descricao: data.descricao || null,
        mes: parseInt(data.mes),
        ano: parseInt(data.ano),
        ativo: true,
        produtos: produtosData.length > 0 ? {
          create: produtosData.map(p => ({
            produtoId: p.produtoId || null,
            nome: p.nome,
            precoUnit: p.precoUnit,
            quantidade: p.quantidade || 1
          }))
        } : undefined
      },
      include: {
        produtos: {
          include: { produto: true }
        }
      }
    })

    return NextResponse.json(campanha, { status: 201 })
  } catch (error) {
    if (error instanceof Response) return error
    console.error("Error creating campanha:", error)
    return NextResponse.json({ error: "Erro ao criar campanha" }, { status: 500 })
  }
}
