// Pure money rules for cobranças (client-safe: no prisma import).
// Parcelas are the source of truth when they exist.

type Num = unknown // number | string | Prisma Decimal | null (anything Number() understands)
type Data = Date | string | null | undefined

export type ParcelaValores = { valor: Num; pago: boolean; valorPago?: Num; dataPago?: Data; dataVencimento?: Data }
export type CobrancaValores = {
  valor: Num
  pago: boolean
  valorPago?: Num
  dataPago?: Data
  dataVencimento?: Data
  parcelas?: ParcelaValores[]
}

const n = (v: Num) => Number(v ?? 0) || 0
const cent = (v: number) => Math.round(v * 100) / 100

export function valorPagoParcela(p: ParcelaValores): number {
  return p.pago ? n(p.valor) : n(p.valorPago)
}

/** What has actually been paid on a cobrança. */
export function valorPagoCobranca(c: CobrancaValores): number {
  if (c.parcelas && c.parcelas.length > 0) return cent(c.parcelas.reduce((s, p) => s + valorPagoParcela(p), 0))
  return c.pago ? n(c.valor) : n(c.valorPago)
}

export function valorPendenteCobranca(c: CobrancaValores): number {
  if (c.pago) return 0 // paid = settled, even if old parcelas are a cent off the total
  return Math.max(0, cent(n(c.valor) - valorPagoCobranca(c)))
}

export function estadoPorValores(valor: number, valorPago: number, pago: boolean): "PAGO" | "PARCIAL" | "PENDENTE" {
  if (pago) return "PAGO"
  if (valorPago > 0 && valorPago < valor) return "PARCIAL"
  return "PENDENTE"
}

/** Due strictly before today (something due today is not overdue yet). */
export function venceuAntesDeHoje(dataVencimento: Data, hoje: Date = new Date()): boolean {
  if (!dataVencimento) return false
  const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
  return new Date(dataVencimento) < inicioHoje
}

/** Overdue amount and count: unpaid parcelas past due, or the cobrança itself when it has no parcelas. */
export function emAtraso(c: CobrancaValores, hoje: Date = new Date()): { valor: number; count: number } {
  if (c.parcelas && c.parcelas.length > 0) {
    const atrasadas = c.parcelas.filter(p => !p.pago && venceuAntesDeHoje(p.dataVencimento, hoje))
    return { valor: cent(atrasadas.reduce((s, p) => s + n(p.valor) - n(p.valorPago), 0)), count: atrasadas.length }
  }
  if (c.pago || !venceuAntesDeHoje(c.dataVencimento, hoje)) return { valor: 0, count: 0 }
  return { valor: valorPendenteCobranca(c), count: 1 }
}

/** Amount paid within a calendar month (mes 0-11), by payment date. */
export function pagoNoMes(c: CobrancaValores, ano: number, mes: number): number {
  const noMes = (d: Data) => {
    if (!d) return false
    const x = new Date(d)
    return x.getFullYear() === ano && x.getMonth() === mes
  }
  if (c.parcelas && c.parcelas.length > 0) {
    return cent(c.parcelas.filter(p => noMes(p.dataPago)).reduce((s, p) => s + valorPagoParcela(p), 0))
  }
  return noMes(c.dataPago) ? valorPagoCobranca(c) : 0
}

/** Commission earned so far, proportional to what was paid. */
export function comissaoGanha(c: { valor: Num; comissao?: Num }, pago: number): number {
  const valor = n(c.valor)
  return valor > 0 ? n(c.comissao) * Math.min(1, pago / valor) : 0
}

// Cliente has no payment-terms field: single-payment cobranças from a sale fall due 30 days after emission
export const PRAZO_VENCIMENTO_DIAS = 30
export function vencimentoPagamentoUnico(numeroParcelas: number, dataEmissao: Date): { prazoVencimentoDias?: number; dataVencimento?: Date } {
  if (numeroParcelas > 1) return {}
  const dataVencimento = new Date(dataEmissao)
  dataVencimento.setDate(dataVencimento.getDate() + PRAZO_VENCIMENTO_DIAS)
  return { prazoVencimentoDias: PRAZO_VENCIMENTO_DIAS, dataVencimento }
}
