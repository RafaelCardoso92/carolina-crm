import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

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
    const parcela = await prisma.parcela.findUnique({
      where: { id },
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

    // Update the parcela - use provided dataPago if given, otherwise default to current date
    const parcela = await prisma.parcela.update({
      where: { id },
      data: {
        pago: data.pago,
        dataPago: data.pago 
          ? (data.dataPago ? new Date(data.dataPago) : new Date()) 
          : null,
        valorPago: data.valorPago !== undefined ? data.valorPago : undefined,
        notas: data.notas !== undefined ? data.notas : undefined
      },
      include: {
        cobranca: true
      }
    })

    // Check if all parcelas are paid for the parent cobranca
    const unpaidCount = await prisma.parcela.count({
      where: {
        cobrancaId: parcela.cobrancaId,
        pago: false
      }
    })

    // If all parcelas are paid, mark the cobranca as paid
    if (unpaidCount === 0) {
      // Use the most recent payment date from parcelas
      const latestPaidParcela = await prisma.parcela.findFirst({
        where: {
          cobrancaId: parcela.cobrancaId,
          pago: true,
          dataPago: { not: null }
        },
        orderBy: { dataPago: 'desc' }
      })
      
      await prisma.cobranca.update({
        where: { id: parcela.cobrancaId },
        data: {
          pago: true,
          dataPago: latestPaidParcela?.dataPago || new Date(),
          estado: "PAGO"
        }
      })
    } else {
      // If any parcela is unpaid, ensure cobranca is marked as unpaid
      await prisma.cobranca.update({
        where: { id: parcela.cobrancaId },
        data: {
          pago: false,
          dataPago: null,
          estado: "PENDENTE"
        }
      })
    }

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
