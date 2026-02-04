import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { userScopedWhere, isAdminOrHigher } from "@/lib/permissions"
import PDFDocument from "pdfkit"
import { readFile } from "fs/promises"
import path from "path"

const UPLOAD_DIR = process.env.UPLOAD_DIR || "/app/uploads/despesas"

const MESES = [
  "", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
]

const TIPO_LABELS: Record<string, string> = {
  HOTEL: "Hotel",
  COMBUSTIVEL: "Combustível",
  GLP: "GLP",
  ESTACIONAMENTO: "Estacionamento",
  PORTAGENS: "Portagens",
  RESTAURANTE: "Restaurante",
  OUTRO: "Outro"
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const mes = parseInt(searchParams.get("mes") || (new Date().getMonth() + 1).toString())
    const ano = parseInt(searchParams.get("ano") || new Date().getFullYear().toString())
    const seller = searchParams.get("seller")

    const userFilter = userScopedWhere(session, seller)

    const despesas = await prisma.despesa.findMany({
      where: {
        ...userFilter,
        mes,
        ano
      },
      include: {
        imagens: true,
        user: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: [{ data: "asc" }, { tipo: "asc" }]
    })

    if (despesas.length === 0) {
      return NextResponse.json({ error: "Sem despesas para este período" }, { status: 404 })
    }

    // Get user name for the report
    const userName = despesas[0].user?.name || despesas[0].user?.email || "Utilizador"

    // Create PDF
    const doc = new PDFDocument({ margin: 50, size: "A4" })
    const chunks: Buffer[] = []

    doc.on("data", (chunk: Buffer) => chunks.push(chunk))

    // Header
    doc.fontSize(20).font("Helvetica-Bold").text("Relatório de Despesas", { align: "center" })
    doc.moveDown(0.5)
    doc.fontSize(14).font("Helvetica").text(`${MESES[mes]} ${ano}`, { align: "center" })
    doc.fontSize(12).text(`Vendedor: ${userName}`, { align: "center" })
    doc.moveDown(1)

    // Summary by type
    const byType: Record<string, { count: number; total: number }> = {}
    let grandTotal = 0

    for (const d of despesas) {
      const tipo = d.tipo
      const valor = Number(d.valor)
      if (!byType[tipo]) {
        byType[tipo] = { count: 0, total: 0 }
      }
      byType[tipo].count++
      byType[tipo].total += valor
      grandTotal += valor
    }

    doc.fontSize(14).font("Helvetica-Bold").text("Resumo por Categoria")
    doc.moveDown(0.3)

    // Table header
    const tableTop = doc.y
    doc.fontSize(10).font("Helvetica-Bold")
    doc.text("Categoria", 50, tableTop, { width: 150 })
    doc.text("Qtd", 200, tableTop, { width: 50, align: "center" })
    doc.text("Total", 250, tableTop, { width: 100, align: "right" })
    doc.moveTo(50, tableTop + 15).lineTo(350, tableTop + 15).stroke()

    let y = tableTop + 20
    doc.font("Helvetica")
    for (const [tipo, data] of Object.entries(byType)) {
      doc.text(TIPO_LABELS[tipo] || tipo, 50, y, { width: 150 })
      doc.text(data.count.toString(), 200, y, { width: 50, align: "center" })
      doc.text(`€${data.total.toFixed(2)}`, 250, y, { width: 100, align: "right" })
      y += 18
    }

    // Total line
    doc.moveTo(50, y).lineTo(350, y).stroke()
    y += 5
    doc.font("Helvetica-Bold")
    doc.text("TOTAL", 50, y, { width: 150 })
    doc.text(despesas.length.toString(), 200, y, { width: 50, align: "center" })
    doc.text(`€${grandTotal.toFixed(2)}`, 250, y, { width: 100, align: "right" })

    doc.moveDown(2)

    // Detailed list
    doc.addPage()
    doc.fontSize(14).font("Helvetica-Bold").text("Detalhes das Despesas")
    doc.moveDown(0.5)

    for (const despesa of despesas) {
      // Check if we need a new page
      if (doc.y > 700) {
        doc.addPage()
      }

      const dataStr = new Date(despesa.data).toLocaleDateString("pt-PT")
      
      doc.fontSize(11).font("Helvetica-Bold")
      doc.text(`${dataStr} - ${TIPO_LABELS[despesa.tipo] || despesa.tipo}`, { continued: true })
      doc.font("Helvetica").text(`  €${Number(despesa.valor).toFixed(2)}`)
      
      if (despesa.descricao) {
        doc.fontSize(10).font("Helvetica").fillColor("#666666")
        doc.text(despesa.descricao)
        doc.fillColor("#000000")
      }

      // Add images if any (as thumbnails)
      if (despesa.imagens && despesa.imagens.length > 0) {
        doc.fontSize(9).fillColor("#888888")
        doc.text(`📎 ${despesa.imagens.length} comprovativo(s) anexado(s)`)
        doc.fillColor("#000000")
      }

      doc.moveDown(0.5)
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#EEEEEE").stroke()
      doc.strokeColor("#000000")
      doc.moveDown(0.5)
    }

    // Footer with generation date
    const pages = doc.bufferedPageRange()
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i)
      doc.fontSize(8).fillColor("#999999")
      doc.text(
        `Gerado em ${new Date().toLocaleDateString("pt-PT")} às ${new Date().toLocaleTimeString("pt-PT")} | Página ${i + 1} de ${pages.count}`,
        50,
        doc.page.height - 30,
        { align: "center", width: doc.page.width - 100 }
      )
    }

    doc.end()

    // Wait for PDF to be generated
    await new Promise<void>((resolve) => doc.on("end", resolve))

    const pdfBuffer = Buffer.concat(chunks)

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Despesas_${MESES[mes]}_${ano}.pdf"`
      }
    })
  } catch (error) {
    console.error("Error generating PDF:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
