import { prisma } from "@/lib/prisma"

const DEFAULT_IVA_RATE = 23

/**
 * Get the IVA rate that was active on a specific date
 * @param date - The date to check (defaults to today)
 * @returns The IVA percentage (e.g., 23 for 23%)
 */
export async function getIVAForDate(date: Date = new Date()): Promise<number> {
  try {
    // Find the rate that was active on this date
    // Active means: dataInicio <= date AND (dataFim >= date OR dataFim is null)
    const rate = await prisma.historicoIVA.findFirst({
      where: {
        dataInicio: { lte: date },
        OR: [
          { dataFim: { gte: date } },
          { dataFim: null }
        ]
      },
      orderBy: { dataInicio: "desc" }
    })

    if (rate) {
      return Number(rate.percentagem)
    }

    // Fallback to config or default
    const config = await prisma.configuracao.findUnique({
      where: { chave: "IVA_PERCENTAGEM" }
    })

    if (config) {
      return parseFloat(config.valor) || DEFAULT_IVA_RATE
    }

    return DEFAULT_IVA_RATE
  } catch (error) {
    console.error("Error getting IVA rate for date:", error)
    return DEFAULT_IVA_RATE
  }
}

/**
 * Get the current active IVA rate
 * @returns The current IVA percentage
 */
export async function getIVAAtual(): Promise<number> {
  return getIVAForDate(new Date())
}

/**
 * Calculate value without IVA based on the rate active on a specific date
 * @param valorComIva - The value with IVA
 * @param date - The date to use for rate lookup
 * @returns The value without IVA
 */
export async function calcularValorSemIVA(valorComIva: number, date: Date = new Date()): Promise<number> {
  const rate = await getIVAForDate(date)
  return Math.round((valorComIva / (1 + rate / 100)) * 100) / 100
}

/**
 * Calculate value with IVA based on the rate active on a specific date
 * @param valorSemIva - The value without IVA
 * @param date - The date to use for rate lookup
 * @returns The value with IVA
 */
export async function calcularValorComIVA(valorSemIva: number, date: Date = new Date()): Promise<number> {
  const rate = await getIVAForDate(date)
  return Math.round(valorSemIva * (1 + rate / 100) * 100) / 100
}

/**
 * Get IVA rate for a specific month/year (uses the first day of the month)
 * @param mes - Month (1-12)
 * @param ano - Year
 * @returns The IVA percentage
 */
export async function getIVAForMonth(mes: number, ano: number): Promise<number> {
  const date = new Date(ano, mes - 1, 1)
  return getIVAForDate(date)
}
