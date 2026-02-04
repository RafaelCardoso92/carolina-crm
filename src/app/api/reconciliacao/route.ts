import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { randomUUID } from "crypto"
import { exec } from "child_process"
import { promisify } from "util"
import type {
  ReconciliacaoResponse,
  ReconciliacaoListResponse,
  ParsedMapaPdf,
  PdfClienteLine
} from "@/types/reconciliacao"

const execAsync = promisify(exec)

const UPLOADS_DIR = process.env.UPLOADS_DIR || "/app/uploads"

// Parse MAPA 104 PDF text content
function parseMapaPdfText(text: string): ParsedMapaPdf {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean)

  let dataInicio: Date | null = null
  let dataFim: Date | null = null
  let vendedor = ""
  let totalBruto = 0
  let totalDescontos = 0
  let totalLiquido = 0
  const clientes: PdfClienteLine[] = []

  // Parse date range from header "VENDAS POR VENDEDOR / MARCAS DE 01/12/2025 A 23/12/2025"
  const dateRangeMatch = text.match(/DE\s+(\d{2}\/\d{2}\/\d{4})\s+A\s+(\d{2}\/\d{2}\/\d{4})/i)
  if (dateRangeMatch) {
    const [, startStr, endStr] = dateRangeMatch
    const [startDay, startMonth, startYear] = startStr.split("/").map(Number)
    const [endDay, endMonth, endYear] = endStr.split("/").map(Number)
    dataInicio = new Date(startYear, startMonth - 1, startDay)
    dataFim = new Date(endYear, endMonth - 1, endDay)
  }

  // Parse vendedor line "104 Carolina Cardoso"
  const vendedorMatch = text.match(/^104\s+(.+?)(?:\s+[\d\s,.]+){3}$/m)
  if (vendedorMatch) {
    vendedor = vendedorMatch[1].trim()
  }

  // Parse total line - look for TOTAL VENDEDORES followed by 3 numbers
  // Format: "TOTAL VENDEDORES:                                                  11 097,17    -1 629,21            9 467,96"
  const totalLineMatch = text.match(/TOTAL\s+VENDEDORES[:\s]+(.+)$/im)
  if (totalLineMatch) {
    const numbersStr = totalLineMatch[1]
    // Extract all numbers (including negative) from the line
    // Numbers are formatted like: 11 097,17 or -1 629,21 (space as thousands separator)
    const numberPattern = /-?[\d]+(?:\s[\d]{3})*,\d{2}/g
    const numbers = numbersStr.match(numberPattern)
    if (numbers && numbers.length >= 3) {
      totalBruto = parsePortugueseNumber(numbers[0])
      totalDescontos = Math.abs(parsePortugueseNumber(numbers[1]))
      totalLiquido = parsePortugueseNumber(numbers[2])
    }
  }

  // Parse client lines
  // Pattern: code (5 digits) followed by client name, then brand lines with values
  // Client codes: 00036, 00055, etc.
  const clientCodePattern = /^(\d{5})\s+(.+)$/
  let currentClient: { codigo: string; nome: string; bruto: number; desconto: number; liquido: number } | null = null

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Check for client code line
    const clientMatch = line.match(clientCodePattern)
    if (clientMatch) {
      // Save previous client if exists
      if (currentClient && currentClient.bruto > 0) {
        clientes.push({
          codigo: currentClient.codigo,
          nome: currentClient.nome,
          valorBruto: currentClient.bruto,
          desconto: currentClient.desconto,
          valorLiquido: currentClient.liquido
        })
      }

      // Start new client
      currentClient = {
        codigo: clientMatch[1],
        nome: clientMatch[2].trim(),
        bruto: 0,
        desconto: 0,
        liquido: 0
      }
      continue
    }

    // Check for value lines (BB Babor, AV Andrea Valomo, etc.)
    // Pattern: brand code (2 letters) + name + 3 numbers at end
    // Numbers format: 1 117,71 (space as thousands sep, comma as decimal)
    if (currentClient && /^[A-Z]{2}\s+\S+/.test(line)) {
      // Extract all numbers from the line
      const numberPattern = /-?[\d]+(?:\s[\d]{3})*,\d{2}/g
      const numbers = line.match(numberPattern)
      if (numbers && numbers.length >= 3) {
        currentClient.bruto += parsePortugueseNumber(numbers[0])
        currentClient.desconto += Math.abs(parsePortugueseNumber(numbers[1]))
        currentClient.liquido += parsePortugueseNumber(numbers[2])
      }
    }
  }

  // Don't forget the last client
  if (currentClient && currentClient.bruto > 0) {
    clientes.push({
      codigo: currentClient.codigo,
      nome: currentClient.nome,
      valorBruto: currentClient.bruto,
      desconto: currentClient.desconto,
      valorLiquido: currentClient.liquido
    })
  }

  return {
    dataInicio,
    dataFim,
    vendedor,
    totalBruto,
    totalDescontos,
    totalLiquido,
    clientes
  }
}

// Parse Portuguese number format (1 234,56 -> 1234.56)
function parsePortugueseNumber(str: string): number {
  if (!str) return 0
  // Remove spaces (thousands separator), replace comma with dot (decimal)
  const cleaned = str.replace(/\s/g, "").replace(",", ".")
  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : num
}

// GET - List reconciliations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ano = searchParams.get("ano") ? parseInt(searchParams.get("ano")!) : undefined

    const where = ano ? { ano } : {}

    const reconciliacoes = await prisma.reconciliacaoMensal.findMany({
      where,
      include: {
        itens: {
          include: {
            cliente: {
              select: { id: true, nome: true, codigo: true }
            },
            venda: {
              select: { id: true, total: true, mes: true, ano: true }
            }
          }
        }
      },
      orderBy: [{ ano: "desc" }, { mes: "desc" }]
    })

    // Cast to handle type compatibility with the response type
    return NextResponse.json({
      success: true,
      reconciliacoes
    })
  } catch (error) {
    console.error("Error fetching reconciliacoes:", error)
    return NextResponse.json<ReconciliacaoListResponse>(
      { success: false, error: "Erro ao carregar reconciliações" },
      { status: 500 }
    )
  }
}

// POST - Upload PDF and create reconciliation
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const mes = parseInt(formData.get("mes") as string)
    const ano = parseInt(formData.get("ano") as string)

    // Validate inputs
    if (!file) {
      return NextResponse.json<ReconciliacaoResponse>(
        { success: false, error: "Ficheiro PDF não fornecido" },
        { status: 400 }
      )
    }

    if (!mes || !ano || mes < 1 || mes > 12) {
      return NextResponse.json<ReconciliacaoResponse>(
        { success: false, error: "Mês e ano são obrigatórios" },
        { status: 400 }
      )
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json<ReconciliacaoResponse>(
        { success: false, error: "Apenas ficheiros PDF são permitidos" },
        { status: 400 }
      )
    }

    // Save PDF file
    const dirPath = join(UPLOADS_DIR, "reconciliacoes", `${ano}`)
    await mkdir(dirPath, { recursive: true })

    const filename = `mapa104_${mes}_${ano}_${randomUUID()}.pdf`
    const relativePath = join("reconciliacoes", `${ano}`, filename)
    const fullPath = join(UPLOADS_DIR, relativePath)

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(fullPath, buffer)

    // Extract text from PDF using pdftotext command
    const { stdout: text } = await execAsync(`pdftotext -layout "${fullPath}" -`)

    const parsed = parseMapaPdfText(text)

    // Get system sales for this month
    const vendasSistema = await prisma.venda.findMany({
      where: { mes, ano },
      include: {
        cliente: true,
        objetivoVario: true,
        devolucoes: {
          select: {
            totalDevolvido: true,
            totalSubstituido: true
          }
        }
      }
    })

    // Group sales by client code and sum totals
    // A client can have multiple sales in a month
    type ClientSalesData = {
      clienteId: string
      clienteNome: string
      vendas: typeof vendasSistema
      totalVendas: number          // Regular sales value (excluding objetivos varios)
      totalObjetivosVarios: number // Value from objetivos varios only
      totalLiquido: number         // Total (vendas + objetivos varios)
    }
    const vendasByClientCode: Map<string, ClientSalesData> = new Map()
    let totalSistema = 0

    for (const venda of vendasSistema) {
      const devolvido = venda.devolucoes.reduce((sum, d) => sum + Number(d.totalDevolvido), 0)
      const substituido = venda.devolucoes.reduce((sum, d) => sum + Number(d.totalSubstituido), 0)
      const vendaLiquido = Number(venda.total) - devolvido + substituido
      const objetivoVarioValor = Number(venda.objetivoVarioValor || 0)

      // The PDF includes objetivo vario values in the total
      const totalComObjetivo = vendaLiquido + objetivoVarioValor
      totalSistema += totalComObjetivo

      if (venda.cliente.codigo) {
        const existing = vendasByClientCode.get(venda.cliente.codigo)
        if (existing) {
          // Add to existing client totals
          existing.vendas.push(venda)
          existing.totalVendas += vendaLiquido
          existing.totalObjetivosVarios += objetivoVarioValor
          existing.totalLiquido += totalComObjetivo
        } else {
          // First sale for this client
          vendasByClientCode.set(venda.cliente.codigo, {
            clienteId: venda.cliente.id,
            clienteNome: venda.cliente.nome,
            vendas: [venda],
            totalVendas: vendaLiquido,
            totalObjetivosVarios: objetivoVarioValor,
            totalLiquido: totalComObjetivo
          })
        }
      }
    }

    // Create reconciliation items
    const itensToCreate = []
    let itensCorretos = 0
    let itensComProblema = 0

    for (const clientePdf of parsed.clientes) {
      const clienteSistema = vendasByClientCode.get(clientePdf.codigo)

      // Find client by code
      const cliente = await prisma.cliente.findUnique({
        where: { codigo: clientePdf.codigo }
      })

      let corresponde = false
      let tipoDiscrepancia: "VALOR_DIFERENTE" | "CLIENTE_NAO_EXISTE" | "VENDA_NAO_EXISTE" | "OBJETIVO_VARIO" | null = null
      let diferencaValor: number | null = null
      let valorSistema: number | null = null

      if (!cliente) {
        // Client doesn't exist in system
        tipoDiscrepancia = "CLIENTE_NAO_EXISTE"
        itensComProblema++
      } else if (!clienteSistema) {
        // Client exists but no sale recorded
        tipoDiscrepancia = "VENDA_NAO_EXISTE"
        itensComProblema++
      } else {
        // Compare values (system total already includes objetivo vario)
        valorSistema = clienteSistema.totalLiquido
        diferencaValor = clientePdf.valorLiquido - valorSistema

        // Allow 1 cent tolerance for rounding
        if (Math.abs(diferencaValor) <= 0.01) {
          corresponde = true
          diferencaValor = 0
          itensCorretos++
        } else {
          tipoDiscrepancia = "VALOR_DIFERENTE"
          itensComProblema++
        }
      }

      // Use first venda ID for reference (there may be multiple)
      const primeiraVendaId = clienteSistema?.vendas[0]?.id || null

      itensToCreate.push({
        codigoClientePdf: clientePdf.codigo,
        nomeClientePdf: clientePdf.nome,
        valorBrutoPdf: clientePdf.valorBruto,
        descontoPdf: clientePdf.desconto,
        valorLiquidoPdf: clientePdf.valorLiquido,
        clienteId: cliente?.id || null,
        vendaId: primeiraVendaId,
        valorSistema,
        valorVendas: clienteSistema?.totalVendas || null,
        valorObjetivosVarios: clienteSistema?.totalObjetivosVarios || null,
        corresponde,
        tipoDiscrepancia,
        diferencaValor
      })

      // Remove from map to track extras
      if (clienteSistema) {
        vendasByClientCode.delete(clientePdf.codigo)
      }
    }

    // Add sales in system but not in PDF (VENDA_EXTRA)
    for (const [codigo, clienteData] of vendasByClientCode) {
      itensToCreate.push({
        codigoClientePdf: codigo,
        nomeClientePdf: clienteData.clienteNome,
        valorBrutoPdf: 0,
        descontoPdf: 0,
        valorLiquidoPdf: 0,
        clienteId: clienteData.clienteId,
        vendaId: clienteData.vendas[0]?.id || null,
        valorSistema: clienteData.totalLiquido,
        valorVendas: clienteData.totalVendas,
        valorObjetivosVarios: clienteData.totalObjetivosVarios,
        corresponde: false,
        tipoDiscrepancia: "VENDA_EXTRA" as const,
        diferencaValor: -clienteData.totalLiquido
      })
      itensComProblema++
    }

    // Calculate overall difference
    const diferenca = parsed.totalLiquido - totalSistema

    // Determine initial state
    const estado = itensComProblema > 0 ? "COM_PROBLEMAS" : "APROVADA"

    // Create reconciliation with items
    const reconciliacao = await prisma.reconciliacaoMensal.create({
      data: {
        mes,
        ano,
        nomeArquivo: file.name,
        caminhoArquivo: relativePath,
        dataInicio: parsed.dataInicio,
        dataFim: parsed.dataFim,
        totalBrutoPdf: parsed.totalBruto,
        totalDescontosPdf: parsed.totalDescontos,
        totalLiquidoPdf: parsed.totalLiquido,
        totalSistema,
        diferenca,
        totalItens: parsed.clientes.length,
        itensCorretos,
        itensComProblema,
        estado,
        itens: {
          create: itensToCreate
        }
      },
      include: {
        itens: {
          include: {
            cliente: {
              select: { id: true, nome: true, codigo: true }
            },
            venda: {
              select: { id: true, total: true, mes: true, ano: true }
            }
          }
        }
      }
    })

    // Cast to handle type compatibility with the response type
    return NextResponse.json({
      success: true,
      reconciliacao
    })
  } catch (error) {
    console.error("Error creating reconciliacao:", error)
    return NextResponse.json<ReconciliacaoResponse>(
      { success: false, error: "Erro ao processar reconciliação" },
      { status: 500 }
    )
  }
}
