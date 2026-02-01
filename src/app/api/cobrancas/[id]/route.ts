import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { requirePermission, getEffectiveUserId } from "@/lib/api-auth"
import { PERMISSIONS, canViewAllData } from "@/lib/permissions"

// Helper to check cobranca ownership through cliente
async function checkCobrancaOwnership(
  cobrancaId: string,
  effectiveUserId: string,
  canViewAll: boolean
): Promise<{ owned: boolean; cobranca: { clienteId: string; cliente: { userId: string | null } } | null }> {
  const cobranca = await prisma.cobranca.findUnique({
    where: { id: cobrancaId },
    select: {
      clienteId: true,
      cliente: { select: { userId: true } }
    }
  })

  if (!cobranca) return { owned: false, cobranca: null }
  if (canViewAll) return { owned: true, cobranca }
  if (cobranca.cliente.userId !== effectiveUserId) return { owned: false, cobranca }

  return { owned: true, cobranca }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission(PERMISSIONS.COBRANCAS_READ)
    const effectiveUserId = getEffectiveUserId(session)
    const canViewAll = canViewAllData(session.user.role) && !session.user.impersonating
    const { id } = await params

    const { owned, cobranca: cobrancaCheck } = await checkCobrancaOwnership(id, effectiveUserId, canViewAll)

    if (!cobrancaCheck) {
      return NextResponse.json({ error: "Cobranca nao encontrada" }, { status: 404 })
    }

    if (!owned) {
      return NextResponse.json({ error: "Sem permissao" }, { status: 403 })
    }

    const cobranca = await prisma.cobranca.findUnique({
      where: { id },
      include: {
        cliente: true,
        parcelas: {
          orderBy: { numero: "asc" }
        }
      }
    })

    return NextResponse.json(cobranca)
  } catch (error) {
    if (error instanceof Response) return error
    console.error("Error fetching cobranca:", error)
    return NextResponse.json({ error: "Erro ao buscar cobranca" }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission(PERMISSIONS.COBRANCAS_WRITE)
    const effectiveUserId = getEffectiveUserId(session)
    const canViewAll = canViewAllData(session.user.role) && !session.user.impersonating
    const { id } = await params
    const data = await request.json()

    // Check ownership
    const { owned, cobranca: cobrancaCheck } = await checkCobrancaOwnership(id, effectiveUserId, canViewAll)

    if (!cobrancaCheck) {
      return NextResponse.json({ error: "Cobranca nao encontrada" }, { status: 404 })
    }

    if (!owned) {
      return NextResponse.json({ error: "Sem permissao" }, { status: 403 })
    }

    if (!data.clienteId || !data.valor) {
      return NextResponse.json({ error: "Cliente e valor sao obrigatorios" }, { status: 400 })
    }

    // If changing cliente, verify ownership of new cliente
    if (data.clienteId !== cobrancaCheck.clienteId) {
      const newCliente = await prisma.cliente.findUnique({
        where: { id: data.clienteId },
        select: { userId: true }
      })

      if (!newCliente) {
        return NextResponse.json({ error: "Cliente nao encontrado" }, { status: 404 })
      }

      if (!canViewAll && newCliente.userId !== effectiveUserId) {
        return NextResponse.json({ error: "Sem permissao para este cliente" }, { status: 403 })
      }
    }

    const cobranca = await prisma.cobranca.update({
      where: { id },
      data: {
        clienteId: data.clienteId,
        fatura: data.fatura || null,
        valor: data.valor,
        valorSemIva: data.valorSemIva || null,
        comissao: data.comissao || null,
        dataEmissao: data.dataEmissao ? new Date(data.dataEmissao) : null,
        notas: data.notas || null
      },
      include: {
        cliente: true,
        parcelas: {
          orderBy: { numero: "asc" }
        }
      }
    })

    return NextResponse.json(cobranca)
  } catch (error) {
    if (error instanceof Response) return error
    console.error("Error updating cobranca:", error)
    return NextResponse.json({ error: "Erro ao atualizar cobranca" }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission(PERMISSIONS.COBRANCAS_WRITE)
    const effectiveUserId = getEffectiveUserId(session)
    const canViewAll = canViewAllData(session.user.role) && !session.user.impersonating
    const { id } = await params
    const data = await request.json()

    // Check ownership
    const { owned, cobranca: cobrancaCheck } = await checkCobrancaOwnership(id, effectiveUserId, canViewAll)

    if (!cobrancaCheck) {
      return NextResponse.json({ error: "Cobranca nao encontrada" }, { status: 404 })
    }

    if (!owned) {
      return NextResponse.json({ error: "Sem permissao" }, { status: 403 })
    }

    const cobranca = await prisma.cobranca.update({
      where: { id },
      data: {
        pago: data.pago,
        dataPago: data.dataPago ? new Date(data.dataPago) : null
      },
      include: {
        cliente: true,
        parcelas: {
          orderBy: { numero: "asc" }
        }
      }
    })

    return NextResponse.json(cobranca)
  } catch (error) {
    if (error instanceof Response) return error
    console.error("Error patching cobranca:", error)
    return NextResponse.json({ error: "Erro ao atualizar cobranca" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission(PERMISSIONS.COBRANCAS_WRITE)
    const effectiveUserId = getEffectiveUserId(session)
    const canViewAll = canViewAllData(session.user.role) && !session.user.impersonating
    const { id } = await params

    const { owned, cobranca: cobrancaCheck } = await checkCobrancaOwnership(id, effectiveUserId, canViewAll)

    if (!cobrancaCheck) {
      return NextResponse.json({ error: "Cobranca nao encontrada" }, { status: 404 })
    }

    if (!owned) {
      return NextResponse.json({ error: "Sem permissao" }, { status: 403 })
    }

    await prisma.cobranca.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Response) return error
    console.error("Error deleting cobranca:", error)
    return NextResponse.json({ error: "Erro ao eliminar cobranca" }, { status: 500 })
  }
}
