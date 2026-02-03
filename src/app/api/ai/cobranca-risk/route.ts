import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateAIResponse, getTokenBalance } from "@/lib/ai"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const existing = await prisma.aIInsight.findUnique({
      where: {
        userId_type: {
          userId: session.user.id,
          type: "COBRANCA_RISK"
        }
      }
    })

    if (existing) {
      return NextResponse.json({
        insight: existing,
        cached: true
      })
    }

    return NextResponse.json({ insight: null, cached: false })
  } catch (error) {
    console.error("Error fetching cobranca risk:", error)
    return NextResponse.json(
      { error: "Erro ao carregar analise de risco" },
      { status: 500 }
    )
  }
}

export async function POST() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id

    const balance = await getTokenBalance(userId)
    if (balance.remaining < 2000) {
      return NextResponse.json(
        { error: "INSUFFICIENT_TOKENS", tokensNeeded: 2000, tokensAvailable: balance.remaining },
        { status: 402 }
      )
    }

    const now = new Date()

    const pendingCollections = await prisma.cobranca.findMany({
      where: { pago: false },
      include: {
        cliente: {
          select: {
            id: true,
            nome: true,
            ultimoContacto: true,
            cobrancas: {
              select: {
                id: true,
                pago: true,
                dataPago: true,
                dataEmissao: true,
                valor: true
              },
              orderBy: { createdAt: "desc" },
              take: 10
            }
          }
        },
        parcelas: true
      },
      orderBy: { createdAt: "desc" }
    })

    if (pendingCollections.length === 0) {
      return NextResponse.json({
        insight: {
          data: {
            resumo: "Nao existem cobrancas pendentes para analisar.",
            cobrancasRisco: [],
            estatisticas: { alto: 0, medio: 0, baixo: 0 }
          }
        },
        cached: false
      })
    }

    const collectionData = pendingCollections.map(c => {
      const paidHistory = c.cliente.cobrancas.filter(h => h.pago)
      const totalHistory = c.cliente.cobrancas.length
      const paymentRate = totalHistory > 0 ? (paidHistory.length / totalHistory * 100).toFixed(0) : "N/A"
      
      const overdueParcelas = c.parcelas.filter(p => !p.pago && new Date(p.dataVencimento) < now)
      const daysOverdue = overdueParcelas.length > 0 
        ? Math.floor((now.getTime() - new Date(overdueParcelas[0].dataVencimento).getTime()) / (1000 * 60 * 60 * 24))
        : 0

      const daysSinceContact = c.cliente.ultimoContacto
        ? Math.floor((now.getTime() - new Date(c.cliente.ultimoContacto).getTime()) / (1000 * 60 * 60 * 24))
        : 999

      return {
        id: c.id,
        cliente: c.cliente.nome,
        clienteId: c.cliente.id,
        valor: Number(c.valor),
        fatura: c.fatura,
        parcelasPendentes: c.parcelas.filter(p => !p.pago).length,
        parcelasAtrasadas: overdueParcelas.length,
        diasAtraso: daysOverdue,
        taxaPagamento: paymentRate,
        diasSemContacto: daysSinceContact
      }
    })

    const collectionLines = collectionData.map((c, i) => 
      `${i + 1}. Cliente: ${c.cliente}
   - Valor: ${c.valor.toFixed(2)} euros
   - Fatura: ${c.fatura || "N/A"}
   - Parcelas pendentes: ${c.parcelasPendentes}
   - Parcelas em atraso: ${c.parcelasAtrasadas}
   - Dias de atraso: ${c.diasAtraso}
   - Taxa de pagamento historica: ${c.taxaPagamento}%
   - Dias sem contacto: ${c.diasSemContacto}`
    ).join("\n\n")

    const prompt = `Analisa o risco de cobranca das seguintes faturas pendentes e classifica cada uma:

COBRANCAS PENDENTES:
${collectionLines}

Para cada cobranca, classifica o risco (ALTO, MEDIO, BAIXO) e sugere uma acao.

Responde APENAS em JSON valido:
{
  "resumo": "Resumo geral da situacao de cobrancas em 1-2 frases",
  "cobrancasRisco": [
    {
      "cobrancaId": "id da cobranca",
      "cliente": "nome",
      "valor": 123.45,
      "risco": "ALTO",
      "score": 85,
      "fatores": ["fator 1", "fator 2"],
      "acao": "acao sugerida"
    }
  ],
  "estatisticas": {
    "alto": 0,
    "medio": 0,
    "baixo": 0
  },
  "acaoPrioritaria": "qual cobranca deve ser tratada primeiro e porque"
}`

    const response = await generateAIResponse(prompt, userId, "cobranca_risk")

    let parsedData
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0])
        parsedData.cobrancasRisco = parsedData.cobrancasRisco.map((cr: { cliente: string; cobrancaId?: string }, index: number) => ({
          ...cr,
          cobrancaId: collectionData[index]?.id || cr.cobrancaId
        }))
      } else {
        throw new Error("No JSON found")
      }
    } catch {
      parsedData = {
        resumo: "Analise de risco gerada",
        cobrancasRisco: collectionData.map(c => ({
          cobrancaId: c.id,
          cliente: c.cliente,
          valor: c.valor,
          risco: c.diasAtraso > 30 ? "ALTO" : c.diasAtraso > 7 ? "MEDIO" : "BAIXO",
          score: Math.min(100, c.diasAtraso * 2 + (100 - parseInt(c.taxaPagamento) || 50)),
          fatores: [],
          acao: "Contactar cliente"
        })),
        estatisticas: { alto: 0, medio: 0, baixo: 0 }
      }
    }

    const insight = await prisma.aIInsight.upsert({
      where: {
        userId_type: {
          userId,
          type: "COBRANCA_RISK"
        }
      },
      create: {
        userId,
        type: "COBRANCA_RISK",
        data: parsedData,
        summary: parsedData.resumo
      },
      update: {
        data: parsedData,
        summary: parsedData.resumo,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ insight, cached: false })
  } catch (error) {
    console.error("Error generating cobranca risk:", error)
    if (error instanceof Error && error.message === "INSUFFICIENT_TOKENS") {
      return NextResponse.json(
        { error: "INSUFFICIENT_TOKENS" },
        { status: 402 }
      )
    }
    return NextResponse.json(
      { error: "Erro ao gerar analise de risco" },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await prisma.aIInsight.delete({
      where: {
        userId_type: {
          userId: session.user.id,
          type: "COBRANCA_RISK"
        }
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting insight:", error)
    return NextResponse.json(
      { error: "Erro ao eliminar insight" },
      { status: 500 }
    )
  }
}
