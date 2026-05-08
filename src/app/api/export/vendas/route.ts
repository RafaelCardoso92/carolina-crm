import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import * as XLSX from "xlsx"
import { getIVAForMonth } from "@/lib/iva"

const meses = [
  "", "Janeiro", "Fevereiro", "Marco", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
]

// Venda.total is stored s/IVA (net). Add IVA at the rate active for the sale period.
function calcularIVA(totalSemIVA: number, ivaRate: number) {
  const semIVA = Math.round(totalSemIVA * 100) / 100
  const iva = Math.round(semIVA * (ivaRate / 100) * 100) / 100
  const comIVA = Math.round((semIVA + iva) * 100) / 100
  return { semIVA, iva, comIVA }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const ano = parseInt(searchParams.get("ano") || new Date().getFullYear().toString())
    const tipo = searchParams.get("tipo") || "completo" // completo, mensal, trimestral, clientes

    const workbook = XLSX.utils.book_new()

    // Resolve the IVA rate for this report year (uses the rate active on Jan 1 of `ano`).
    // Mid-year rate changes are rare in Portugal; using a year-anchor keeps aggregates consistent.
    const ivaRate = await getIVAForMonth(1, ano)
    const ivaLabel = `IVA (${ivaRate}%)`

    // Get all sales for the year with client info
    const vendas = await prisma.venda.findMany({
      where: { ano },
      include: { cliente: true },
      orderBy: [{ mes: "asc" }, { cliente: { nome: "asc" } }]
    })

    // Get objectives
    const [objetivosMensais, objetivosTrimestrais, objetivoAnual] = await Promise.all([
      prisma.objetivoMensal.findMany({ where: { ano }, orderBy: { mes: "asc" } }),
      prisma.objetivoTrimestral.findMany({ where: { ano }, orderBy: { trimestre: "asc" } }),
      prisma.objetivoAnual.findUnique({ where: { ano } })
    ])

    // Get prize tables
    const [premiosMensais, premiosTrimestrais] = await Promise.all([
      prisma.premioMensal.findMany({ orderBy: { minimo: "asc" } }),
      prisma.premioTrimestral.findMany({ orderBy: { minimo: "asc" } })
    ])

    // ========== SHEET 1: Detailed Sales ==========
    if (tipo === "completo" || tipo === "detalhado") {
      const vendasData = vendas.map(v => {
        const totalSemIVA = Number(v.total)
        const { semIVA, iva, comIVA } = calcularIVA(totalSemIVA, ivaRate)
        return {
          "Data": `${meses[v.mes]} ${v.ano}`,
          "Mes": meses[v.mes],
          "Cliente": v.cliente.nome,
          "Codigo Cliente": v.cliente.codigo || "",
          "Valor 1": v.valor1 ? Number(v.valor1).toFixed(2) : "",
          "Valor 2": v.valor2 ? Number(v.valor2).toFixed(2) : "",
          "Sem IVA": semIVA.toFixed(2),
          [ivaLabel]: iva.toFixed(2),
          "Total c/IVA": comIVA.toFixed(2),
          "Notas": v.notas || ""
        }
      })

      const wsVendas = XLSX.utils.json_to_sheet(vendasData)

      // Set column widths
      wsVendas["!cols"] = [
        { wch: 12 }, // Data
        { wch: 12 }, // Mes
        { wch: 25 }, // Cliente
        { wch: 15 }, // Codigo
        { wch: 12 }, // Valor 1
        { wch: 12 }, // Valor 2
        { wch: 14 }, // Total
        { wch: 12 }, // Sem IVA
        { wch: 12 }, // IVA
        { wch: 30 }  // Notas
      ]

      XLSX.utils.book_append_sheet(workbook, wsVendas, "Vendas Detalhadas")
    }

    // ========== SHEET 2: Monthly Summary ==========
    if (tipo === "completo" || tipo === "mensal") {
      const resumoMensal = Array.from({ length: 12 }, (_, i) => {
        const mes = i + 1
        const vendasMes = vendas.filter(v => v.mes === mes)
        const totalMesSemIVA = vendasMes.reduce((sum, v) => sum + Number(v.total), 0)
        const { semIVA, iva, comIVA } = calcularIVA(totalMesSemIVA, ivaRate)
        const objetivo = objetivosMensais.find(o => o.mes === mes)
        const objValor = Number(objetivo?.objetivo) || 0
        const progresso = objValor > 0 ? (totalMesSemIVA / objValor) * 100 : 0

        // Calculate prize
        let premio = 0
        for (const p of premiosMensais) {
          if (totalMesSemIVA >= Number(p.minimo)) {
            premio = Number(p.premio)
          }
        }

        return {
          "Mes": meses[mes],
          "Nº Vendas": vendasMes.length,
          "Sem IVA": semIVA.toFixed(2),
          [ivaLabel]: iva.toFixed(2),
          "Total c/IVA": comIVA.toFixed(2),
          "Objetivo": objValor > 0 ? objValor.toFixed(2) : "-",
          "Progresso %": objValor > 0 ? progresso.toFixed(1) + "%" : "-",
          "Diferenca": objValor > 0 ? (totalMesSemIVA - objValor).toFixed(2) : "-",
          "Premio": premio > 0 ? premio.toFixed(2) + " €" : "-"
        }
      })

      // Add totals row
      const totalAnualSemIVA = vendas.reduce((sum, v) => sum + Number(v.total), 0)
      const { semIVA: semIVAAnual, iva: ivaAnual, comIVA: comIVAAnual } = calcularIVA(totalAnualSemIVA, ivaRate)
      const objAnualValor = Number(objetivoAnual?.objetivo) || 0
      const totalPremiosMensais = resumoMensal.reduce((sum, r) => {
        const premio = parseFloat(r["Premio"].replace(" €", "")) || 0
        return sum + premio
      }, 0)

      resumoMensal.push({
        "Mes": "TOTAL ANUAL",
        "Nº Vendas": vendas.length,
        "Sem IVA": semIVAAnual.toFixed(2),
        [ivaLabel]: ivaAnual.toFixed(2),
        "Total c/IVA": comIVAAnual.toFixed(2),
        "Objetivo": objAnualValor > 0 ? objAnualValor.toFixed(2) : "-",
        "Progresso %": objAnualValor > 0 ? ((totalAnualSemIVA / objAnualValor) * 100).toFixed(1) + "%" : "-",
        "Diferenca": objAnualValor > 0 ? (totalAnualSemIVA - objAnualValor).toFixed(2) : "-",
        "Premio": totalPremiosMensais > 0 ? totalPremiosMensais.toFixed(2) + " €" : "-"
      })

      const wsMensal = XLSX.utils.json_to_sheet(resumoMensal)
      wsMensal["!cols"] = [
        { wch: 14 }, { wch: 10 }, { wch: 14 }, { wch: 12 },
        { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }
      ]

      XLSX.utils.book_append_sheet(workbook, wsMensal, "Resumo Mensal")
    }

    // ========== SHEET 3: Quarterly Summary ==========
    if (tipo === "completo" || tipo === "trimestral") {
      const resumoTrimestral = Array.from({ length: 4 }, (_, i) => {
        const trimestre = i + 1
        const mesesTrimestre = [(trimestre - 1) * 3 + 1, (trimestre - 1) * 3 + 2, (trimestre - 1) * 3 + 3]
        const vendasTrimestre = vendas.filter(v => mesesTrimestre.includes(v.mes))
        const totalTrimestreSemIVA = vendasTrimestre.reduce((sum, v) => sum + Number(v.total), 0)
        const { semIVA, iva, comIVA } = calcularIVA(totalTrimestreSemIVA, ivaRate)
        const objetivo = objetivosTrimestrais.find(o => o.trimestre === trimestre)
        const objValor = Number(objetivo?.objetivo) || 0
        const progresso = objValor > 0 ? (totalTrimestreSemIVA / objValor) * 100 : 0

        // Calculate prize
        let premio = 0
        for (const p of premiosTrimestrais) {
          if (totalTrimestreSemIVA >= Number(p.minimo)) {
            premio = Number(p.premio)
          }
        }

        return {
          "Trimestre": `${trimestre}º Trimestre`,
          "Meses": `${meses[mesesTrimestre[0]]} - ${meses[mesesTrimestre[2]]}`,
          "Nº Vendas": vendasTrimestre.length,
          "Sem IVA": semIVA.toFixed(2),
          [ivaLabel]: iva.toFixed(2),
          "Total c/IVA": comIVA.toFixed(2),
          "Objetivo": objValor > 0 ? objValor.toFixed(2) : "-",
          "Progresso %": objValor > 0 ? progresso.toFixed(1) + "%" : "-",
          "Premio": premio > 0 ? premio.toFixed(2) + " €" : "-"
        }
      })

      const wsTrimestral = XLSX.utils.json_to_sheet(resumoTrimestral)
      wsTrimestral["!cols"] = [
        { wch: 14 }, { wch: 20 }, { wch: 10 }, { wch: 14 },
        { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }
      ]

      XLSX.utils.book_append_sheet(workbook, wsTrimestral, "Resumo Trimestral")
    }

    // ========== SHEET 4: Client Summary ==========
    if (tipo === "completo" || tipo === "clientes") {
      // Group sales by client
      const vendasPorCliente = new Map<string, { nome: string; codigo: string; vendas: number; count: number }>()

      for (const v of vendas) {
        const existing = vendasPorCliente.get(v.clienteId) || {
          nome: v.cliente.nome,
          codigo: v.cliente.codigo || "",
          vendas: 0,
          count: 0
        }
        existing.vendas += Number(v.total)
        existing.count += 1
        vendasPorCliente.set(v.clienteId, existing)
      }

      const clientesData = Array.from(vendasPorCliente.values())
        .sort((a, b) => b.vendas - a.vendas)
        .map((c, index) => {
          const { semIVA, iva, comIVA } = calcularIVA(c.vendas, ivaRate)
          return {
            "Ranking": index + 1,
            "Cliente": c.nome,
            "Codigo": c.codigo,
            "Nº Vendas": c.count,
            "Sem IVA": semIVA.toFixed(2),
            [ivaLabel]: iva.toFixed(2),
            "Total c/IVA": comIVA.toFixed(2)
          }
        })

      const wsClientes = XLSX.utils.json_to_sheet(clientesData)
      wsClientes["!cols"] = [
        { wch: 8 }, { wch: 25 }, { wch: 15 }, { wch: 10 },
        { wch: 14 }, { wch: 12 }, { wch: 12 }
      ]

      XLSX.utils.book_append_sheet(workbook, wsClientes, "Vendas por Cliente")
    }

    // ========== SHEET 5: Prize Tables ==========
    if (tipo === "completo") {
      // Monthly prizes
      const premiosMensaisData = premiosMensais.map(p => ({
        "Minimo Vendas": Number(p.minimo).toFixed(2) + " €",
        "Premio": Number(p.premio).toFixed(2) + " €"
      }))

      const wsPremiosMensais = XLSX.utils.json_to_sheet(premiosMensaisData)
      wsPremiosMensais["!cols"] = [{ wch: 15 }, { wch: 12 }]
      XLSX.utils.book_append_sheet(workbook, wsPremiosMensais, "Premios Mensais")

      // Quarterly prizes
      const premiosTrimestraisData = premiosTrimestrais.map(p => ({
        "Minimo Vendas": Number(p.minimo).toFixed(2) + " €",
        "Premio": Number(p.premio).toFixed(2) + " €"
      }))

      const wsPremiosTrim = XLSX.utils.json_to_sheet(premiosTrimestraisData)
      wsPremiosTrim["!cols"] = [{ wch: 15 }, { wch: 12 }]
      XLSX.utils.book_append_sheet(workbook, wsPremiosTrim, "Premios Trimestrais")
    }

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" })

    // Return as downloadable file
    return new NextResponse(excelBuffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="Relatorio_Vendas_${ano}.xlsx"`
      }
    })
  } catch (error) {
    console.error("Error exporting to Excel:", error)
    return NextResponse.json({ error: "Erro ao exportar para Excel" }, { status: 500 })
  }
}
