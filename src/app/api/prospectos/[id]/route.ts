import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET - Get single prospect
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const prospecto = await prisma.prospecto.findUnique({
      where: { id },
    })

    if (!prospecto) {
      return NextResponse.json(
        { error: "Prospecto não encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json(prospecto)
  } catch (error) {
    console.error("Error fetching prospecto:", error)
    return NextResponse.json(
      { error: "Erro ao buscar prospecto" },
      { status: 500 }
    )
  }
}

// PUT - Update prospect
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()

    const prospecto = await prisma.prospecto.update({
      where: { id },
      data: {
        nomeEmpresa: data.nomeEmpresa,
        tipoNegocio: data.tipoNegocio || null,
        website: data.website || null,
        facebook: data.facebook || null,
        instagram: data.instagram || null,
        nomeContacto: data.nomeContacto || null,
        cargoContacto: data.cargoContacto || null,
        telefone: data.telefone || null,
        email: data.email || null,
        morada: data.morada || null,
        cidade: data.cidade || null,
        codigoPostal: data.codigoPostal || null,
        latitude: data.latitude || null,
        longitude: data.longitude || null,
        estado: data.estado,
        proximaAccao: data.proximaAccao || null,
        dataProximaAccao: data.dataProximaAccao ? new Date(data.dataProximaAccao) : null,
        notas: data.notas || null,
        fonte: data.fonte || null,
        dataUltimoContacto: data.dataUltimoContacto ? new Date(data.dataUltimoContacto) : undefined,
      },
    })

    return NextResponse.json(prospecto)
  } catch (error) {
    console.error("Error updating prospecto:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar prospecto" },
      { status: 500 }
    )
  }
}

// DELETE - Archive prospect (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await prisma.prospecto.update({
      where: { id },
      data: { ativo: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting prospecto:", error)
    return NextResponse.json(
      { error: "Erro ao eliminar prospecto" },
      { status: 500 }
    )
  }
}
