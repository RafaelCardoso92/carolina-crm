import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const mes = searchParams.get("mes") ? parseInt(searchParams.get("mes")!) : undefined
    const ano = searchParams.get("ano") ? parseInt(searchParams.get("ano")!) : undefined

    const vendas = await prisma.venda.findMany({
      where: {
        ...(mes && { mes }),
        ...(ano && { ano })
      },
      include: {
        cliente: true,
        itens: {
          include: {
            produto: true,
            devolucoes: true
          },
          orderBy: { createdAt: "asc" }
        },
        devolucoes: {
          include: {
            itens: {
              include: {
                itemVenda: {
                  include: { produto: true }
                },
                substituicao: true
              }
            },
            imagens: true
          },
          orderBy: { dataRegisto: "desc" }
        },
        cobranca: {
          include: {
            parcelas: {
              orderBy: { numero: "asc" }
            }
          }
        },
        campanhas: {
          include: {
            campanha: true
          }
        }
      },
      orderBy: [{ ano: "desc" }, { mes: "desc" }]
    })

    return NextResponse.json(vendas)
  } catch (error) {
    console.error("Error fetching vendas:", error)
    return NextResponse.json({ error: "Erro ao buscar vendas" }, { status: 500 })
  }
}

type ItemInput = {
  produtoId: string
  quantidade: number
  precoUnit: number
}

type CampanhaInput = {
  campanhaId: string
  quantidade: number
}

export async function POST(request: Request) {
  try {
    const data = await request.json()

    if (!data.clienteId || !data.mes || !data.ano) {
      return NextResponse.json({ error: "Cliente, mes e ano sao obrigatorios" }, { status: 400 })
    }

    // Calculate total from both manual values AND items
    // All values are stored ex-VAT (sem IVA)
    const itens: ItemInput[] = data.itens || []
    
    // Manual values (ex-VAT)
    const valor1 = data.valor1 ? parseFloat(data.valor1) : 0
    const valor2 = data.valor2 ? parseFloat(data.valor2) : 0
    const manualTotal = valor1 + valor2
    
    // Items total (ex-VAT)
    const itemsTotal = itens.reduce((sum: number, item: ItemInput) => {
      return sum + (item.quantidade * item.precoUnit)
    }, 0)
    
    // Combined total (ex-VAT)
    const total = manualTotal + itemsTotal

    if (total <= 0) {
      return NextResponse.json({ error: "O total deve ser maior que zero" }, { status: 400 })
    }

    // Payment tracking fields
    const fatura = data.fatura || null
    const numeroParcelas = data.numeroParcelas ? parseInt(data.numeroParcelas) : 1
    const dataInicioVencimento = data.dataInicioVencimento ? new Date(data.dataInicioVencimento) : null

    // Create venda with items and cobranca in a transaction
    const venda = await prisma.$transaction(async (tx) => {
      // Create the venda (stored ex-VAT)
      const newVenda = await tx.venda.create({
        data: {
          clienteId: data.clienteId,
          valor1: valor1 || null,
          valor2: valor2 || null,
          total,
          mes: data.mes,
          ano: data.ano,
          notas: data.notas || null
        }
      })

      // Create items if provided (stored ex-VAT)
      if (itens.length > 0) {
        await tx.itemVenda.createMany({
          data: itens.map((item: ItemInput) => ({
            vendaId: newVenda.id,
            produtoId: item.produtoId,
            quantidade: item.quantidade,
            precoUnit: item.precoUnit,
            subtotal: item.quantidade * item.precoUnit
          }))
        })
      }

      // Auto-create linked cobranca for payment tracking
      // Value with VAT (23%)
      const valorComIva = total * 1.23
      const comissaoPercent = 3.5
      const comissao = total * (comissaoPercent / 100)

      const cobranca = await tx.cobranca.create({
        data: {
          clienteId: data.clienteId,
          vendaId: newVenda.id,
          fatura,
          valor: valorComIva,
          valorSemIva: total,
          comissao,
          dataEmissao: new Date(),
          numeroParcelas,
          dataInicioVencimento,
          pago: false
        }
      })

      // Create installments if more than 1
      if (numeroParcelas > 1 && dataInicioVencimento) {
        const valorParcela = valorComIva / numeroParcelas
        const parcelas = []
        
        for (let i = 0; i < numeroParcelas; i++) {
          const dataVencimento = new Date(dataInicioVencimento)
          dataVencimento.setMonth(dataVencimento.getMonth() + i)
          
          parcelas.push({
            cobrancaId: cobranca.id,
            numero: i + 1,
            valor: valorParcela,
            dataVencimento,
            pago: false
          })
        }
        
        await tx.parcela.createMany({ data: parcelas })
      } else if (dataInicioVencimento) {
        // Single payment - create one parcela
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

      // Create campanha links if provided
      const campanhasInput: CampanhaInput[] = data.campanhas || []
      if (campanhasInput.length > 0) {
        await tx.campanhaVenda.createMany({
          data: campanhasInput.map((c: CampanhaInput) => ({
            vendaId: newVenda.id,
            campanhaId: c.campanhaId,
            quantidade: c.quantidade
          }))
        })
      }

      // Return venda with all relations
      return tx.venda.findUnique({
        where: { id: newVenda.id },
        include: {
          cliente: true,
          itens: {
            include: {
              produto: true,
              devolucoes: true
            }
          },
          devolucoes: {
            include: {
              itens: {
                include: {
                  itemVenda: { include: { produto: true } },
                  substituicao: true
                }
              },
              imagens: true
            }
          },
          cobranca: {
            include: {
              parcelas: { orderBy: { numero: "asc" } }
            }
          },
          campanhas: {
            include: { campanha: true }
          }
        }
      })
    })

    return NextResponse.json(venda, { status: 201 })
  } catch (error) {
    console.error("Error creating venda:", error)
    return NextResponse.json({ error: "Erro ao criar venda" }, { status: 500 })
  }
}
