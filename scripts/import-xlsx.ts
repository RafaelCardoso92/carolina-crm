import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import * as XLSX from 'xlsx'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// Client name normalization map
const clientNameMap: Record<string, string> = {
  "Paula S": "Paula Silva",
  "Paula Silva ": "Paula Silva",
  "Elisabete": "Elisabete Costa",
  "Elisabete C.": "Elisabete Costa",
  "elisabete C": "Elisabete Costa",
  "Cuida me": "Cuidame",
  "Cuida me ": "Cuidame",
  "Celia Mira": "Celia",
  "CELIA ": "Celia",
  "Celia Vicente": "Celia Vicente",
  "Célia Vicente": "Celia Vicente",
  "Célia Lourenço": "Celia Lourenço",
  "Lucia Bat": "Lucia Batista",
  "Lucia": "Lucia Batista",
  "lucia": "Lucia Batista",
  "Lucia ": "Lucia Batista",
  "Andreia B": "Andreia Bento",
  "Andreia B.": "Andreia Bento",
  "Nutri": "Nutrileiria",
  "nutri": "Nutrileiria",
  "Pura": "Pura Beleza",
  "pura": "Pura Beleza",
  "pura beleza": "Pura Beleza",
  "Olga": "Olga Pimentel",
  "olga": "Olga Pimentel",
  "Olga ": "Olga Pimentel",
  "Olga Pim.": "Olga Pimentel",
  "Ines": "Enf Ines",
  "INES": "Enf Ines",
  "ines": "Enf Ines",
  "D.Marta": "Lurdes Marta",
  "Dmarta": "Lurdes Marta",
  "L.Marta": "Lurdes Marta",
  "lurdes marta": "Lurdes Marta",
  "Teresa PD": "Teresa Duarte",
  "TERESA PD": "Teresa Duarte",
  "Teresa Pd": "Teresa Duarte",
  "teresa pd": "Teresa Duarte",
  "Teresa Duarte": "Teresa Duarte",
  "TERESA PEREIRA": "Teresa Pereira",
  "Teresa TAS": "Teresa TAS",
  "teresa tas": "Teresa TAS",
  "cristina": "Cristina",
  "Cristina C.": "Cristina",
  "elegancia": "Elegancia",
  "Elegância": "Elegancia",
  "portela": "Portela",
  "portela av": "Portela",
  "dina": "Dina",
  "Setima": "Setima Essencia",
  "SETIMA ESSENCIA": "Setima Essencia",
  "Setima ess": "Setima Essencia",
  "instantes": "Instantes",
  "INSTANTES": "Instantes",
  "Kristel": "Kristell",
  "kristel": "Kristell",
  "silvia netto": "Silvia Neto",
  "susete": "Suzete",
  "Susete": "Suzete",
  "seia": "Seia",
  "ana raposo": "Ana Raposo",
  "spirit": "Spirit",
  "la donna": "La Donna",
  "LA DONNA": "La Donna",
  "Ana vilas": "Ana Vilas",
  "d odete": "Maria Odete",
  "Maria odete": "Maria Odete",
  "Lena Mateus": "Helena Mateus",
  "Helena Mateus": "Helena Mateus",
  "Lorrana C.": "Lorrana Costa",
  "Carla raposo": "Carla Raposo",
  "Fisibela": "Fisibela",
  "FISIBELA": "Fisibela",
  "Katia meda": "Katia Meda",
  "Silkcare": "Silkare",
  "Silkare": "Silkare",
  "Cristina Brito": "Cristina Brito",
  "Ivone Mafra": "Ivone Mafra",
  "Ivone Ramos": "Ivone Ramos",
  "Agilrequinte": "Agilrequinte",
  "Glamour": "Glamour",
  "Carla Franco": "Carla Franco",
  "Ana Cameira": "Ana Cameira",
  "Ana cameira": "Ana Cameira",
  "Andreia Bento": "Andreia Bento",
  "Paula Santana": "Paula Santana",
  "Neuza": "Neuza",
  "Olivia": "Olivia",
  "Isaura": "Isaura",
  "Sandra G": "Sandra Garcia",
}

function normalizeClientName(name: string): string {
  if (!name) return ""
  const trimmed = name.trim()
  return clientNameMap[trimmed] || trimmed
}

interface SaleData {
  cliente: string
  valor1: number | null
  valor2: number | null
  total: number
  mes: number
  ano: number
  notas: string | null
}

// Month name to number mapping
const monthNameToNumber: Record<string, number> = {
  "JANEIRO": 1, "FEVEREIRO": 2, "MARÇO": 3,
  "ABRIL": 4, "MAIO": 5, "JUNHO": 6,
  "JULHO": 7, "AGOSTO": 8, "SETEMBRO": 9,
  "OUTUBRO": 10, "NOVEMBRO": 11, "DEZEMBRO": 12
}

function parseQuarterSheet(sheet: XLSX.WorkSheet, sheetName: string): SaleData[] {
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][]
  const sales: SaleData[] = []

  // Get month names from row 0
  const monthRow = data[0] as string[]
  const months: { col: number, month: number }[] = []

  // Find month columns
  for (let col = 0; col < (monthRow?.length || 0); col++) {
    const cellValue = monthRow[col]
    if (typeof cellValue === 'string') {
      const monthNum = monthNameToNumber[cellValue.toUpperCase()]
      if (monthNum) {
        months.push({ col, month: monthNum })
      }
    }
  }

  console.log(`Sheet ${sheetName}: Found months at columns:`, months.map(m => `${Object.keys(monthNameToNumber).find(k => monthNameToNumber[k] === m.month)} (col ${m.col})`))

  // Parse data rows (starting from row 3)
  for (let row = 3; row < data.length; row++) {
    const rowData = data[row] as unknown[]
    if (!rowData) continue

    // Process each month column
    for (const { col, month } of months) {
      const cliente = rowData[col]
      const valor1 = rowData[col + 1]
      const valor2 = rowData[col + 2]
      const total = rowData[col + 3]
      const notas = rowData[col + 4]

      // Skip if no client name or it's a summary row
      if (!cliente || typeof cliente !== 'string') continue
      if (cliente.toLowerCase().includes('obj') || cliente.toLowerCase().includes('falta')) continue
      if (cliente.toLowerCase().includes('incid')) continue

      const normalizedClient = normalizeClientName(cliente)
      if (!normalizedClient) continue

      // Skip if total is not a valid number
      const totalNum = Number(total)
      if (isNaN(totalNum) || totalNum <= 0) continue

      sales.push({
        cliente: normalizedClient,
        valor1: valor1 !== null && valor1 !== undefined && !isNaN(Number(valor1)) ? Number(valor1) : null,
        valor2: valor2 !== null && valor2 !== undefined && !isNaN(Number(valor2)) ? Number(valor2) : null,
        total: totalNum,
        mes: month,
        ano: 2025,
        notas: typeof notas === 'string' ? notas : null
      })
    }
  }

  return sales
}

async function main() {
  console.log("Starting xlsx import...")

  const workbook = XLSX.readFile('/Users/rafaelcardoso/VENDAS 2025.xlsx')
  console.log("Sheet names:", workbook.SheetNames)

  // Collect all sales from all quarters
  const allSales: SaleData[] = []

  // Process each quarter sheet
  const quarterSheets = ['1ºTrimestre', '2ºTrimestre ', '3ºTrimestre ', '4ºTrimestre']

  for (const sheetName of quarterSheets) {
    const sheet = workbook.Sheets[sheetName]
    if (!sheet) {
      console.log(`Sheet "${sheetName}" not found, trying without space...`)
      const altSheet = workbook.Sheets[sheetName.trim()]
      if (altSheet) {
        const sales = parseQuarterSheet(altSheet, sheetName)
        console.log(`Parsed ${sales.length} sales from ${sheetName}`)
        allSales.push(...sales)
      }
      continue
    }
    const sales = parseQuarterSheet(sheet, sheetName)
    console.log(`Parsed ${sales.length} sales from ${sheetName}`)
    allSales.push(...sales)
  }

  console.log(`\nTotal sales parsed: ${allSales.length}`)

  // Get existing clients
  const existingClients = await prisma.cliente.findMany()
  const clientMap = new Map(existingClients.map(c => [c.nome.toLowerCase(), c.id]))

  console.log(`Found ${existingClients.length} existing clients in database`)

  // Collect all unique client names from sales
  const uniqueClients = new Set<string>()
  for (const sale of allSales) {
    uniqueClients.add(sale.cliente)
  }

  // Create missing clients
  let newClientsCount = 0
  for (const clientName of uniqueClients) {
    if (!clientMap.has(clientName.toLowerCase())) {
      console.log(`Creating client: ${clientName}`)
      const newClient = await prisma.cliente.create({
        data: {
          nome: clientName,
          ativo: true
        }
      })
      clientMap.set(clientName.toLowerCase(), newClient.id)
      newClientsCount++
    }
  }
  console.log(`Created ${newClientsCount} new clients`)

  // Import sales
  let salesCreated = 0
  let salesSkipped = 0
  let salesUpdated = 0

  for (const sale of allSales) {
    const clientId = clientMap.get(sale.cliente.toLowerCase())

    if (!clientId) {
      console.log(`Client not found: ${sale.cliente}`)
      continue
    }

    // Check if sale already exists for this client/month/year
    const existing = await prisma.venda.findFirst({
      where: {
        clienteId: clientId,
        mes: sale.mes,
        ano: sale.ano
      }
    })

    if (existing) {
      // Check if values are different - if so, update
      const existingTotal = Number(existing.total)
      if (Math.abs(existingTotal - sale.total) > 0.01) {
        await prisma.venda.update({
          where: { id: existing.id },
          data: {
            valor1: sale.valor1,
            valor2: sale.valor2,
            total: sale.total,
            notas: sale.notas || existing.notas
          }
        })
        console.log(`Updated sale for ${sale.cliente} in ${sale.mes}/${sale.ano}: ${existingTotal}€ -> ${sale.total}€`)
        salesUpdated++
      } else {
        salesSkipped++
      }
      continue
    }

    // Create sale
    await prisma.venda.create({
      data: {
        clienteId: clientId,
        valor1: sale.valor1,
        valor2: sale.valor2,
        total: sale.total,
        mes: sale.mes,
        ano: sale.ano,
        notas: sale.notas
      }
    })
    salesCreated++
    console.log(`Created sale for ${sale.cliente}: ${sale.total}€ (${sale.mes}/${sale.ano})`)
  }

  console.log("\n--- Import Summary ---")
  console.log(`New clients created: ${newClientsCount}`)
  console.log(`Sales created: ${salesCreated}`)
  console.log(`Sales updated: ${salesUpdated}`)
  console.log(`Sales skipped (already exist): ${salesSkipped}`)

  // Show totals by month
  const totals = await prisma.venda.groupBy({
    by: ['mes', 'ano'],
    _sum: { total: true },
    where: { ano: 2025 },
    orderBy: [{ ano: 'asc' }, { mes: 'asc' }]
  })

  const monthNames = ["", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
                      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]

  console.log("\n--- 2025 Monthly Totals ---")
  for (const t of totals) {
    console.log(`${monthNames[t.mes]} ${t.ano}: ${Number(t._sum.total).toFixed(2)}€`)
  }
}

main()
  .catch(console.error)
  .finally(() => {
    prisma.$disconnect()
    pool.end()
  })
