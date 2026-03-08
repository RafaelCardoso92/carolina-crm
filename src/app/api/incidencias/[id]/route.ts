import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { Decimal } from "@prisma/client/runtime/library"

// DELETE - Remove incidencia and revert credit if needed
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const incidencia = await prisma.incidencia.findUnique({
      where: { id },
      include: { cliente: true }
    })

    if (!incidencia) {
      return NextResponse.json({ error: "Incidencia not found" }, { status: 404 })
    }

    await prisma.$transaction(async (tx) => {
      if (incidencia.aplicadoACredito) {
        const saldoAnterior = incidencia.cliente.saldoCredito || new Decimal(0)
        const saldoNovo = saldoAnterior.minus(incidencia.valor)

        await tx.cliente.update({
          where: { id: incidencia.clienteId },
          data: { saldoCredito: saldoNovo.greaterThan(0) ? saldoNovo : new Decimal(0) }
        })

        await tx.movimentoCredito.create({
          data: {
            clienteId: incidencia.clienteId,
            tipo: "CREDITO_ESTORNADO",
            valor: incidencia.valor,
            saldoAnterior,
            saldoNovo: saldoNovo.greaterThan(0) ? saldoNovo : new Decimal(0),
            incidenciaId: incidencia.id,
            descricao: `Estorno de nota de crédito: ${incidencia.motivo}`
          }
        })
      }

      await tx.incidencia.delete({ where: { id } })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting incidencia:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT - Update incidencia
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { valor, motivo, notas } = body

    const incidencia = await prisma.incidencia.update({
      where: { id },
      data: {
        ...(valor !== undefined && { valor }),
        ...(motivo && { motivo }),
        ...(notas !== undefined && { notas })
      }
    })

    return NextResponse.json(incidencia)
  } catch (error) {
    console.error("Error updating incidencia:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
