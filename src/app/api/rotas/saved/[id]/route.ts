import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET - Get a specific saved route
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const rota = await prisma.rotaSalva.findUnique({
      where: { id }
    })

    if (!rota) {
      return NextResponse.json(
        { error: "Rota não encontrada" },
        { status: 404 }
      )
    }

    return NextResponse.json(rota)
  } catch (error) {
    console.error("Error fetching route:", error)
    return NextResponse.json(
      { error: "Erro ao carregar rota" },
      { status: 500 }
    )
  }
}

// PUT - Update a saved route
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()

    const rota = await prisma.rotaSalva.update({
      where: { id },
      data: {
        nome: data.nome,
        data: data.data ? new Date(data.data) : undefined,
        origemLatitude: data.origemLatitude,
        origemLongitude: data.origemLongitude,
        origemEndereco: data.origemEndereco,
        locais: data.locais,
        distanciaTotal: data.distanciaTotal,
        duracaoTotal: data.duracaoTotal,
        concluida: data.concluida
      }
    })

    return NextResponse.json(rota)
  } catch (error) {
    console.error("Error updating route:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar rota" },
      { status: 500 }
    )
  }
}

// PATCH - Mark route as complete/incomplete
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()

    const rota = await prisma.rotaSalva.update({
      where: { id },
      data
    })

    return NextResponse.json(rota)
  } catch (error) {
    console.error("Error patching route:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar rota" },
      { status: 500 }
    )
  }
}

// DELETE - Delete a saved route
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.rotaSalva.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting route:", error)
    return NextResponse.json(
      { error: "Erro ao eliminar rota" },
      { status: 500 }
    )
  }
}
