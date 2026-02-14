import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import { requirePermission, userScopedWhere, getEffectiveUserId } from "@/lib/api-auth"
import { PERMISSIONS } from "@/lib/permissions"

export async function GET(request: Request) {
  try {
    const session = await requirePermission(PERMISSIONS.CLIENTES_READ)

    const { searchParams } = new URL(request.url)
    const mes = searchParams.get("mes") ? parseInt(searchParams.get("mes")!) : undefined
    const ano = searchParams.get("ano") ? parseInt(searchParams.get("ano")!) : undefined
    const ativo = searchParams.get("ativo")

    const where: Record<string, unknown> = { ...userScopedWhere(session) }
    if (mes) where.mes = mes
    if (ano) where.ano = ano
    if (ativo !== null && ativo !== undefined) where.ativo = ativo === "true"

    const objetivos = await prisma.objetivoVario.findMany({
      where,
      include: {
        produtos: {
          include: { produto: true }
        },
        vendas: {
          include: {
            cliente: true
          }
        }
      },
      orderBy: [{ ano: "desc" }, { mes: "desc" }, { titulo: "asc" }]
    })

    // Calculate totals for each objetivo including sales progress
    const objetivosComTotais = objetivos.map(o => ({
      ...o,
      totalProdutos: o.produtos.length,
      totalValor: o.produtos.reduce((sum, p) => sum + Number(p.precoSemIva) * p.quantidade, 0),
      totalVendas: o.vendas.length,
      totalVendido: o.vendas.length, // Count of vendas with this objetivo
      totalObjetivoValor: o.vendas.reduce((sum, v) => sum + Number(v.objetivoVarioValor || 0), 0), // Sum of objetivo values
      totalValorVendido: o.vendas.reduce((sum, v) => sum + Number(v.total), 0)
    }))

    return NextResponse.json(objetivosComTotais)
  } catch (error) {
    if (error instanceof Response) return error
    console.error("Error fetching objetivos varios:", error)
    return NextResponse.json({ error: "Erro ao buscar objetivos" }, { status: 500 })
  }
}

type ProdutoInput = {
  produtoId?: string | null
  nome: string
  precoSemIva: number
  quantidade: number
}

export async function POST(request: Request) {
  try {
    const session = await requirePermission(PERMISSIONS.CLIENTES_WRITE)
    const userId = getEffectiveUserId(session)

    const data = await request.json()

    if (!data.titulo || !data.mes || !data.ano) {
      return NextResponse.json({ error: "Titulo, mes e ano sao obrigatorios" }, { status: 400 })
    }

    const produtosData: ProdutoInput[] = data.produtos || []

    const objetivo = await prisma.objetivoVario.create({
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
            precoSemIva: p.precoSemIva,
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

    return NextResponse.json(objetivo, { status: 201 })
  } catch (error) {
    if (error instanceof Response) return error
    console.error("Error creating objetivo vario:", error)
    return NextResponse.json({ error: "Erro ao criar objetivo" }, { status: 500 })
  }
}
