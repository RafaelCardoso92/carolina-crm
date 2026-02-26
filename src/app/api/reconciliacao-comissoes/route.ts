import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { randomUUID } from "crypto"
import { exec } from "child_process"
import { promisify } from "util"
import type {
  ComissoesReconciliacaoResponse,
  ComissoesReconciliacaoListResponse,
  ParsedComissoesPdf,
  PdfComissaoLine
} from "@/types/reconciliacao-comissoes"

const execAsync = promisify(exec)
const UPLOADS_DIR = process.env.UPLOADS_DIR || "/app/uploads"

function parsePortugueseDate(str: string): Date | null {
  if (!str) return null
  const match = str.match(/(\d{2})\/(\d{2})\/(\d{4})/)
  if (!match) return null
  const [, day, month, year] = match
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
}

function parsePortugueseNumber(str: string): number {
  if (!str) return 0
  const cleaned = str.replace(/\s/g, "").replace(",", ".")
  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : num
}

function parseComissoesPdfText(text: string): ParsedComissoesPdf {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean)

  let dataInicio: Date | null = null
  let dataFim: Date | null = null
  let vendedor = ""
  let totalLiquido = 0
  let totalComissao = 0
  const linhas: PdfComissaoLine[] = []

  // Try multiple date range patterns
  const dateRangeMatch = text.match(/de\s+(\d{2}\/\d{2}\/\d{4})\s+a\s+(\d{2}\/\d{2}\/\d{4})/i) ||
                         text.match(/DE\s+(\d{2}\/\d{2}\/\d{4})\s+A\s+(\d{2}\/\d{2}\/\d{4})/i)
  if (dateRangeMatch) {
    dataInicio = parsePortugueseDate(dateRangeMatch[1])
    dataFim = parsePortugueseDate(dateRangeMatch[2])
  }

  // Try multiple vendedor patterns
  const vendedorMatch = text.match(/104\s+([A-Za-záéíóúàèìòùâêîôûãõç\s]+)/i) ||
                        text.match(/104\s*-\s*([^\n]+)/i)
  if (vendedorMatch) {
    vendedor = vendedorMatch[1].trim()
  }

  // Try multiple total patterns
  const totalMatch = text.match(/Total\s+(?:do\s+Vendedor|geral\s+de\s+comiss[oõ]es)\s+([\d\s]+[,\.]+\d{2})\s+([\d\s]+[,\.]+\d{2})/i) ||
                     text.match(/TOTAL\s+VENDEDORES[:\s]+([\d\s]+[,\.]+\d{2})/i)
  if (totalMatch) {
    totalLiquido = parsePortugueseNumber(totalMatch[1])
    if (totalMatch[2]) {
      totalComissao = parsePortugueseNumber(totalMatch[2])
    }
  }

  // Multiple line patterns to match different PDF formats
  const linePatterns = [
    // Format: Date ClientCode "Liquidação de" DocType Series InvoiceNum ParcelaNum Value Commission
    /^(\d{2}\/\d{2}\/\d{4})\s+(\d{5})\s+Liquidação\s+de\s+(\w+)\s+(\w+)\s+(\d+)\s+(\d+)\s+([\d\s]+,\d{2})\s+([\d\s]+,\d{2})$/,
    // Format: Date ClientCode DocType Series InvoiceNum Parcela Value Commission (without "Liquidação de")
    /^(\d{2}\/\d{2}\/\d{4})\s+(\d{5})\s+(FA|ND|NC|VEC|CI)\s+(\w+)\s+(\d+)\s+(\d+)\s+([\d\s]+,\d{2})\s+([\d\s]+,\d{2})$/i,
    // Format: Date ClientCode Liq. DocType Series InvoiceNum Parcela Value Commission
    /^(\d{2}\/\d{2}\/\d{4})\s+(\d{5})\s+Liq\.\s*(FA|ND|NC|VEC|CI)\s+(\w+)\s+(\d+)\s+(\d+)\s+([\d\s]+,\d{2})\s+([\d\s]+,\d{2})$/i,
    // More flexible: Date ClientCode anything DocType Series Number Value(s)
    /^(\d{2}\/\d{2}\/\d{4})\s+(\d{5})\s+.*?(FA|ND|NC|VEC|CI)\s+(\d{2,4}\w+)\s+(\d+)\s+(\d+)?\s*([\d\s]+,\d{2})\s+([\d\s]+,\d{2})$/i
  ]

  for (const line of lines) {
    let matched = false
    for (const pattern of linePatterns) {
      const match = line.match(pattern)
      if (match) {
        const [, dataStr, entidade, tipoDoc, serie, numero, prestacao, valorLiq, valorComissao] = match
        linhas.push({
          data: parsePortugueseDate(dataStr),
          entidade,
          tipoDoc: tipoDoc.toUpperCase(),
          serie,
          numero,
          prestacao: prestacao ? parseInt(prestacao) : 1,
          valorLiquido: parsePortugueseNumber(valorLiq),
          valorComissao: parsePortugueseNumber(valorComissao)
        })
        matched = true
        break
      }
    }
    // Log unmatched lines that look like data (start with date and have client code)
    if (!matched && /^\d{2}\/\d{2}\/\d{4}\s+\d{5}/.test(line)) {
      console.log("[ComissoesPDF] Unmatched line:", line)
    }
  }

  if (totalLiquido === 0 && linhas.length > 0) {
    totalLiquido = linhas.reduce((sum, l) => sum + l.valorLiquido, 0)
    totalComissao = linhas.reduce((sum, l) => sum + l.valorComissao, 0)
  }

  console.log(`[ComissoesPDF] Parsed ${linhas.length} lines, totalLiquido=${totalLiquido}, totalComissao=${totalComissao}`)

  return { dataInicio, dataFim, vendedor, totalLiquido, totalComissao, linhas }
}

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json<ComissoesReconciliacaoListResponse>({ success: false, error: "Não autorizado" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const ano = searchParams.get("ano") ? parseInt(searchParams.get("ano")!) : undefined
    
    const reconciliacoes = await prisma.reconciliacaoComissoes.findMany({
      where: {
        userId: session.user.id,
        ...(ano ? { ano } : {})
      },
      include: {
        itens: {
          include: {
            cliente: { select: { id: true, nome: true, codigo: true } },
            cobranca: { select: { id: true, fatura: true, valor: true, valorSemIva: true, comissao: true, pago: true, dataPago: true } },
            parcela: { select: { id: true, numero: true, valor: true, dataPago: true, pago: true } }
          }
        }
      },
      orderBy: [{ ano: "desc" }, { mes: "desc" }]
    })
    
    return NextResponse.json({ success: true, reconciliacoes })
  } catch (error) {
    console.error("Error fetching reconciliacoes comissoes:", error)
    return NextResponse.json<ComissoesReconciliacaoListResponse>(
      { success: false, error: "Erro ao carregar reconciliações de comissões" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  console.log("[ComissoesPDF] POST request received")

  const session = await auth()
  if (!session?.user) {
    console.log("[ComissoesPDF] Unauthorized - no session")
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }
  console.log("[ComissoesPDF] User authenticated:", session.user.email)

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const mes = parseInt(formData.get("mes") as string)
    const ano = parseInt(formData.get("ano") as string)
    console.log("[ComissoesPDF] Form data - file:", file?.name, "size:", file?.size, "mes:", mes, "ano:", ano)
    
    if (!file) {
      return NextResponse.json<ComissoesReconciliacaoResponse>(
        { success: false, error: "Ficheiro PDF não fornecido" }, { status: 400 }
      )
    }
    
    if (!mes || !ano || mes < 1 || mes > 12) {
      return NextResponse.json<ComissoesReconciliacaoResponse>(
        { success: false, error: "Mês e ano são obrigatórios" }, { status: 400 }
      )
    }
    
    if (file.type !== "application/pdf") {
      return NextResponse.json<ComissoesReconciliacaoResponse>(
        { success: false, error: "Apenas ficheiros PDF são permitidos" }, { status: 400 }
      )
    }
    
    const existing = await prisma.reconciliacaoComissoes.findUnique({
      where: { userId_mes_ano: { userId: session.user.id, mes, ano } }
    })
    if (existing) {
      await prisma.reconciliacaoComissoes.delete({ where: { id: existing.id } })
    }
    
    const dirPath = join(UPLOADS_DIR, "reconciliacoes-comissoes", `${ano}`)
    await mkdir(dirPath, { recursive: true })
    
    const filename = `comissoes_${mes}_${ano}_${randomUUID()}.pdf`
    const relativePath = join("reconciliacoes-comissoes", `${ano}`, filename)
    const fullPath = join(UPLOADS_DIR, relativePath)
    
    const bytes = await file.arrayBuffer()
    await writeFile(fullPath, Buffer.from(bytes))
    
    console.log(`[ComissoesPDF] Processing file: ${file.name}, path: ${fullPath}`)
    const { stdout: text } = await execAsync(`pdftotext -layout "${fullPath}" -`)
    console.log(`[ComissoesPDF] Extracted text length: ${text.length} chars`)
    console.log(`[ComissoesPDF] First 500 chars:`, text.substring(0, 500))

    const parsed = parseComissoesPdfText(text)
    console.log(`[ComissoesPDF] Parsed result:`, {
      dataInicio: parsed.dataInicio,
      dataFim: parsed.dataFim,
      vendedor: parsed.vendedor,
      totalLiquido: parsed.totalLiquido,
      totalComissao: parsed.totalComissao,
      linhasCount: parsed.linhas.length
    })

    if (parsed.linhas.length === 0) {
      console.log(`[ComissoesPDF] WARNING: No lines parsed! PDF may have unexpected format.`)
      console.log(`[ComissoesPDF] Full text:`, text)

      // Check if this looks like a sales report instead of a commissions report
      if (text.includes("VENDAS POR VENDEDOR") || text.includes("V. Bruto") || text.includes("Descontos")) {
        return NextResponse.json<ComissoesReconciliacaoResponse>(
          {
            success: false,
            error: "Este PDF parece ser um relatório de vendas (MAPA 104), não um mapa de comissões. O mapa de comissões deve conter linhas com 'Liquidação de' ou detalhes de pagamentos com faturas e parcelas."
          },
          { status: 400 }
        )
      }

      return NextResponse.json<ComissoesReconciliacaoResponse>(
        {
          success: false,
          error: "Não foram encontradas linhas de pagamento no PDF. Verifique se o ficheiro é um mapa de comissões válido com linhas no formato: Data, Código Cliente, Tipo Doc, Série, Número, Parcela, Valor, Comissão."
        },
        { status: 400 }
      )
    }

    const itensToCreate: any[] = []
    let itensCorretos = 0
    let itensComProblema = 0
    let totalSistema = 0
    let totalComissaoSistema = 0

    // Aggregate payments by invoice number (numero) - sum all entries with the same invoice
    // This handles cases where the same invoice appears multiple times (different parcelas/dates)
    const invoiceAggregates = new Map<string, {
      entidade: string
      tipoDoc: string
      serie: string
      numero: string
      parcelas: number[]
      totalValorLiquido: number
      totalComissao: number
      count: number
      ultimaData: Date | null
    }>()

    for (const linha of parsed.linhas) {
      // Key by client + invoice number only (aggregate all parcelas of same invoice)
      const key = `${linha.entidade}-${linha.numero}`

      if (invoiceAggregates.has(key)) {
        const existing = invoiceAggregates.get(key)!
        existing.totalValorLiquido += linha.valorLiquido
        existing.totalComissao += linha.valorComissao
        existing.count++
        if (!existing.parcelas.includes(linha.prestacao)) {
          existing.parcelas.push(linha.prestacao)
        }
        if (linha.data && (!existing.ultimaData || linha.data > existing.ultimaData)) {
          existing.ultimaData = linha.data
        }
      } else {
        invoiceAggregates.set(key, {
          entidade: linha.entidade,
          tipoDoc: linha.tipoDoc,
          serie: linha.serie,
          numero: linha.numero,
          parcelas: [linha.prestacao],
          totalValorLiquido: linha.valorLiquido,
          totalComissao: linha.valorComissao,
          count: 1,
          ultimaData: linha.data
        })
      }
    }

    // Process each aggregated invoice
    for (const [, invoiceData] of invoiceAggregates) {
      const cliente = await prisma.cliente.findUnique({
        where: { codigo: invoiceData.entidade }
      })

      let corresponde = false
      let tipoDiscrepancia: string | null = null
      let diferencaValor: number | null = null
      let diferencaComissao: number | null = null
      let valorSistema: number | null = null
      let comissaoSistema: number | null = null
      let cobrancaId: string | null = null

      // Round PDF values (summed from all entries with same invoice number)
      const valorLiquidoPdf = Math.round(invoiceData.totalValorLiquido * 100) / 100
      const valorComissaoPdf = Math.round(invoiceData.totalComissao * 100) / 100

      // Calculate date range for the selected month
      const startOfMonth = new Date(ano, mes - 1, 1)
      const endOfMonth = new Date(ano, mes, 0, 23, 59, 59, 999)

      if (!cliente) {
        tipoDiscrepancia = "CLIENTE_NAO_EXISTE"
        itensComProblema++
      } else {
        // Find cobranca that was PAID in the selected month
        const cobranca = await prisma.cobranca.findFirst({
          where: {
            clienteId: cliente.id,
            fatura: invoiceData.numero,
            pago: true,
            dataPago: {
              gte: startOfMonth,
              lte: endOfMonth
            }
          },
          include: { parcelas: true }
        })

        if (!cobranca) {
          // Check if cobranca exists but wasn't paid in this month
          const cobrancaExists = await prisma.cobranca.findFirst({
            where: { clienteId: cliente.id, fatura: invoiceData.numero }
          })

          if (cobrancaExists) {
            tipoDiscrepancia = "PAGAMENTO_EXTRA_PDF" // Exists but not paid this month
          } else {
            tipoDiscrepancia = "COBRANCA_NAO_EXISTE"
          }
          itensComProblema++
        } else {
          cobrancaId = cobranca.id

          // Use valorSemIva for comparison (PDF shows values without IVA)
          const cobrancaValorSemIva = Number(cobranca.valorSemIva || cobranca.valor)
          const cobrancaComissao = Number(cobranca.comissao || 0)

          // Compare aggregated PDF total against full cobranca value
          valorSistema = Math.round(cobrancaValorSemIva * 100) / 100
          comissaoSistema = Math.round(cobrancaComissao * 100) / 100

          totalSistema += valorSistema
          totalComissaoSistema += comissaoSistema

          diferencaValor = Math.round((valorLiquidoPdf - valorSistema) * 100) / 100
          diferencaComissao = Math.round((valorComissaoPdf - comissaoSistema) * 100) / 100

          // Focus on COMMISSION comparison - this is what matters for reconciliation
          // Allow small tolerance for rounding differences
          if (Math.abs(diferencaComissao) <= 0.15) {
            corresponde = true
            diferencaComissao = 0
            // Keep diferencaValor for informational purposes but don't flag as problem
            itensCorretos++
          } else {
            tipoDiscrepancia = "COMISSAO_DIFERENTE"
            itensComProblema++
          }
        }
      }

      itensToCreate.push({
        dataPagamentoPdf: invoiceData.ultimaData,
        codigoClientePdf: invoiceData.entidade,
        nomeClientePdf: cliente?.nome || null,
        tipoDocPdf: invoiceData.tipoDoc,
        seriePdf: invoiceData.serie,
        numeroPdf: invoiceData.numero,
        parcelaPdf: invoiceData.parcelas.length > 0 ? invoiceData.parcelas[0] : 1,
        valorLiquidoPdf: valorLiquidoPdf,
        valorComissaoPdf: valorComissaoPdf,
        clienteId: cliente?.id || null,
        cobrancaId,
        parcelaId: null,
        valorSistema,
        comissaoSistema,
        corresponde,
        tipoDiscrepancia,
        diferencaValor,
        diferencaComissao,
        notas: invoiceData.count > 1
          ? `Agregado de ${invoiceData.count} pagamentos (parcelas: ${invoiceData.parcelas.sort((a, b) => a - b).join(", ")})`
          : null
      })
    }
    
    const diferenca = parsed.totalLiquido - totalSistema
    const diferencaComissao = parsed.totalComissao - totalComissaoSistema
    const estado = itensComProblema > 0 ? "COM_PROBLEMAS" : "APROVADA"
    
    const reconciliacao = await prisma.reconciliacaoComissoes.create({
      data: {
        userId: session.user.id,
        mes, ano,
        nomeArquivo: file.name,
        caminhoArquivo: relativePath,
        dataInicio: parsed.dataInicio,
        dataFim: parsed.dataFim,
        totalLiquidoPdf: parsed.totalLiquido,
        totalComissaoPdf: parsed.totalComissao,
        totalSistema: Math.round(totalSistema * 100) / 100,
        totalComissaoSistema: Math.round(totalComissaoSistema * 100) / 100,
        diferenca: Math.round(diferenca * 100) / 100,
        diferencaComissao: Math.round(diferencaComissao * 100) / 100,
        totalItens: itensToCreate.length,
        itensCorretos,
        itensComProblema,
        estado,
        itens: { create: itensToCreate }
      },
      include: {
        itens: {
          include: {
            cliente: { select: { id: true, nome: true, codigo: true } },
            cobranca: { select: { id: true, fatura: true, valor: true, valorSemIva: true, comissao: true, pago: true, dataPago: true } },
            parcela: { select: { id: true, numero: true, valor: true, dataPago: true, pago: true } }
          }
        }
      }
    })
    
    return NextResponse.json({ success: true, reconciliacao })
  } catch (error) {
    console.error("Error creating reconciliacao comissoes:", error)
    return NextResponse.json<ComissoesReconciliacaoResponse>(
      { success: false, error: "Erro ao processar reconciliação de comissões" },
      { status: 500 }
    )
  }
}
