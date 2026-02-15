import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Get segments
export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const clienteId = searchParams.get("clienteId")

    if (!clienteId) {
      const segmentos = await prisma.clienteSegmento.findMany({
        include: { cliente: { select: { id: true, nome: true, codigo: true } } }
      })
      return NextResponse.json(segmentos)
    }

    const segmento = await prisma.clienteSegmento.findUnique({
      where: { clienteId },
      include: { cliente: { select: { id: true, nome: true } } }
    })

    return NextResponse.json(segmento)
  } catch (error) {
    console.error("Error fetching segmento:", error)
    return NextResponse.json({ error: "Erro ao carregar segmento" }, { status: 500 })
  }
}

// POST - Create or update segment
export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { clienteId, segmento, tags, potencialMensal, notas } = body

    if (!clienteId) {
      return NextResponse.json({ error: "ClienteId e obrigatorio" }, { status: 400 })
    }

    const result = await prisma.clienteSegmento.upsert({
      where: { clienteId },
      update: {
        segmento: segmento || "C",
        tags: tags || [],
        potencialMensal: potencialMensal ? parseFloat(potencialMensal) : null,
        notas
      },
      create: {
        clienteId,
        segmento: segmento || "C",
        tags: tags || [],
        potencialMensal: potencialMensal ? parseFloat(potencialMensal) : null,
        notas
      }
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error("Error saving segmento:", error)
    return NextResponse.json({ error: "Erro ao guardar segmento" }, { status: 500 })
  }
}
