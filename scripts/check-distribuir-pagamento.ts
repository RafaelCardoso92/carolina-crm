// Run: npx tsx scripts/check-distribuir-pagamento.ts
import assert from "node:assert/strict"
import { distribuirPagamento } from "../src/lib/cobranca-valores"

const ps = [
  { id: "a", numero: 1, valor: 98.43, pago: false, valorPago: null },
  { id: "b", numero: 2, valor: 98.42, pago: false, valorPago: null },
]
// 100 on a 2x98 invoice: first paid, 1.57 carried to the second
assert.deepEqual(distribuirPagamento(ps, 100), [
  { id: "a", valorPago: 98.43, pago: true },
  { id: "b", valorPago: 1.57, pago: false },
])
// smaller amount stays on the first open parcela
assert.deepEqual(distribuirPagamento(ps, 50), [{ id: "a", valorPago: 50, pago: false }])
// existing partial is topped up, paid parcelas skipped
assert.deepEqual(
  distribuirPagamento([{ ...ps[0], pago: true, valorPago: 98.43 }, { ...ps[1], valorPago: 20 }], 78.42),
  [{ id: "b", valorPago: 98.42, pago: true }]
)
// exact total pays everything; more than owed or zero is refused
assert.equal(distribuirPagamento(ps, 196.85)?.every(p => p.pago), true)
assert.equal(distribuirPagamento(ps, 196.86), null)
assert.equal(distribuirPagamento(ps, 0), null)
console.log("distribuirPagamento ok")
