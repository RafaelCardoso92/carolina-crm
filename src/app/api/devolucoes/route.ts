import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import type { CreateDevolucaoRequest, DevolucaoListResponse, DevolucaoResponse } from "@/types/devolucao"

// GET - List returns (optionally filtered by vendaId)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vendaId = searchParams.get("vendaId")

    const where = vendaId ? { vendaId } : {}

    const devolucoes = await prisma.devolucao.findMany({
      where,
      include: {
        venda: {
          include: {
            cliente: true
          }
        },
        itens: {
          include: {
            itemVenda: {
              include: {
                produto: true
              }
            },
            substituicao: true
          }
        },
        imagens: true
      },
      orderBy: { dataRegisto: "desc" }
    })

    return NextResponse.json<DevolucaoListResponse>({
      success: true,
      devolucoes
    })
  } catch (error) {
    console.error("Error fetching devolucoes:", error)
    return NextResponse.json<DevolucaoListResponse>(
      { success: false, error: "Erro ao carregar devoluções" },
      { status: 500 }
    )
  }
}

// POST - Create new return
export async function POST(request: NextRequest) {
  try {
    const body: CreateDevolucaoRequest = await request.json()
    const { vendaId, motivo, itens } = body

    // Validate required fields
    if (!vendaId) {
      return NextResponse.json<DevolucaoResponse>(
        { success: false, error: "ID da venda é obrigatório" },
        { status: 400 }
      )
    }

    if (!itens || itens.length === 0) {
      return NextResponse.json<DevolucaoResponse>(
        { success: false, error: "Pelo menos um item deve ser devolvido" },
        { status: 400 }
      )
    }

    // Fetch the venda with items to validate
    const venda = await prisma.venda.findUnique({
      where: { id: vendaId },
      include: {
        itens: {
          include: {
            produto: true,
            devolucoes: true  // To calculate already returned quantities
          }
        }
      }
    })

    if (!venda) {
      return NextResponse.json<DevolucaoResponse>(
        { success: false, error: "Venda não encontrada" },
        { status: 404 }
      )
    }

    // Validate each item
    let totalDevolvido = 0
    let totalSubstituido = 0
    const itensToCreate = []

    for (const item of itens) {
      const itemVenda = venda.itens.find(i => i.id === item.itemVendaId)

      if (!itemVenda) {
        return NextResponse.json<DevolucaoResponse>(
          { success: false, error: `Item ${item.itemVendaId} não encontrado na venda` },
          { status: 400 }
        )
      }

      // Calculate already returned quantity for this item
      const jaDevolvido = itemVenda.devolucoes.reduce(
        (sum, d) => sum + Number(d.quantidade),
        0
      )
      const disponivel = Number(itemVenda.quantidade) - jaDevolvido

      if (item.quantidade > disponivel) {
        return NextResponse.json<DevolucaoResponse>(
          { success: false, error: `Quantidade a devolver (${item.quantidade}) excede o disponível (${disponivel}) para ${itemVenda.produto.nome}` },
          { status: 400 }
        )
      }

      if (item.quantidade <= 0) {
        return NextResponse.json<DevolucaoResponse>(
          { success: false, error: "Quantidade deve ser maior que zero" },
          { status: 400 }
        )
      }

      const subtotal = item.quantidade * Number(itemVenda.precoUnit)
      totalDevolvido += subtotal

      // Calculate replacement subtotal if provided
      let subtotalSubstituicao = null
      if (item.substituicaoId && item.qtdSubstituicao && item.precoSubstituicao) {
        subtotalSubstituicao = item.qtdSubstituicao * item.precoSubstituicao
        totalSubstituido += subtotalSubstituicao
      }

      itensToCreate.push({
        itemVendaId: item.itemVendaId,
        quantidade: item.quantidade,
        valorUnitario: Number(itemVenda.precoUnit),
        subtotal,
        motivo: item.motivo,
        substituicaoId: item.substituicaoId || null,
        qtdSubstituicao: item.qtdSubstituicao || null,
        precoSubstituicao: item.precoSubstituicao || null,
        subtotalSubstituicao
      })
    }

    // Create the devolucao with items in a transaction
    const devolucao = await prisma.devolucao.create({
      data: {
        vendaId,
        motivo,
        totalDevolvido,
        totalSubstituido,
        estado: "PENDENTE",
        itens: {
          create: itensToCreate
        }
      },
      include: {
        venda: {
          include: {
            cliente: true
          }
        },
        itens: {
          include: {
            itemVenda: {
              include: {
                produto: true
              }
            },
            substituicao: true
          }
        },
        imagens: true
      }
    })

    return NextResponse.json<DevolucaoResponse>({
      success: true,
      devolucao
    })
  } catch (error) {
    console.error("Error creating devolucao:", error)
    return NextResponse.json<DevolucaoResponse>(
      { success: false, error: "Erro ao criar devolução" },
      { status: 500 }
    )
  }
}
