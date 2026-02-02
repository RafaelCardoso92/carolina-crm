import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/api-auth"
import { PERMISSIONS } from "@/lib/permissions"
import PDFDocument from "pdfkit"

type Params = {
  params: Promise<{ id: string }>
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-PT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("pt-PT")
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    await requirePermission(PERMISSIONS.ORCAMENTOS_READ)
    const { id } = await params

    const orcamento = await prisma.orcamento.findUnique({
      where: { id },
      include: {
        prospecto: true,
        cliente: true,
        itens: {
          include: { produto: true },
          orderBy: { ordem: "asc" }
        }
      }
    })

    if (!orcamento) {
      return NextResponse.json({ error: "Orcamento nao encontrado" }, { status: 404 })
    }

    // Create PDF
    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
      info: {
        Title: `Orcamento ${orcamento.numero}`,
        Author: "Carolina Cardoso - Cosmeticos",
        Subject: orcamento.titulo || "Orcamento"
      }
    })

    const chunks: Buffer[] = []
    doc.on("data", (chunk: Buffer) => chunks.push(chunk))

    const pdfPromise = new Promise<Buffer>((resolve, reject) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)))
      doc.on("error", reject)
    })

    const destinatario = orcamento.cliente || orcamento.prospecto
    const destinatarioNome = orcamento.cliente?.nome || orcamento.prospecto?.nomeEmpresa || "N/A"

    // Header
    doc.fontSize(24).fillColor("#1a1a1a").text("ORCAMENTO", 50, 50)
    doc.fontSize(10).fillColor("#666666").text("Carolina Cardoso - Cosmeticos", 50, 80)

    // Quote number and date (right aligned)
    doc.fontSize(14).fillColor("#1a1a1a").text(orcamento.numero, 400, 50, { align: "right" })
    doc.fontSize(9).fillColor("#666666").text(`Data: ${formatDate(orcamento.dataEmissao)}`, 400, 70, { align: "right" })
    if (orcamento.dataValidade) {
      doc.text(`Valido ate: ${formatDate(orcamento.dataValidade)}`, 400, 85, { align: "right" })
    }

    // Horizontal line
    doc.moveTo(50, 110).lineTo(545, 110).strokeColor("#e0e0e0").stroke()

    // Destinatario section
    doc.fontSize(11).fillColor("#1a1a1a").text("DESTINATARIO", 50, 130)
    doc.fontSize(10).fillColor("#333333").text(destinatarioNome, 50, 148)

    let yPos = 163
    if (destinatario?.email) {
      doc.fontSize(9).fillColor("#666666").text(destinatario.email, 50, yPos)
      yPos += 13
    }
    if (destinatario?.telefone) {
      doc.fontSize(9).fillColor("#666666").text(destinatario.telefone, 50, yPos)
      yPos += 13
    }
    if (destinatario?.morada) {
      doc.fontSize(9).fillColor("#666666").text(destinatario.morada, 50, yPos, { width: 200 })
      yPos += 26
    }

    // Title and Introduction
    if (orcamento.titulo) {
      yPos = Math.max(yPos, 175) + 20
      doc.fontSize(12).fillColor("#1a1a1a").text(orcamento.titulo, 50, yPos)
      yPos += 20
    }

    if (orcamento.introducao) {
      yPos += 5
      doc.fontSize(9).fillColor("#555555").text(orcamento.introducao, 50, yPos, { width: 495 })
      yPos += doc.heightOfString(orcamento.introducao, { width: 495 }) + 15
    }

    // Items table
    yPos = Math.max(yPos, 220)

    // Table header
    doc.rect(50, yPos, 495, 25).fillColor("#f5f5f5").fill()
    doc.fontSize(8).fillColor("#333333")
    doc.text("DESCRICAO", 55, yPos + 8)
    doc.text("QTD", 330, yPos + 8, { width: 40, align: "center" })
    doc.text("PRECO", 375, yPos + 8, { width: 60, align: "right" })
    doc.text("DESC.", 440, yPos + 8, { width: 45, align: "right" })
    doc.text("SUBTOTAL", 490, yPos + 8, { width: 55, align: "right" })

    yPos += 25

    // Table rows
    let isAlternate = false
    for (const item of orcamento.itens) {
      // Check if we need a new page
      if (yPos > 700) {
        doc.addPage()
        yPos = 50
      }

      const rowHeight = Math.max(25, doc.heightOfString(item.descricao, { width: 265 }) + 10)

      if (isAlternate) {
        doc.rect(50, yPos, 495, rowHeight).fillColor("#fafafa").fill()
      }

      doc.fontSize(9).fillColor("#333333")
      doc.text(item.descricao, 55, yPos + 8, { width: 265 })
      doc.text(String(Number(item.quantidade)), 330, yPos + 8, { width: 40, align: "center" })
      doc.text(`${formatCurrency(Number(item.precoUnit))} EUR`, 360, yPos + 8, { width: 75, align: "right" })
      doc.text(`${formatCurrency(Number(item.desconto))} EUR`, 425, yPos + 8, { width: 60, align: "right" })
      doc.text(`${formatCurrency(Number(item.subtotal))} EUR`, 480, yPos + 8, { width: 65, align: "right" })

      yPos += rowHeight
      isAlternate = !isAlternate
    }

    // Line under table
    doc.moveTo(50, yPos).lineTo(545, yPos).strokeColor("#e0e0e0").stroke()

    // Totals section
    yPos += 20

    // Check if we need a new page for totals
    if (yPos > 680) {
      doc.addPage()
      yPos = 50
    }

    const totalsX = 400
    doc.fontSize(9).fillColor("#666666").text("Subtotal:", totalsX, yPos)
    doc.fillColor("#333333").text(`${formatCurrency(Number(orcamento.subtotal))} EUR`, totalsX + 50, yPos, { width: 95, align: "right" })

    yPos += 16
    doc.fillColor("#666666").text("IVA (23%):", totalsX, yPos)
    doc.fillColor("#333333").text(`${formatCurrency(Number(orcamento.iva))} EUR`, totalsX + 50, yPos, { width: 95, align: "right" })

    yPos += 20
    doc.rect(totalsX - 10, yPos - 5, 165, 28).fillColor("#1a1a1a").fill()
    doc.fontSize(11).fillColor("#ffffff").text("TOTAL:", totalsX, yPos + 2)
    doc.fontSize(12).text(`${formatCurrency(Number(orcamento.total))} EUR`, totalsX + 50, yPos, { width: 95, align: "right" })

    // Conditions
    if (orcamento.condicoes) {
      yPos += 50
      if (yPos > 700) {
        doc.addPage()
        yPos = 50
      }
      doc.fontSize(10).fillColor("#1a1a1a").text("CONDICOES", 50, yPos)
      yPos += 15
      doc.fontSize(9).fillColor("#555555").text(orcamento.condicoes, 50, yPos, { width: 495 })
    }

    // Footer
    const footerY = 780
    doc.fontSize(8).fillColor("#999999")
    doc.text("Este documento foi gerado automaticamente.", 50, footerY, { align: "center", width: 495 })
    doc.text("Carolina Cardoso - Cosmeticos", 50, footerY + 12, { align: "center", width: 495 })

    doc.end()

    const pdfBuffer = await pdfPromise

    // Return PDF as response - convert Buffer to Uint8Array for NextResponse
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="orcamento_${orcamento.numero}.pdf"`,
        "Content-Length": pdfBuffer.length.toString()
      }
    })
  } catch (error) {
    if (error instanceof NextResponse) return error
    console.error("Error generating PDF:", error)
    return NextResponse.json({ error: "Erro ao gerar PDF" }, { status: 500 })
  }
}
