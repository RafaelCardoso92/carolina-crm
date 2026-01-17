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

export async function POST(request: Request) {
  try {
    const data = await request.json()

    if (!data.clienteId || !data.mes || !data.ano) {
      return NextResponse.json({ error: "Cliente, mes e ano sao obrigatorios" }, { status: 400 })
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

    // No limit on sales per client per month - removed the check

    // Create venda with items in a transaction
    const venda = await prisma.$transaction(async (tx) => {
      // Create the venda
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

      // Create items if provided
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

      // Return venda with items, client, and devolucoes
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
