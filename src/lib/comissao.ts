import { prisma } from "@/lib/prisma"

const DEFAULT_COMMISSION_RATE = 3.5

/**
 * Get the commission rate that was active on a specific date
 * @param date - The date to check (defaults to today)
 * @returns The commission percentage (e.g., 3.5 for 3.5%)
 */
export async function getComissaoForDate(date: Date = new Date()): Promise<number> {
  try {
    // Find the rate that was active on this date
    // Active means: dataInicio <= date AND (dataFim >= date OR dataFim is null)
    const rate = await prisma.historicoComissao.findFirst({
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
      where: { chave: "COMISSAO_PERCENTAGEM" }
    })

    if (config) {
      return parseFloat(config.valor) || DEFAULT_COMMISSION_RATE
    }

    return DEFAULT_COMMISSION_RATE
  } catch (error) {
    console.error("Error getting commission rate for date:", error)
    return DEFAULT_COMMISSION_RATE
  }
}

/**
 * Get the current active commission rate
 * @returns The current commission percentage
 */
export async function getComissaoAtual(): Promise<number> {
  return getComissaoForDate(new Date())
}

/**
 * Calculate commission amount based on value and the rate active on a specific date
 * @param valorSemIva - The value without IVA
 * @param date - The date to use for rate lookup
 * @returns The commission amount
 */
export async function calcularComissao(valorSemIva: number, date: Date = new Date()): Promise<number> {
  const rate = await getComissaoForDate(date)
  return Math.round(valorSemIva * (rate / 100) * 100) / 100
}

/**
 * Get commission rate for a specific month/year (uses the first day of the month)
 * @param mes - Month (1-12)
 * @param ano - Year
 * @returns The commission percentage
 */
export async function getComissaoForMonth(mes: number, ano: number): Promise<number> {
  const date = new Date(ano, mes - 1, 1)
  return getComissaoForDate(date)
}
