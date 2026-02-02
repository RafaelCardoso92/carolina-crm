import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { requirePermission, getEffectiveUserId } from "@/lib/api-auth"
import { PERMISSIONS, canViewAllData } from "@/lib/permissions"

export async function GET(request: Request) {
  try {
    const session = await requirePermission(PERMISSIONS.VENDAS_READ)
    const { searchParams } = new URL(request.url)
    const mes = searchParams.get("mes") ? parseInt(searchParams.get("mes")!) : undefined
    const ano = searchParams.get("ano") ? parseInt(searchParams.get("ano")!) : undefined

    // Build user scoped where clause through cliente relationship
    const userFilter = canViewAllData(session.user.role) && !session.user.impersonating
      ? {}
      : { cliente: { userId: getEffectiveUserId(session) } }

    const vendas = await prisma.venda.findMany({
      where: {
        ...userFilter,
        ...(mes && { mes }),
        ...(ano && { ano })
      },
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
          include: {
            campanha: true
          }
        },
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
    if (error instanceof Response) return error
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
    const session = await requirePermission(PERMISSIONS.VENDAS_WRITE)
    const effectiveUserId = getEffectiveUserId(session)
    const data = await request.json()

    // Verify the cliente belongs to this user
    const cliente = await prisma.cliente.findUnique({
      where: { id: data.clienteId },
      select: { userId: true }
    })

    if (!cliente) {
      return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 })
    }

    // Check ownership (unless MASTERADMIN not impersonating)
    if (!(canViewAllData(session.user.role) && !session.user.impersonating)) {
      if (cliente.userId !== effectiveUserId) {
        return NextResponse.json({ error: "Sem permissão para este cliente" }, { status: 403 })
      }
    }

    if (!data.clienteId || !data.mes || !data.ano) {
      return NextResponse.json({ error: "Cliente, mes e ano sao obrigatorios" }, { status: 400 })
    }

    // Calculate total from items if provided, otherwise from valor1/valor2
    let total = 0
    const itens: ItemInput[] = data.itens || []

    if (itens.length > 0) {
      // Calculate total from items
      total = itens.reduce((sum: number, item: ItemInput) => {
        return sum + (item.quantidade * item.precoUnit)
      }, 0)
    } else {
      // Backward compatibility: use valor1/valor2
      const valor1 = data.valor1 ? parseFloat(data.valor1) : 0
      const valor2 = data.valor2 ? parseFloat(data.valor2) : 0
      total = valor1 + valor2
    }

    if (total <= 0) {
      return NextResponse.json({ error: "O total deve ser maior que zero" }, { status: 400 })
    }

    // Create venda with items in a transaction
    // Support both old format (campanhaIds: string[]) and new format (campanhas: {id, quantidade}[])
    const campanhas: { id: string; quantidade: number }[] = data.campanhas ||
      (data.campanhaIds ? data.campanhaIds.map((id: string) => ({ id, quantidade: 1 })) : [])

    const venda = await prisma.$transaction(async (tx) => {
      // Create the venda
      const newVenda = await tx.venda.create({
        data: {
          clienteId: data.clienteId,
          objetivoVarioId: data.objetivoVarioId || null,
          objetivoVarioValor: data.objetivoVarioValor || null,
          valor1: data.valor1 || null,
          valor2: data.valor2 || null,
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

      // Create campanha associations if provided
      if (campanhas.length > 0) {
        await tx.campanhaVenda.createMany({
          data: campanhas.map((c: { id: string; quantidade: number }) => ({
            vendaId: newVenda.id,
            campanhaId: c.id,
            quantidade: c.quantidade
          }))
        })
      }

      // Create cobrança if requested
      if (data.criarCobranca && data.cobranca) {
        const numeroParcelas = data.cobranca.numeroParcelas || 1
        const dataEmissao = data.cobranca.dataEmissao
          ? new Date(data.cobranca.dataEmissao)
          : new Date()

        // Cobranca value includes objetivo vario value (which is NOT part of sale total)
        const IVA_RATE = 0.23
        const objetivoVarioValor = data.objetivoVarioValor ? parseFloat(data.objetivoVarioValor) : 0
        const cobrancaValorSemIva = total + objetivoVarioValor
        const cobrancaValorComIva = cobrancaValorSemIva * (1 + IVA_RATE)

        // Create the cobrança
        const cobranca = await tx.cobranca.create({
          data: {
            clienteId: data.clienteId,
            vendaId: newVenda.id,
            valor: cobrancaValorComIva, // Total + objetivo vario COM IVA
            valorSemIva: cobrancaValorSemIva,
            dataEmissao,
            dataInicioVencimento: dataEmissao, // Use emission date as first due date
            numeroParcelas,
            pago: false
          }
        })

        // Create parcelas if more than 1
        if (numeroParcelas > 1) {
          const valorParcela = cobrancaValorComIva / numeroParcelas
          const parcelas = []

          for (let i = 0; i < numeroParcelas; i++) {
            const dataVencimento = new Date(dataEmissao)
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
        }
      }

      // Return venda with items, client, objetivoVario, campanhas, cobranca, and devolucoes
      return tx.venda.findUnique({
        where: { id: newVenda.id },
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
            include: {
              campanha: true
            }
          },
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
    if (error instanceof Response) return error
    console.error("Error creating venda:", error)
    return NextResponse.json({ error: "Erro ao criar venda" }, { status: 500 })
  }
}
