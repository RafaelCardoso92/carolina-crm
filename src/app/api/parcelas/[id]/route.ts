import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { userScopedWhere } from "@/lib/api-auth"
import { recalcularEstadoCobranca } from "@/lib/cobranca-estado"

// GET single parcela
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const { id } = await params
    // Ownership via cobranca -> cliente (sellers only see their own clients' parcelas)
    const parcela = await prisma.parcela.findFirst({
      where: { id, cobranca: { cliente: { ...userScopedWhere(session) } } },
      include: {
        cobranca: {
          include: { cliente: true }
        }
      }
    })

    if (!parcela) {
      return NextResponse.json({ error: "Parcela não encontrada" }, { status: 404 })
    }

    return NextResponse.json(parcela)
  } catch (error) {
    console.error("Error fetching parcela:", error)
    return NextResponse.json({ error: "Erro ao buscar parcela" }, { status: 500 })
  }
}

// PATCH to mark parcela as paid/unpaid
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const { id } = await params
    const data = await request.json()

    // Ownership via cobranca -> cliente (sellers can only touch their own clients' parcelas)
    const existing = await prisma.parcela.findFirst({
      where: { id, cobranca: { cliente: { ...userScopedWhere(session) } } },
      select: { id: true }
    })
    if (!existing) {
      return NextResponse.json({ error: "Parcela não encontrada" }, { status: 404 })
    }

    // Update the parcela and re-derive the cobranca from all its parcelas (atomic)
    await prisma.$transaction(async (tx) => {
      const parcela = await tx.parcela.update({
        where: { id },
        data: {
          pago: data.pago,
          dataPago: data.pago
            ? (data.dataPago ? new Date(data.dataPago) : new Date())
            : null,
          valorPago: data.valorPago !== undefined ? data.valorPago : undefined,
          notas: data.notas !== undefined ? data.notas : undefined
        }
      })
      await recalcularEstadoCobranca(tx, parcela.cobrancaId)
    })

    // Return updated parcela with cobranca
    const updatedParcela = await prisma.parcela.findUnique({
      where: { id },
      include: {
        cobranca: {
          include: {
            cliente: true,
            parcelas: {
              orderBy: { numero: "asc" }
            }
          }
        }
      }
    })

    return NextResponse.json(updatedParcela)
  } catch (error) {
    console.error("Error updating parcela:", error)
    return NextResponse.json({ error: "Erro ao atualizar parcela" }, { status: 500 })
  }
}
