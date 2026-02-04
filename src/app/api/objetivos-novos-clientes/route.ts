import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const [anuais, trimestrais] = await Promise.all([
      prisma.objetivoNovosClientesAnual.findMany({
        orderBy: { ano: "desc" }
      }),
      prisma.objetivoNovosClientesTrimestral.findMany({
        orderBy: [{ ano: "desc" }, { trimestre: "asc" }]
      })
    ])

    return NextResponse.json({ anuais, trimestrais })
  } catch (error) {
    console.error("Error fetching objetivos novos clientes:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { tipo, ano, trimestre, objetivo } = body

    if (tipo === "anual") {
      const result = await prisma.objetivoNovosClientesAnual.upsert({
        where: { ano },
        update: { objetivo },
        create: { ano, objetivo }
      })
      return NextResponse.json(result)
    } else if (tipo === "trimestral") {
      const result = await prisma.objetivoNovosClientesTrimestral.upsert({
        where: { trimestre_ano: { trimestre, ano } },
        update: { objetivo },
        create: { trimestre, ano, objetivo }
      })
      return NextResponse.json(result)
    }

    return NextResponse.json({ error: "Invalid tipo" }, { status: 400 })
  } catch (error) {
    console.error("Error saving objetivo novos clientes:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const tipo = searchParams.get("tipo")

    if (!id || !tipo) {
      return NextResponse.json({ error: "Missing id or tipo" }, { status: 400 })
    }

    if (tipo === "anual") {
      await prisma.objetivoNovosClientesAnual.delete({ where: { id } })
    } else if (tipo === "trimestral") {
      await prisma.objetivoNovosClientesTrimestral.delete({ where: { id } })
    } else {
      return NextResponse.json({ error: "Invalid tipo" }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting objetivo novos clientes:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
