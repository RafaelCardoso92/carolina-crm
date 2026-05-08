"use client"

import Link from "next/link"

export type VariosProgressItem = {
  id: string
  titulo: string
  totalVendido: number
  metaValor: number | null
  count: number
}

type Props = {
  items: VariosProgressItem[]
  mes: number
  ano: number
  meses: string[]
}

function formatCurrency(value: number) {
  return value.toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function VariosCard({ items, mes, ano, meses }: Props) {
  if (items.length === 0) return null

  const totalSomado = items.reduce((sum, i) => sum + i.totalVendido, 0)

  return (
    <div className="rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50/40 dark:bg-purple-900/10 p-4 mb-4 md:mb-6">
      <div className="flex items-center justify-between mb-3 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <svg className="w-5 h-5 flex-shrink-0 text-purple-600 dark:text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V9m4 8V5m4 12v-4M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <h3 className="text-sm font-bold uppercase tracking-wide text-purple-700 dark:text-purple-200 truncate">
            Varios — {meses[mes]} {ano}
          </h3>
        </div>
        <span className="text-xs text-purple-700/80 dark:text-purple-200/80 flex-shrink-0">
          {items.length} {items.length === 1 ? "objetivo" : "objetivos"} · {formatCurrency(totalSomado)} EUR
        </span>
      </div>

      <ul className="space-y-2">
        {items.map(item => {
          const meta = item.metaValor
          const pct = meta && meta > 0 ? (item.totalVendido / meta) * 100 : null
          const reachedMeta = pct !== null && pct >= 100
          return (
            <li key={item.id}>
              <Link
                href={`/objetivos-varios#${item.id}`}
                className="block rounded-lg bg-white dark:bg-card border border-border hover:border-purple-300 dark:hover:border-purple-700 transition p-3"
              >
                <div className="flex items-baseline justify-between gap-2 mb-1.5">
                  <span className="text-sm font-medium text-foreground truncate">{item.titulo}</span>
                  <span className="text-xs flex-shrink-0">
                    <span className={`font-semibold ${reachedMeta ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"}`}>
                      {formatCurrency(item.totalVendido)} EUR
                    </span>
                    {meta !== null ? (
                      <span className="text-muted-foreground"> / {formatCurrency(meta)} EUR</span>
                    ) : (
                      <span className="text-muted-foreground"> · sem meta</span>
                    )}
                  </span>
                </div>

                {meta !== null && meta > 0 && (
                  <div className="w-full bg-muted/60 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        reachedMeta
                          ? "bg-gradient-to-r from-emerald-500 to-green-500"
                          : "bg-gradient-to-r from-purple-500 to-fuchsia-500"
                      }`}
                      style={{ width: `${Math.min(pct!, 100)}%` }}
                    />
                  </div>
                )}

                <div className="flex items-center justify-between mt-1.5 text-[11px] text-muted-foreground">
                  <span>
                    {item.count === 0
                      ? "ainda sem vendas associadas"
                      : `${item.count} ${item.count === 1 ? "venda" : "vendas"} associadas`}
                  </span>
                  {pct !== null && (
                    <span className={`font-medium ${reachedMeta ? "text-emerald-600 dark:text-emerald-400" : "text-purple-700 dark:text-purple-300"}`}>
                      {pct.toFixed(0)}%
                    </span>
                  )}
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
