import type { Prisma } from "@prisma/client"
import { getComissaoVendedorForDate } from "@/lib/comissao"
import { getIVAForDate } from "@/lib/iva"
import { valorPagoCobranca } from "@/lib/cobranca-valores"

type Tx = Prisma.TransactionClient

/**
 * Re-derive valorPago / pago / estado / dataPago of a cobrança from its parcelas.
 * Returns false (and changes nothing) when the cobrança has no parcelas.
 */
export async function recalcularEstadoCobranca(tx: Tx, cobrancaId: string): Promise<boolean> {
  const parcelas = await tx.parcela.findMany({
    where: { cobrancaId },
    select: { valor: true, pago: true, valorPago: true, dataPago: true }
  })
  if (parcelas.length === 0) return false

  const valorPago = valorPagoCobranca({ valor: 0, pago: false, parcelas })
  const pago = parcelas.every(p => p.pago)
  const ultimaData = parcelas
    .map(p => p.dataPago)
    .filter((d): d is Date => !!d)
    .sort((a, b) => b.getTime() - a.getTime())[0]

  await tx.cobranca.update({
    where: { id: cobrancaId },
    data: {
      valorPago,
      pago,
      estado: pago ? "PAGO" : valorPago > 0 ? "PARCIAL" : "PENDENTE",
      dataPago: pago ? (ultimaData ?? new Date()) : null
    }
  })
  return true
}

/**
 * Set a new total on a cobrança: recompute valorSemIva (IVA at emission date, unless given) and comissao
 * (seller rate at emission date), and spread the change in valor over the UNPAID parcelas (last one absorbs cents).
 * Paid parcelas are never touched. Then re-derive the estado.
 */
export async function ajustarValorCobranca(tx: Tx, cobrancaId: string, novoValor: number, valorSemIva?: number) {
  const c = await tx.cobranca.findUniqueOrThrow({
    where: { id: cobrancaId },
    select: {
      valor: true, dataEmissao: true, createdAt: true,
      cliente: { select: { userId: true } },
      parcelas: { select: { id: true, valor: true, pago: true, valorPago: true }, orderBy: { numero: "asc" } }
    }
  })
  const data = c.dataEmissao ?? c.createdAt
  novoValor = Math.max(0, Math.round(novoValor * 100) / 100)
  const semIva = valorSemIva ?? Math.round((novoValor / (1 + (await getIVAForDate(data)) / 100)) * 100) / 100
  const rate = c.cliente.userId ? await getComissaoVendedorForDate(c.cliente.userId, data) : 0
  const comissao = Math.round(semIva * (rate / 100) * 100) / 100

  const diferenca = Math.round((novoValor - Number(c.valor)) * 100) / 100
  if (c.parcelas.length > 0 && diferenca !== 0) {
    const abertas = c.parcelas.filter(p => !p.pago)
    if (abertas.length === 0) throw new Error("PARCELAS_PAGAS")
    const cada = Math.round((diferenca / abertas.length) * 100) / 100
    for (let i = 0; i < abertas.length; i++) {
      const parte = i === abertas.length - 1 ? diferenca - cada * (abertas.length - 1) : cada
      const valor = Math.round((Number(abertas[i].valor) + parte) * 100) / 100
      // A parcela can't drop below what was already paid on it
      if (valor < Number(abertas[i].valorPago ?? 0) || valor < 0) throw new Error("PARCELAS_PAGAS")
      await tx.parcela.update({ where: { id: abertas[i].id }, data: { valor } })
    }
  }

  await tx.cobranca.update({
    where: { id: cobrancaId },
    data: { valor: novoValor, valorSemIva: semIva, comissao }
  })

  if (!(await recalcularEstadoCobranca(tx, cobrancaId))) {
    const atual = await tx.cobranca.findUniqueOrThrow({ where: { id: cobrancaId }, select: { pago: true, valorPago: true } })
    const vp = Number(atual.valorPago ?? 0)
    await tx.cobranca.update({
      where: { id: cobrancaId },
      data: { estado: atual.pago ? "PAGO" : vp > 0 && vp < novoValor ? "PARCIAL" : "PENDENTE" }
    })
  }
}

/** Undo the cobrança reduction made by a credit note (incidência.cobrancaId is only set when it reduced it). */
export async function restaurarCobrancaDaIncidencia(tx: Tx, incidencia: { cobrancaId: string | null; valor: Prisma.Decimal }) {
  if (!incidencia.cobrancaId) return
  const c = await tx.cobranca.findUnique({ where: { id: incidencia.cobrancaId }, select: { valor: true } })
  if (c) await ajustarValorCobranca(tx, incidencia.cobrancaId, Number(c.valor) + Number(incidencia.valor))
}

/** Message for the PARCELAS_PAGAS error thrown above. */
export const MSG_PARCELAS_PAGAS =
  "O novo valor não cabe nas parcelas por pagar desta cobrança (as parcelas já pagas não podem ser alteradas)."
