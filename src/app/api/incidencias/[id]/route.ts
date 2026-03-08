import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { Decimal } from "@prisma/client/runtime/library"
import { getEffectiveUserId, canViewAllData } from "@/lib/permissions"

async function verifyIncidenciaOwnership(incidenciaId: string, session: { user: { id: string; role: string; impersonating?: { id: string } | null } }) {
  const incidencia = await prisma.incidencia.findUnique({
    where: { id: incidenciaId },
    include: { cliente: true }
  })

  if (!incidencia) return { incidencia: null, authorized: false }

  const effectiveUserId = getEffectiveUserId(session as Parameters<typeof getEffectiveUserId>[0])
  const canViewAll = canViewAllData(session.user.role as Parameters<typeof canViewAllData>[0]) && !session.user.impersonating

  if (!canViewAll && incidencia.cliente.userId !== effectiveUserId) {
    return { incidencia, authorized: false }
  }

  return { incidencia, authorized: true }
}

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
    const { incidencia, authorized } = await verifyIncidenciaOwnership(id, session)

    if (!incidencia) {
      return NextResponse.json({ error: "Incidencia not found" }, { status: 404 })
    }
    if (!authorized) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 })
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
    const { incidencia: existing, authorized } = await verifyIncidenciaOwnership(id, session)

    if (!existing) {
      return NextResponse.json({ error: "Incidencia not found" }, { status: 404 })
    }
    if (!authorized) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 })
    }

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
