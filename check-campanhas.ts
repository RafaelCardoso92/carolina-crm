import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function check() {
  const campanhas = await prisma.campanha.findMany({
    select: { id: true, titulo: true, mes: true, ano: true, ativo: true, recorrente: true },
    orderBy: [{ ano: "desc" }, { mes: "desc" }]
  })
  console.log("All campaigns:")
  console.log(JSON.stringify(campanhas, null, 2))
  console.log(`\nTotal: ${campanhas.length}`)

  // Group by month
  const byMonth: Record<string, number> = {}
  campanhas.forEach(c => {
    const key = `${c.mes}/${c.ano}`
    byMonth[key] = (byMonth[key] || 0) + 1
  })
  console.log("\nBy month:", byMonth)

  await prisma.$disconnect()
}

check()
