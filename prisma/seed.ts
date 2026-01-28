import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import bcrypt from "bcryptjs"
import fs from "fs"
import path from "path"
import "dotenv/config"

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("Starting seed...")

  // Create default user (Carolina)
  const hashedPassword = await bcrypt.hash("carolina123", 10)

  const user = await prisma.user.upsert({
    where: { email: "carolina" },
    update: { password: hashedPassword },
    create: {
      email: "carolina",
      name: "Carolina",
      password: hashedPassword
    }
  })
  console.log("Created user:", user.email)

  // Parse the CSV files
  const cobrancasPath = path.join(process.cwd(), "..", "Mapa Cobranças 2023.xlsx - Janeiro.csv")
  const vendasPath = path.join(process.cwd(), "..", "VENDAS 2025.xlsx - 1ºTrimestre.csv")

  // Import Cobrancas (billing) data
  if (fs.existsSync(cobrancasPath)) {
    console.log("Importing cobrancas data...")
    const cobrancasContent = fs.readFileSync(cobrancasPath, "utf-8")
    const cobrancasLines = cobrancasContent.split("\n").slice(1) // Skip header

    for (const line of cobrancasLines) {
      if (!line.trim()) continue

      const [clienteNome, codigo, fa, valor, , valorSemIva, comissao] = line.split(",")

      if (!clienteNome?.trim() || !valor?.trim()) continue

      const valorNum = parseFloat(valor.trim())
      if (isNaN(valorNum) || valorNum <= 0) continue

      // Create or find cliente
      let cliente = await prisma.cliente.findFirst({
        where: { nome: clienteNome.trim() }
      })

      if (!cliente) {
        cliente = await prisma.cliente.create({
          data: {
            nome: clienteNome.trim(),
            codigo: codigo?.trim() || null
          }
        })
        console.log("  Created cliente:", cliente.nome)
      }

      // Create cobranca
      await prisma.cobranca.create({
        data: {
          clienteId: cliente.id,
          fatura: fa?.trim() || null,
          valor: valorNum,
          valorSemIva: valorSemIva ? parseFloat(valorSemIva.trim()) : null,
          comissao: comissao ? parseFloat(comissao.trim()) : null
        }
      })
    }
    console.log("Cobrancas imported!")
  }

  // Import Vendas (sales) data - Q1 2025
  if (fs.existsSync(vendasPath)) {
    console.log("Importing vendas data...")
    const vendasContent = fs.readFileSync(vendasPath, "utf-8")
    const vendasLines = vendasContent.split("\n")

    // Parse each month's data (Janeiro, Fevereiro, Marco)
    const months = [
      { mes: 1, startCol: 0 },  // Janeiro
      { mes: 2, startCol: 6 },  // Fevereiro
      { mes: 3, startCol: 12 }  // Marco
    ]

    // Skip header rows (first 4 lines)
    for (let i = 4; i < vendasLines.length; i++) {
      const line = vendasLines[i]
      if (!line.trim()) continue

      const cols = line.split(",")

      for (const { mes, startCol } of months) {
        const clienteNome = cols[startCol]?.trim()
        const venda1 = cols[startCol + 1]?.trim()
        const venda2 = cols[startCol + 2]?.trim()
        const total = cols[startCol + 3]?.trim()

        if (!clienteNome || !total) continue

        const totalNum = parseFloat(total.replace(",", "."))
        if (isNaN(totalNum) || totalNum <= 0) continue

        // Skip summary rows
        if (clienteNome.toLowerCase().includes("obj") ||
            clienteNome.toLowerCase().includes("falta") ||
            clienteNome.toLowerCase().includes("total")) continue

        // Create or find cliente
        let cliente = await prisma.cliente.findFirst({
          where: { nome: { contains: clienteNome, mode: "insensitive" } }
        })

        if (!cliente) {
          cliente = await prisma.cliente.create({
            data: { nome: clienteNome }
          })
          console.log("  Created cliente:", cliente.nome)
        }

        // Check if venda already exists for this month
        const existingVenda = await prisma.venda.findFirst({
          where: {
            clienteId: cliente.id,
            mes,
            ano: 2025
          }
        })

        if (!existingVenda) {
          await prisma.venda.create({
            data: {
              clienteId: cliente.id,
              valor1: venda1 ? parseFloat(venda1.replace(",", ".")) : null,
              valor2: venda2 ? parseFloat(venda2.replace(",", ".")) : null,
              total: totalNum,
              mes,
              ano: 2025
            }
          })
        }
      }
    }
    console.log("Vendas imported!")
  }

  // Create monthly objectives for 2025
  const objetivos = [
    { mes: 1, objetivo: 11500 },
    { mes: 2, objetivo: 11000 },
    { mes: 3, objetivo: 14500 }
  ]

  for (const obj of objetivos) {
    await prisma.objetivoMensal.upsert({
      where: { mes_ano: { mes: obj.mes, ano: 2025 } },
      update: { objetivo: obj.objetivo },
      create: { mes: obj.mes, ano: 2025, objetivo: obj.objetivo }
    })
  }

  // Create quarterly objective
  await prisma.objetivoTrimestral.upsert({
    where: { trimestre_ano: { trimestre: 1, ano: 2025 } },
    update: { objetivo: 37000 },
    create: { trimestre: 1, ano: 2025, objetivo: 37000 }
  })

  console.log("Objectives created!")
  console.log("Seed completed!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
