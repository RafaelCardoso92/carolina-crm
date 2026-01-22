import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

type ItemInput = {
  produtoId: string
  quantidade: number
  precoUnit: number
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const venda = await prisma.venda.findUnique({
      where: { id },
      include: {
        cliente: true,
        itens: {
          include: { produto: true },
          orderBy: { createdAt: "asc" }
        },
        cobranca: {
          include: {
            parcelas: { orderBy: { numero: "asc" } }
          }
        }
      }
    })

    if (!venda) {
      return NextResponse.json({ error: "Venda nao encontrada" }, { status: 404 })
    }

    return NextResponse.json(venda)
  } catch (error) {
    console.error("Error fetching venda:", error)
    return NextResponse.json({ error: "Erro ao buscar venda" }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()

    if (!data.clienteId) {
      return NextResponse.json({ error: "Cliente e obrigatorio" }, { status: 400 })
    }

    // Calculate total from both manual values AND items
    const itens: ItemInput[] = data.itens || []
    
    // Manual values
    const valor1 = data.valor1 ? parseFloat(data.valor1) : 0
    const valor2 = data.valor2 ? parseFloat(data.valor2) : 0
    const manualTotal = valor1 + valor2
    
    // Items total
    const itemsTotal = itens.reduce((sum: number, item: ItemInput) => {
      return sum + (item.quantidade * item.precoUnit)
    }, 0)
    
    // Combined total
    const total = manualTotal + itemsTotal

    if (total <= 0) {
      return NextResponse.json({ error: "O total deve ser maior que zero" }, { status: 400 })
    }

    // Payment tracking fields
    const fatura = data.fatura !== undefined ? data.fatura : undefined
    const numeroParcelas = data.numeroParcelas ? parseInt(data.numeroParcelas) : undefined
    const dataInicioVencimento = data.dataInicioVencimento ? new Date(data.dataInicioVencimento) : undefined

    // Update venda with items in a transaction
    const venda = await prisma.$transaction(async (tx) => {
      // Delete existing items
      await tx.itemVenda.deleteMany({
        where: { vendaId: id }
      })

      // Update the venda
      await tx.venda.update({
        where: { id },
        data: {
          clienteId: data.clienteId,
          valor1: valor1 || null,
          valor2: valor2 || null,
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

      // Update linked cobranca if it exists
      const existingCobranca = await tx.cobranca.findUnique({
        where: { vendaId: id }
      })

      if (existingCobranca) {
        // Value with VAT (23%)
        const valorComIva = total * 1.23
        const comissaoPercent = 3.5
        const comissao = total * (comissaoPercent / 100)

        // Build update data
        const cobrancaUpdate: Record<string, unknown> = {
          clienteId: data.clienteId,
          valor: valorComIva,
          valorSemIva: total,
          comissao
        }

        if (fatura !== undefined) {
          cobrancaUpdate.fatura = fatura || null
        }

        await tx.cobranca.update({
          where: { vendaId: id },
          data: cobrancaUpdate
        })

        // Update parcelas if installment data changed
        if (numeroParcelas !== undefined && dataInicioVencimento !== undefined) {
          // Delete existing parcelas and recreate
          await tx.parcela.deleteMany({
            where: { cobrancaId: existingCobranca.id }
          })

          if (numeroParcelas > 1) {
            const valorParcela = valorComIva / numeroParcelas
            const parcelas = []
            
            for (let i = 0; i < numeroParcelas; i++) {
              const dataVenc = new Date(dataInicioVencimento)
              dataVenc.setMonth(dataVenc.getMonth() + i)
              
              parcelas.push({
                cobrancaId: existingCobranca.id,
                numero: i + 1,
                valor: valorParcela,
                dataVencimento: dataVenc,
                pago: false
              })
            }
            
            await tx.parcela.createMany({ data: parcelas })
          } else {
            await tx.parcela.create({
              data: {
                cobrancaId: existingCobranca.id,
                numero: 1,
                valor: valorComIva,
                dataVencimento: dataInicioVencimento,
                pago: false
              }
            })
          }

          // Update cobranca with installment info
          await tx.cobranca.update({
            where: { vendaId: id },
            data: {
              numeroParcelas,
              dataInicioVencimento
            }
          })
        }
      } else {
        // Create cobranca if it doesn't exist (for old vendas)
        const valorComIva = total * 1.23
        const comissaoPercent = 3.5
        const comissao = total * (comissaoPercent / 100)
        const numParcelas = numeroParcelas || 1

        const cobranca = await tx.cobranca.create({
          data: {
            clienteId: data.clienteId,
            vendaId: id,
            fatura: fatura || null,
            valor: valorComIva,
            valorSemIva: total,
            comissao,
            dataEmissao: new Date(),
            numeroParcelas: numParcelas,
            dataInicioVencimento: dataInicioVencimento || null,
            pago: false
          }
        })

        // Create parcelas if date provided
        if (dataInicioVencimento) {
          if (numParcelas > 1) {
            const valorParcela = valorComIva / numParcelas
            const parcelas = []
            
            for (let i = 0; i < numParcelas; i++) {
              const dataVenc = new Date(dataInicioVencimento)
              dataVenc.setMonth(dataVenc.getMonth() + i)
              
              parcelas.push({
                cobrancaId: cobranca.id,
                numero: i + 1,
                valor: valorParcela,
                dataVencimento: dataVenc,
                pago: false
              })
            }
            
            await tx.parcela.createMany({ data: parcelas })
          } else {
            await tx.parcela.create({
              data: {
                cobrancaId: cobranca.id,
                numero: 1,
                valor: valorComIva,
                dataVencimento: dataInicioVencimento,
                pago: false
              }
            })
          }
        }
      }

      // Return venda with items and client
      return tx.venda.findUnique({
        where: { id },
        include: {
          cliente: true,
          itens: {
            include: { produto: true },
            orderBy: { createdAt: "asc" }
          },
          cobranca: {
            include: {
              parcelas: { orderBy: { numero: "asc" } }
            }
          }
        }
      })
    })

    return NextResponse.json(venda)
  } catch (error) {
    console.error("Error updating venda:", error)
    return NextResponse.json({ error: "Erro ao atualizar venda" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Delete venda (cobranca will cascade delete due to onDelete: Cascade)
    await prisma.venda.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting venda:", error)
    return NextResponse.json({ error: "Erro ao eliminar venda" }, { status: 500 })
  }
}
