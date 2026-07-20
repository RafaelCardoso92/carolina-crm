import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requirePermission, getEffectiveUserId } from "@/lib/api-auth"
import { PERMISSIONS, canViewAllData } from "@/lib/permissions"

// POST - Repeat/duplicate a sale for quick re-order
export async function POST(request: NextRequest) {
  try {
    const session = await requirePermission(PERMISSIONS.VENDAS_WRITE)
    const body = await request.json()
    const { vendaId, mes, ano } = body

    if (!vendaId) {
      return NextResponse.json({ error: "VendaId e obrigatorio" }, { status: 400 })
    }

    // Get the original sale with items
    const vendaOriginal = await prisma.venda.findUnique({
      where: { id: vendaId },
      include: {
        cliente: { select: { userId: true } },
        itens: {
          include: { produto: true }
        }
      }
    })

    if (!vendaOriginal) {
      return NextResponse.json({ error: "Venda não encontrada" }, { status: 404 })
    }

    // Ownership check (sellers can only repeat sales of their own clients)
    if (!canViewAllData(session.user.role) || session.user.impersonating) {
      if (vendaOriginal.cliente.userId !== getEffectiveUserId(session)) {
        return NextResponse.json({ error: "Sem permissão para esta venda" }, { status: 403 })
      }
    }

    const now = new Date()
    const targetMes = mes || now.getMonth() + 1
    const targetAno = ano || now.getFullYear()

    // Create new sale with same items
    const novaVenda = await prisma.venda.create({
      data: {
        clienteId: vendaOriginal.clienteId,
        valor1: vendaOriginal.valor1,
        valor2: vendaOriginal.valor2,
        total: vendaOriginal.total,
        mes: targetMes,
        ano: targetAno,
        notas: `Repetida da venda de ${vendaOriginal.mes}/${vendaOriginal.ano}`,
        itens: {
          create: vendaOriginal.itens.map(item => ({
            produtoId: item.produtoId,
            quantidade: item.quantidade,
            precoUnit: item.precoUnit,
            subtotal: item.subtotal
          }))
        }
      },
      include: {
        cliente: { select: { id: true, nome: true } },
        itens: { include: { produto: true } }
      }
    })

    return NextResponse.json(novaVenda, { status: 201 })
  } catch (error) {
    if (error instanceof Response) return error
    console.error("Error repeating venda:", error)
    return NextResponse.json({ error: "Erro ao repetir venda" }, { status: 500 })
  }
}
