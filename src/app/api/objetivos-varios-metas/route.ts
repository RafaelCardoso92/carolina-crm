import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - List metas for objetivos varios
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const objetivoVarioId = searchParams.get("objetivoVarioId")
    const mes = searchParams.get("mes")
    const ano = searchParams.get("ano")

    const where: Record<string, unknown> = {}
    if (objetivoVarioId) where.objetivoVarioId = objetivoVarioId
    if (mes) where.mes = parseInt(mes)
    if (ano) where.ano = parseInt(ano)

    const metas = await prisma.objetivoVarioMeta.findMany({
      where,
      include: {
        objetivoVario: {
          select: { id: true, titulo: true }
        }
      },
      orderBy: [{ ano: "desc" }, { mes: "desc" }]
    })

    return NextResponse.json(metas.map(m => ({
      ...m,
      objetivo: Number(m.objetivo)
    })))
  } catch (error) {
    console.error("Error fetching objetivos varios metas:", error)
    return NextResponse.json({ error: "Erro ao carregar metas" }, { status: 500 })
  }
}

// POST - Create or update meta
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { objetivoVarioId, mes, ano, objetivo } = body

    if (!objetivoVarioId || !mes || !ano || objetivo === undefined) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 })
    }

    // Upsert - create or update
    const meta = await prisma.objetivoVarioMeta.upsert({
      where: {
        objetivoVarioId_mes_ano: { objetivoVarioId, mes, ano }
      },
      update: { objetivo },
      create: { objetivoVarioId, mes, ano, objetivo }
    })

    return NextResponse.json({
      ...meta,
      objetivo: Number(meta.objetivo)
    })
  } catch (error) {
    console.error("Error saving objetivo vario meta:", error)
    return NextResponse.json({ error: "Erro ao guardar meta" }, { status: 500 })
  }
}

// DELETE - Delete meta
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID nao fornecido" }, { status: 400 })
    }

    await prisma.objetivoVarioMeta.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting objetivo vario meta:", error)
    return NextResponse.json({ error: "Erro ao eliminar meta" }, { status: 500 })
  }
}
