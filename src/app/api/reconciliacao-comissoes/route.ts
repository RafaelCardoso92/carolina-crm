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
    
    for (const linhaPdf of parsed.linhas) {
      const cliente = await prisma.cliente.findUnique({
        where: { codigo: linhaPdf.entidade }
      })
      
      let corresponde = false
      let tipoDiscrepancia: string | null = null
      let diferencaValor: number | null = null
      let diferencaComissao: number | null = null
      let valorSistema: number | null = null
      let comissaoSistema: number | null = null
      let cobrancaId: string | null = null
      let parcelaId: string | null = null
      
      if (!cliente) {
        tipoDiscrepancia = "CLIENTE_NAO_EXISTE"
        itensComProblema++
      } else {
        const cobranca = await prisma.cobranca.findFirst({
          where: { clienteId: cliente.id, fatura: linhaPdf.numero },
          include: { parcelas: true }
        })
        
        if (!cobranca) {
          tipoDiscrepancia = "COBRANCA_NAO_EXISTE"
          itensComProblema++
        } else {
          cobrancaId = cobranca.id
          
          // Use valorSemIva for comparison (PDF shows values without IVA)
          const cobrancaValorTotal = Number(cobranca.valor)
          const cobrancaValorSemIva = Number(cobranca.valorSemIva || cobranca.valor)
          const cobrancaComissao = Number(cobranca.comissao || 0)
          
          // Calculate IVA ratio for parcela calculations
          const ivaRatio = cobrancaValorTotal > 0 ? cobrancaValorSemIva / cobrancaValorTotal : 1
          
          if (cobranca.parcelas.length > 0) {
            const parcela = cobranca.parcelas.find(p => p.numero === linhaPdf.prestacao)
            
            if (!parcela) {
              tipoDiscrepancia = "PARCELA_NAO_EXISTE"
              itensComProblema++
            } else {
              parcelaId = parcela.id
              const parcelaValorTotal = Number(parcela.valor)
              
              // Calculate parcela value without IVA
              const parcelaValorSemIva = Math.round(parcelaValorTotal * ivaRatio * 100) / 100
              
              // Calculate proportional commission
              comissaoSistema = cobrancaValorTotal > 0 
                ? Math.round((parcelaValorTotal / cobrancaValorTotal) * cobrancaComissao * 100) / 100
                : 0
              valorSistema = parcelaValorSemIva
              
              totalSistema += parcelaValorSemIva
              totalComissaoSistema += comissaoSistema
              
              diferencaValor = linhaPdf.valorLiquido - valorSistema
              diferencaComissao = linhaPdf.valorComissao - comissaoSistema
              
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
          } else {
            // Single-payment cobranca (no parcelas)
            if (linhaPdf.prestacao !== 1) {
              tipoDiscrepancia = "PARCELA_NAO_EXISTE"
              itensComProblema++
            } else {
              valorSistema = cobrancaValorSemIva
              comissaoSistema = cobrancaComissao
              
              totalSistema += cobrancaValorSemIva
              totalComissaoSistema += cobrancaComissao
              
              diferencaValor = linhaPdf.valorLiquido - valorSistema
              diferencaComissao = linhaPdf.valorComissao - comissaoSistema
              
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
        }
      }
      
      itensToCreate.push({
        dataPagamentoPdf: linhaPdf.data,
        codigoClientePdf: linhaPdf.entidade,
        nomeClientePdf: cliente?.nome || null,
        tipoDocPdf: linhaPdf.tipoDoc,
        seriePdf: linhaPdf.serie,
        numeroPdf: linhaPdf.numero,
        parcelaPdf: linhaPdf.prestacao,
        valorLiquidoPdf: linhaPdf.valorLiquido,
        valorComissaoPdf: linhaPdf.valorComissao,
        clienteId: cliente?.id || null,
        cobrancaId,
        parcelaId,
        valorSistema,
        comissaoSistema,
        corresponde,
        tipoDiscrepancia,
        diferencaValor,
        diferencaComissao
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
