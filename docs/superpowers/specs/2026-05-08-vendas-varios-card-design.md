# Varios summary card on /vendas

**Date:** 2026-05-08
**Status:** Approved (verbally), pending spec review
**Scope:** Single UI card + server query addition

## Problem

The `/vendas` page surfaces individual sales but treats objetivos varios only as a small purple badge on each row. The total `objetivoVarioValor` for each objetivo this month, the progress against its `ObjetivoVarioMeta`, and the count of contributing sales aren't visible anywhere on this page. Users need to click into `/objetivos-varios` to see them — friction during the daily review of monthly performance.

## Solution

Add one summary card to the existing summary-cards row at the top of `/vendas`, alongside `Total Mês` / `Objetivo` / `Trimestre`. Card shows per-objetivo progress for the page's current `mes`/`ano` only.

### Card contents
- Header: `Varios ({mes}/{ano})` + count of objetivos shown + sum of all `objetivoVarioValor` this period.
- Per-objetivo row:
  - `titulo`
  - `totalVendido` / `metaValor` (or `—` if no meta set)
  - Percentage bar (capped at 100% visually, label may show >100%)
  - Count of contributing sales as muted secondary text
- Empty state: `Sem objetivos varios este mês` when none active in (mes, ano).
- Each row is a link to `/objetivos-varios#<objetivoId>` — existing page already renders the full detail.

### Data shape (new prop on VendasView)
```ts
variosProgress: Array<{
  id: string
  titulo: string
  totalVendido: number   // sum of objetivoVarioValor across vendas linked
  metaValor: number | null  // from ObjetivoVarioMeta for (mes, ano), null if unset
  count: number          // number of vendas contributing
}>
```

### Server query
In `src/app/(dashboard)/vendas/page.tsx`, extend `getVendasData` to compute the prop. Use the data already fetched (`vendas` filter + `objetivosVarios`); add one query for `ObjetivoVarioMeta` filtered by `(mes, ano)`. No change to `/api/objetivos-varios/vendas` — that endpoint stays as-is for `/objetivos-varios`.

### Filter rule
Show every `ObjetivoVario` where `ativo = true` AND `(mes, ano) = page's (mes, ano)`. Other-period active objetivos hide. (Aligns with the page's monthly framing.)

## Out of scope

- No change to `venda.total` math — `objetivoVarioValor` stays separate as today.
- No change to the existing per-row purple badge.
- No change to the `Total Mês` / `Trimestre` cards' totals.
- No new API route; no DB migration.
- No filter/edit UI inside the card.

## Files touched

| File | Change |
|---|---|
| `src/app/(dashboard)/vendas/page.tsx` | extend `getVendasData` to fetch `ObjetivoVarioMeta` for the period and aggregate `variosProgress`; pass to `VendasView` |
| `src/app/(dashboard)/vendas/VariosCard.tsx` | new client component, render-only |
| `src/app/(dashboard)/vendas/VendasView.tsx` | accept `variosProgress` prop, render `<VariosCard>` in the existing summary-cards row |

Estimated diff: ~120 LOC.

## Acceptance check

- /vendas for current month shows the new card.
- Card shows every active varios for that mes/ano with progress.
- Clicking a row navigates to `/objetivos-varios` and the relevant objetivo is targeted via URL hash.
- If no varios active: empty-state copy renders, no broken layout.
- No regression in existing summary cards or sales table.
