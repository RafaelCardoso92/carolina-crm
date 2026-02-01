import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { requirePermission, getEffectiveUserId } from "@/lib/api-auth"
import { PERMISSIONS, canViewAllData } from "@/lib/permissions"

type ItemInput = {
  produtoId: string
  quantidade: number
  precoUnit: number
}

// Helper to check venda ownership through cliente
async function checkVendaOwnership(
  vendaId: string,
  effectiveUserId: string,
  canViewAll: boolean
): Promise<{ owned: boolean; venda: { clienteId: string; cliente: { userId: string | null } } | null }> {
  const venda = await prisma.venda.findUnique({
    where: { id: vendaId },
    select: {
      clienteId: true,
      cliente: { select: { userId: true } }
    }
  })

  if (!venda) return { owned: false, venda: null }
  if (canViewAll) return { owned: true, venda }
  if (venda.cliente.userId !== effectiveUserId) return { owned: false, venda }

  return { owned: true, venda }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission(PERMISSIONS.VENDAS_READ)
    const effectiveUserId = getEffectiveUserId(session)
    const canViewAll = canViewAllData(session.user.role) && !session.user.impersonating
    const { id } = await params

    const { owned, venda: vendaCheck } = await checkVendaOwnership(id, effectiveUserId, canViewAll)

    if (!vendaCheck) {
      return NextResponse.json({ error: "Venda nao encontrada" }, { status: 404 })
    }

    if (!owned) {
      return NextResponse.json({ error: "Sem permissao" }, { status: 403 })
    }

    const venda = await prisma.venda.findUnique({
      where: { id },
      include: {
        cliente: true,
        objetivoVario: true,
        cobranca: {
          select: {
            id: true,
            valor: true,
            pago: true
          }
        },
        campanhas: {
          include: { campanha: true }
        },
        itens: {
          include: { produto: true },
          orderBy: { createdAt: "asc" }
        }
      }
    })

    return NextResponse.json(venda)
  } catch (error) {
    if (error instanceof Response) return error
    console.error("Error fetching venda:", error)
    return NextResponse.json({ error: "Erro ao buscar venda" }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission(PERMISSIONS.VENDAS_WRITE)
    const effectiveUserId = getEffectiveUserId(session)
    const canViewAll = canViewAllData(session.user.role) && !session.user.impersonating
    const { id } = await params
    const data = await request.json()

    // Check ownership of the venda being updated
    const { owned, venda: vendaCheck } = await checkVendaOwnership(id, effectiveUserId, canViewAll)

    if (!vendaCheck) {
      return NextResponse.json({ error: "Venda nao encontrada" }, { status: 404 })
    }

    if (!owned) {
      return NextResponse.json({ error: "Sem permissao" }, { status: 403 })
    }

    if (!data.clienteId) {
      return NextResponse.json({ error: "Cliente e obrigatorio" }, { status: 400 })
    }

    // If changing cliente, verify ownership of new cliente
    if (data.clienteId !== vendaCheck.clienteId) {
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

    // Calculate total from items if provided, otherwise from valor1/valor2
    let total = 0
    const itens: ItemInput[] = data.itens || []

    if (itens.length > 0) {
      total = itens.reduce((sum: number, item: ItemInput) => {
        return sum + (item.quantidade * item.precoUnit)
      }, 0)
    } else {
      const valor1 = data.valor1 ? parseFloat(data.valor1) : 0
      const valor2 = data.valor2 ? parseFloat(data.valor2) : 0
      total = valor1 + valor2
    }

    if (total <= 0) {
      return NextResponse.json({ error: "O total deve ser maior que zero" }, { status: 400 })
    }

    // Check if another venda exists for this client/month/year
    const existing = await prisma.venda.findFirst({
      where: {
        clienteId: data.clienteId,
        mes: data.mes,
        ano: data.ano,
        NOT: { id }
      }
    })

    if (existing) {
      return NextResponse.json({ error: "Ja existe outra venda para este cliente neste mes" }, { status: 400 })
    }

    // Update venda with items in a transaction
    // Support both old format (campanhaIds: string[]) and new format (campanhas: {id, quantidade}[])
    const campanhas: { id: string; quantidade: number }[] = data.campanhas ||
      (data.campanhaIds ? data.campanhaIds.map((id: string) => ({ id, quantidade: 1 })) : [])

    const venda = await prisma.$transaction(async (tx) => {
      // Delete existing items
      await tx.itemVenda.deleteMany({
        where: { vendaId: id }
      })

      // Delete existing campanha associations
      await tx.campanhaVenda.deleteMany({
        where: { vendaId: id }
      })

      // Update the venda
      await tx.venda.update({
        where: { id },
        data: {
          clienteId: data.clienteId,
          objetivoVarioId: data.objetivoVarioId || null,
          objetivoVarioValor: data.objetivoVarioValor || null,
          valor1: data.valor1 || null,
          valor2: data.valor2 || null,
          total,
          notas: data.notas || null
        }
      })

      // Create new items if provided
      if (itens.length > 0) {
        await tx.itemVenda.createMany({
          data: itens.map((item: ItemInput) => ({
            vendaId: id,
            produtoId: item.produtoId,
            quantidade: item.quantidade,
            precoUnit: item.precoUnit,
            subtotal: item.quantidade * item.precoUnit
          }))
        })
      }

      // Create new campanha associations if provided
      if (campanhas.length > 0) {
        await tx.campanhaVenda.createMany({
          data: campanhas.map((c: { id: string; quantidade: number }) => ({
            vendaId: id,
            campanhaId: c.id,
            quantidade: c.quantidade
          }))
        })
      }

      // Return venda with items, client, objetivoVario, campanhas, and cobranca
      return tx.venda.findUnique({
        where: { id },
        include: {
          cliente: true,
          objetivoVario: true,
          cobranca: {
            select: {
              id: true,
              valor: true,
              pago: true
            }
          },
          campanhas: {
            include: { campanha: true }
          },
          itens: {
            include: { produto: true },
            orderBy: { createdAt: "asc" }
          }
        }
      })
    })

    return NextResponse.json(venda)
  } catch (error) {
    if (error instanceof Response) return error
    console.error("Error updating venda:", error)
    return NextResponse.json({ error: "Erro ao atualizar venda" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission(PERMISSIONS.VENDAS_WRITE)
    const effectiveUserId = getEffectiveUserId(session)
    const canViewAll = canViewAllData(session.user.role) && !session.user.impersonating
    const { id } = await params

    const { owned, venda: vendaCheck } = await checkVendaOwnership(id, effectiveUserId, canViewAll)

    if (!vendaCheck) {
      return NextResponse.json({ error: "Venda nao encontrada" }, { status: 404 })
    }

    if (!owned) {
      return NextResponse.json({ error: "Sem permissao" }, { status: 403 })
    }

    await prisma.venda.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Response) return error
    console.error("Error deleting venda:", error)
    return NextResponse.json({ error: "Erro ao eliminar venda" }, { status: 500 })
  }
}
