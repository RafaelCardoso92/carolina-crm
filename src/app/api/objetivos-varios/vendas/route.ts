import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { requirePermission, userScopedWhere } from "@/lib/api-auth"
import { PERMISSIONS } from "@/lib/permissions"

export async function GET(request: Request) {
  try {
    const session = await requirePermission(PERMISSIONS.VENDAS_READ)

    const { searchParams } = new URL(request.url)
    const mes = searchParams.get("mes") ? parseInt(searchParams.get("mes")!) : undefined
    const ano = searchParams.get("ano") ? parseInt(searchParams.get("ano")!) : undefined

    // Get all vendas with objetivoVarioId set, scoped by user
    const vendas = await prisma.venda.findMany({
      where: {
        objetivoVarioId: { not: null },
        ...(mes && { mes }),
        ...(ano && { ano }),
        cliente: { ...userScopedWhere(session) },
      },
      include: {
        cliente: { select: { id: true, nome: true, codigo: true } },
        objetivoVario: {
          include: {
            produtos: { select: { nome: true, precoSemIva: true, quantidade: true } },
            metas: true,
          },
        },
        cobranca: {
          select: { id: true, fatura: true, estado: true, valor: true, pago: true },
        },
      },
      orderBy: [{ ano: "desc" }, { mes: "desc" }, { createdAt: "desc" }],
    })

    // Group vendas by objetivoVario
    const grouped: Record<string, {
      objetivo: {
        id: string
        titulo: string
        descricao: string | null
        mes: number
        ano: number
        produtos: { nome: string; precoSemIva: number; quantidade: number }[]
        metaValor: number
      }
      vendas: typeof serialized
      totalVendido: number
      totalObjetivoValor: number
      count: number
    }> = {}

    // Serialize decimals
    const serialized = vendas.map((v) => ({
      id: v.id,
      mes: v.mes,
      ano: v.ano,
      total: Number(v.total),
      objetivoVarioValor: Number(v.objetivoVarioValor || 0),
      notas: v.notas,
      createdAt: v.createdAt,
      cliente: v.cliente,
      cobranca: v.cobranca
        ? {
            id: v.cobranca.id,
            fatura: v.cobranca.fatura,
            estado: v.cobranca.estado,
            valor: Number(v.cobranca.valor),
            pago: v.cobranca.pago,
          }
        : null,
      objetivoVarioId: v.objetivoVarioId,
      objetivoVarioTitulo: v.objetivoVario?.titulo || "",
    }))

    for (const v of serialized) {
      const objId = v.objetivoVarioId!
      if (!grouped[objId]) {
        const obj = vendas.find((x) => x.objetivoVarioId === objId)?.objetivoVario
        const meta = obj?.metas?.find((m) => m.mes === (mes || v.mes) && m.ano === (ano || v.ano))
        grouped[objId] = {
          objetivo: {
            id: objId,
            titulo: obj?.titulo || "",
            descricao: obj?.descricao || null,
            mes: obj?.mes || v.mes,
            ano: obj?.ano || v.ano,
            produtos: (obj?.produtos || []).map((p) => ({
              nome: p.nome,
              precoSemIva: Number(p.precoSemIva),
              quantidade: p.quantidade,
            })),
            metaValor: meta ? Number(meta.objetivo) : 0,
          },
          vendas: [],
          totalVendido: 0,
          totalObjetivoValor: 0,
          count: 0,
        }
      }
      grouped[objId].vendas.push(v)
      grouped[objId].totalVendido += v.total
      grouped[objId].totalObjetivoValor += v.objetivoVarioValor
      grouped[objId].count++
    }

    const objetivos = Object.values(grouped)

    // Summary stats
    const summary = {
      totalVendas: serialized.length,
      totalVendido: serialized.reduce((s, v) => s + v.total, 0),
      totalObjetivoValor: serialized.reduce((s, v) => s + v.objetivoVarioValor, 0),
      totalObjetivos: objetivos.length,
    }

    return NextResponse.json({ objetivos, summary })
  } catch (error) {
    if (error instanceof Response) return error
    console.error("Error fetching objetivos varios vendas:", error)
    return NextResponse.json({ error: "Erro ao buscar vendas de objetivos varios" }, { status: 500 })
  }
}
