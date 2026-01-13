import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// Q1 2025 Sales Data parsed from CSV
const salesData2025Q1 = [
  // JANEIRO 2025
  { cliente: "Silvia Neto", valor1: 310.46, valor2: null, total: 310.46, mes: 1, ano: 2025, notas: null },
  { cliente: "Teresa PD", valor1: 232.86, valor2: 310.83, total: 543.69, mes: 1, ano: 2025, notas: null },
  { cliente: "Paula Silva", valor1: 787.49, valor2: 152.48, total: 939.97, mes: 1, ano: 2025, notas: "20% + exp" },
  { cliente: "Cuidame", valor1: 355.49, valor2: null, total: 355.49, mes: 1, ano: 2025, notas: "exp" },
  { cliente: "Elisabete Costa", valor1: 1465.4, valor2: 273.16, total: 1738.56, mes: 1, ano: 2025, notas: "20%" },
  { cliente: "Lurdes Marta", valor1: 306.33, valor2: null, total: 306.33, mes: 1, ano: 2025, notas: "20%" },
  { cliente: "Olga Pimentel", valor1: 172.8, valor2: null, total: 172.8, mes: 1, ano: 2025, notas: "mini" },
  { cliente: "Seia", valor1: 1682.62, valor2: null, total: 1682.62, mes: 1, ano: 2025, notas: "20%" },
  { cliente: "Enf Ines", valor1: 319.88, valor2: null, total: 319.88, mes: 1, ano: 2025, notas: null },
  { cliente: "Celia", valor1: 215.98, valor2: null, total: 215.98, mes: 1, ano: 2025, notas: "exp" },
  { cliente: "Trindade", valor1: 1323.31, valor2: 53.99, total: 1377.3, mes: 1, ano: 2025, notas: "20%" },
  { cliente: "Cristina", valor1: 84.03, valor2: null, total: 84.03, mes: 1, ano: 2025, notas: null },
  { cliente: "Joana", valor1: 88.38, valor2: null, total: 88.38, mes: 1, ano: 2025, notas: null },
  { cliente: "Instantes", valor1: 787.87, valor2: null, total: 787.87, mes: 1, ano: 2025, notas: null },
  { cliente: "Kristel", valor1: 333.66, valor2: null, total: 333.66, mes: 1, ano: 2025, notas: "20%" },
  { cliente: "Setima Essencia", valor1: 281.49, valor2: null, total: 281.49, mes: 1, ano: 2025, notas: null },
  { cliente: "Elegancia", valor1: 524.3, valor2: null, total: 524.3, mes: 1, ano: 2025, notas: "20%" },
  { cliente: "Susete", valor1: 84.14, valor2: null, total: 84.14, mes: 1, ano: 2025, notas: "cera" },
  { cliente: "Nutri", valor1: 397.56, valor2: null, total: 397.56, mes: 1, ano: 2025, notas: "20%" },
  { cliente: "Portela", valor1: 307.54, valor2: null, total: 307.54, mes: 1, ano: 2025, notas: "20%" },
  { cliente: "Pura", valor1: 317.93, valor2: null, total: 317.93, mes: 1, ano: 2025, notas: null },
  { cliente: "Dina", valor1: 308.12, valor2: null, total: 308.12, mes: 1, ano: 2025, notas: null },

  // FEVEREIRO 2025
  { cliente: "Elegancia", valor1: 266.88, valor2: 965.95, total: 1232.83, mes: 2, ano: 2025, notas: null },
  { cliente: "Paula Santana", valor1: 30.09, valor2: 320.22, total: 350.31, mes: 2, ano: 2025, notas: null },
  { cliente: "Teresa PD", valor1: 162.2, valor2: 2.57, total: 164.77, mes: 2, ano: 2025, notas: null },
  { cliente: "Trindade", valor1: 903.82, valor2: null, total: 903.82, mes: 2, ano: 2025, notas: "ovos" },
  { cliente: "Cristina", valor1: 406.84, valor2: null, total: 406.84, mes: 2, ano: 2025, notas: "ovos" },
  { cliente: "Paula S", valor1: 403.42, valor2: null, total: 403.42, mes: 2, ano: 2025, notas: "ovos" },
  { cliente: "Susana Lopes", valor1: 476.76, valor2: null, total: 476.76, mes: 2, ano: 2025, notas: "ovos" },
  { cliente: "Andreia B", valor1: 202.69, valor2: null, total: 202.69, mes: 2, ano: 2025, notas: "ovos" },
  { cliente: "Portela", valor1: 399.49, valor2: null, total: 399.49, mes: 2, ano: 2025, notas: "curso" },
  { cliente: "Cuidame", valor1: 293.5, valor2: null, total: 293.5, mes: 2, ano: 2025, notas: "curso" },
  { cliente: "Lurdes Marta", valor1: 277.2, valor2: null, total: 277.2, mes: 2, ano: 2025, notas: "ovo 1" },
  { cliente: "Lucia Bat", valor1: 393.21, valor2: null, total: 393.21, mes: 2, ano: 2025, notas: null },
  { cliente: "Ana Vilas", valor1: 235.35, valor2: null, total: 235.35, mes: 2, ano: 2025, notas: "ovo 2" },
  { cliente: "Celia Mira", valor1: 211.47, valor2: null, total: 211.47, mes: 2, ano: 2025, notas: "ovo 1" },
  { cliente: "Elisabete", valor1: 503.8, valor2: 340.65, total: 844.45, mes: 2, ano: 2025, notas: null },
  { cliente: "Seia", valor1: 304.85, valor2: null, total: 304.85, mes: 2, ano: 2025, notas: "ovos" },
  { cliente: "Instantes", valor1: 654.91, valor2: null, total: 654.91, mes: 2, ano: 2025, notas: "ovo 1" },
  { cliente: "Pura Beleza", valor1: 218.18, valor2: null, total: 218.18, mes: 2, ano: 2025, notas: "ovos" },
  { cliente: "Spirit", valor1: 177.56, valor2: null, total: 177.56, mes: 2, ano: 2025, notas: null },
  { cliente: "Ana Raposo", valor1: 167.67, valor2: null, total: 167.67, mes: 2, ano: 2025, notas: "ovo1" },
  { cliente: "Nutri", valor1: 198.43, valor2: null, total: 198.43, mes: 2, ano: 2025, notas: "ovos" },
  { cliente: "Olga", valor1: 36.01, valor2: null, total: 36.01, mes: 2, ano: 2025, notas: null },

  // MARÇO 2025
  { cliente: "Andreia B", valor1: 74.92, valor2: 369.85, total: 444.77, mes: 3, ano: 2025, notas: null },
  { cliente: "Ana Cameira", valor1: 81.77, valor2: null, total: 81.77, mes: 3, ano: 2025, notas: null },
  { cliente: "Cuida me", valor1: 74.9, valor2: 174.53, total: 249.43, mes: 3, ano: 2025, notas: null },
  { cliente: "Paula Silva", valor1: 405.93, valor2: null, total: 405.93, mes: 3, ano: 2025, notas: null },
  { cliente: "Teresa PD", valor1: 168.67, valor2: 138.75, total: 307.42, mes: 3, ano: 2025, notas: null },
  { cliente: "Elegancia", valor1: 543.4, valor2: null, total: 543.4, mes: 3, ano: 2025, notas: null },
  { cliente: "Olivia", valor1: 152.94, valor2: null, total: 152.94, mes: 3, ano: 2025, notas: null },
  { cliente: "Nutri", valor1: 163.41, valor2: null, total: 163.41, mes: 3, ano: 2025, notas: null },
  { cliente: "Instantes", valor1: 275.74, valor2: null, total: 275.74, mes: 3, ano: 2025, notas: null },
  { cliente: "Joana", valor1: 416.35, valor2: null, total: 416.35, mes: 3, ano: 2025, notas: null },
  { cliente: "Portela", valor1: 534.03, valor2: 192.45, total: 726.48, mes: 3, ano: 2025, notas: null },
  { cliente: "Neuza", valor1: 241.03, valor2: null, total: 241.03, mes: 3, ano: 2025, notas: null },
  { cliente: "D.Marta", valor1: 349.74, valor2: null, total: 349.74, mes: 3, ano: 2025, notas: null },
  { cliente: "Elisabete", valor1: 1084.79, valor2: null, total: 1084.79, mes: 3, ano: 2025, notas: null },
  { cliente: "Lucia", valor1: 151.51, valor2: null, total: 151.51, mes: 3, ano: 2025, notas: null },
  { cliente: "Ines", valor1: 161.19, valor2: null, total: 161.19, mes: 3, ano: 2025, notas: null },
  { cliente: "Pura", valor1: 160.67, valor2: null, total: 160.67, mes: 3, ano: 2025, notas: null },
  { cliente: "Seia", valor1: 715.77, valor2: null, total: 715.77, mes: 3, ano: 2025, notas: null },
  { cliente: "Teresa TAS", valor1: 270.31, valor2: null, total: 270.31, mes: 3, ano: 2025, notas: null },
  { cliente: "Susana Lopes", valor1: 521.71, valor2: null, total: 521.71, mes: 3, ano: 2025, notas: null },
  { cliente: "La Donna", valor1: 35.84, valor2: null, total: 35.84, mes: 3, ano: 2025, notas: null },
]

// Client name normalization map
const clientNameMap: Record<string, string> = {
  "Paula S": "Paula Silva",
  "Elisabete": "Elisabete Costa",
  "Cuida me": "Cuidame",
  "Celia Mira": "Celia",
  "Lucia Bat": "Lucia Batista",
  "Lucia": "Lucia Batista",
  "Andreia B": "Andreia Bento",
  "Nutri": "Nutrileiria",
  "Pura": "Pura Beleza",
  "Olga": "Olga Pimentel",
  "Ines": "Enf Ines",
  "D.Marta": "Lurdes Marta",
}

function normalizeClientName(name: string): string {
  const trimmed = name.trim()
  return clientNameMap[trimmed] || trimmed
}

async function main() {
  console.log("Starting data import...")

  // Get existing clients
  const existingClients = await prisma.cliente.findMany()
  const clientMap = new Map(existingClients.map(c => [c.nome.toLowerCase(), c.id]))

  console.log(`Found ${existingClients.length} existing clients`)

  // Collect all unique client names from sales
  const uniqueClients = new Set<string>()
  for (const sale of salesData2025Q1) {
    uniqueClients.add(normalizeClientName(sale.cliente))
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

  for (const sale of salesData2025Q1) {
    const clientName = normalizeClientName(sale.cliente)
    const clientId = clientMap.get(clientName.toLowerCase())

    if (!clientId) {
      console.log(`Client not found: ${clientName}`)
      continue
    }

    // Check if sale already exists
    const existing = await prisma.venda.findFirst({
      where: {
        clienteId: clientId,
        mes: sale.mes,
        ano: sale.ano
      }
    })

    if (existing) {
      console.log(`Sale already exists for ${clientName} in ${sale.mes}/${sale.ano}`)
      salesSkipped++
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
    console.log(`Created sale for ${clientName}: ${sale.total}€ (${sale.mes}/${sale.ano})`)
  }

  console.log("\n--- Import Summary ---")
  console.log(`New clients created: ${newClientsCount}`)
  console.log(`Sales created: ${salesCreated}`)
  console.log(`Sales skipped (already exist): ${salesSkipped}`)

  // Show totals by month
  const totals = await prisma.venda.groupBy({
    by: ['mes', 'ano'],
    _sum: { total: true },
    where: { ano: 2025 },
    orderBy: [{ ano: 'asc' }, { mes: 'asc' }]
  })

  console.log("\n--- 2025 Monthly Totals ---")
  for (const t of totals) {
    const months = ["", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
                    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]
    console.log(`${months[t.mes]} ${t.ano}: ${Number(t._sum.total).toFixed(2)}€`)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
