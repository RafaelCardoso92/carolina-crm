import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { EstadoPipeline } from "@prisma/client"

// PATCH - Update pipeline state
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { estado } = await request.json()

    if (!estado || !Object.values(EstadoPipeline).includes(estado)) {
      return NextResponse.json(
        { error: "Estado inválido" },
        { status: 400 }
      )
    }

    const prospecto = await prisma.prospecto.update({
      where: { id },
      data: {
        estado: estado as EstadoPipeline,
        dataUltimoContacto: new Date(),
      },
    })

    return NextResponse.json(prospecto)
  } catch (error) {
    console.error("Error updating estado:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar estado" },
      { status: 500 }
    )
  }
}
