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
  
  const dateRangeMatch = text.match(/de\s+(\d{2}\/\d{2}\/\d{4})\s+a\s+(\d{2}\/\d{2}\/\d{4})/i)
  if (dateRangeMatch) {
    dataInicio = parsePortugueseDate(dateRangeMatch[1])
    dataFim = parsePortugueseDate(dateRangeMatch[2])
  }
  
  const vendedorMatch = text.match(/104\s*-\s*([^\n]+)/i)
  if (vendedorMatch) {
    vendedor = vendedorMatch[1].trim()
  }
  
  const totalMatch = text.match(/Total\s+(?:do\s+Vendedor|geral\s+de\s+comiss[oõ]es)\s+([\d\s]+[,\.]+\d{2})\s+([\d\s]+[,\.]+\d{2})/i)
  if (totalMatch) {
    totalLiquido = parsePortugueseNumber(totalMatch[1])
    totalComissao = parsePortugueseNumber(totalMatch[2])
  }
  
  const linePattern = /^(\d{2}\/\d{2}\/\d{4})\s+(\d{5})\s+Liquidação\s+de\s+(\w+)\s+(\w+)\s+(\d+)\s+(\d+)\s+([\d\s]+,\d{2})\s+([\d\s]+,\d{2})$/

  for (const line of lines) {
    const match = line.match(linePattern)
    if (match) {
      const [, dataStr, entidade, tipoDoc, serie, numero, prestacao, valorLiq, valorComissao] = match
      linhas.push({
        data: parsePortugueseDate(dataStr),
        entidade,
        tipoDoc,
        serie,
        numero,
        prestacao: parseInt(prestacao),
        valorLiquido: parsePortugueseNumber(valorLiq),
        valorComissao: parsePortugueseNumber(valorComissao)
      })
    }
  }
  
  if (totalLiquido === 0 && linhas.length > 0) {
    totalLiquido = linhas.reduce((sum, l) => sum + l.valorLiquido, 0)
    totalComissao = linhas.reduce((sum, l) => sum + l.valorComissao, 0)
  }
  
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
      where: ano ? { ano } : {},
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
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const mes = parseInt(formData.get("mes") as string)
    const ano = parseInt(formData.get("ano") as string)
    
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
      where: { mes_ano: { mes, ano } }
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
    
    const { stdout: text } = await execAsync(`pdftotext -layout "${fullPath}" -`)
    const parsed = parseComissoesPdfText(text)
    
    const itensToCreate: any[] = []
    let itensCorretos = 0
    let itensComProblema = 0
    let totalSistema = 0
    let totalComissaoSistema = 0

    // Aggregate ALL payments for the same invoice number (regardless of parcela)
    // This handles cases where multiple partial payments are made for the same invoice
    const invoiceAggregates = new Map<string, {
      entidade: string
      tipoDoc: string
      serie: string
      numero: string
      totalValorLiquido: number
      totalComissao: number
      parcelas: number[]
      ultimaData: Date | null
    }>()

    for (const linha of parsed.linhas) {
      // Key by client + doc type + series + invoice number (NOT parcela)
      const key = `${linha.entidade}-${linha.tipoDoc}-${linha.serie}-${linha.numero}`

      if (invoiceAggregates.has(key)) {
        const existing = invoiceAggregates.get(key)!
        existing.totalValorLiquido += linha.valorLiquido
        existing.totalComissao += linha.valorComissao
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
          totalValorLiquido: linha.valorLiquido,
          totalComissao: linha.valorComissao,
          parcelas: [linha.prestacao],
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

      // Round PDF values
      const valorLiquidoPdf = Math.round(invoiceData.totalValorLiquido * 100) / 100
      const valorComissaoPdf = Math.round(invoiceData.totalComissao * 100) / 100
      const parcelaLabel = invoiceData.parcelas.length > 1
        ? invoiceData.parcelas.sort((a, b) => a - b).join('+')
        : String(invoiceData.parcelas[0])

      if (!cliente) {
        tipoDiscrepancia = "CLIENTE_NAO_EXISTE"
        itensComProblema++
      } else {
        const cobranca = await prisma.cobranca.findFirst({
          where: { clienteId: cliente.id, fatura: invoiceData.numero },
          include: { parcelas: true }
        })

        if (!cobranca) {
          tipoDiscrepancia = "COBRANCA_NAO_EXISTE"
          itensComProblema++
        } else {
          cobrancaId = cobranca.id

          // Use valorSemIva for comparison (PDF shows values without IVA)
          const cobrancaValorSemIva = Number(cobranca.valorSemIva || cobranca.valor)
          const cobrancaComissao = Number(cobranca.comissao || 0)

          valorSistema = cobrancaValorSemIva
          comissaoSistema = cobrancaComissao

          totalSistema += cobrancaValorSemIva
          totalComissaoSistema += cobrancaComissao

          diferencaValor = valorLiquidoPdf - valorSistema
          diferencaComissao = valorComissaoPdf - comissaoSistema

          // Allow small tolerance for rounding differences
          if (Math.abs(diferencaValor) <= 0.10 && Math.abs(diferencaComissao) <= 0.15) {
            corresponde = true
            diferencaValor = 0
            diferencaComissao = 0
            itensCorretos++
          } else if (Math.abs(diferencaValor) > 0.10) {
            tipoDiscrepancia = "VALOR_DIFERENTE"
            itensComProblema++
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
        parcelaPdf: invoiceData.parcelas[0], // Store first parcela number
        valorLiquidoPdf: valorLiquidoPdf,
        valorComissaoPdf: valorComissaoPdf,
        clienteId: cliente?.id || null,
        cobrancaId,
        parcelaId: null, // No single parcela when aggregated
        valorSistema,
        comissaoSistema,
        corresponde,
        tipoDiscrepancia,
        diferencaValor,
        diferencaComissao,
        notas: invoiceData.parcelas.length > 1
          ? `Agregado de ${invoiceData.parcelas.length} pagamentos (parcelas: ${parcelaLabel})`
          : null
      })
    }
    
    const diferenca = parsed.totalLiquido - totalSistema
    const diferencaComissao = parsed.totalComissao - totalComissaoSistema
    const estado = itensComProblema > 0 ? "COM_PROBLEMAS" : "APROVADA"
    
    const reconciliacao = await prisma.reconciliacaoComissoes.create({
      data: {
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
