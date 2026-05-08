# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Deployment model — NOT K8s

This project is **Docker Compose**, not Kubernetes. The wider server (`/home/ubuntu/CLAUDE.md`) defaults to `ops deploy`; that workflow does NOT apply here. There is no `k8s.yaml`. Deploy/restart with `docker compose` from the project root.

- Live at `https://carolina.rafaelcardoso.co.uk` (paid client: Carolina, Portuguese sales rep CRM).
- Cloudflared tunnel routes the hostname directly to the host port `172.17.0.1:3001` (the `proxy` external Docker network is referenced but inbound traffic does not go through K3s Traefik). See `/home/ubuntu/CLAUDE.md` "carolina pattern" for the tunnel-to-host-port routing.
- Two services in `docker-compose.yml`: `db` (Postgres 14 on host port `5436`, volume `carolina_data`) and `app` (Next.js standalone, `3001:3000`). Uploads bind-mounted `./uploads → /uploads`.
- Build args bake `NEXT_PUBLIC_*` into the bundle. The Dockerfile copies `.env` into the builder stage on purpose — client-side env vars (e.g. `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`) must exist in `.env` at build time, not just at runtime.

## Commands

Run from `~/projects/carolina-crm/`.

```bash
# Dev (hot reload, talks to the Dockerized DB on localhost:5436)
npm run dev                          # next dev — http://localhost:3000

# DB schema / data
npx prisma generate                  # regen client after schema.prisma changes
npx prisma migrate dev --name <msg>  # create+apply migration locally
npx prisma db push                   # push schema without a migration (use sparingly)
npm run seed                         # tsx prisma/seed.ts — creates default users

# Lint / build
npm run lint                         # eslint (flat config in eslint.config.mjs)
npm run build                        # next build (output: standalone)

# Production deploy on this host
docker compose build app && docker compose up -d app
docker compose logs -f app
docker compose restart app

# DB shell
docker compose exec db psql -U carolina -d carolina_crm
# or from host:
PGPASSWORD=carolina123 psql -h localhost -p 5436 -U carolina -d carolina_crm

# Ad-hoc TS scripts (use tsx, not ts-node)
npx tsx scripts/import-data.ts
npx tsx scripts/import-vendas.ts
npx tsx check-campanhas.ts
```

There are no automated tests in this repo — `package.json` has no `test` script. Don't add one without asking.

## Stack

Next.js 16 (App Router, `output: "standalone"`) + React 19 + TypeScript + Tailwind v4 + Prisma 5.22 + Postgres 14 + NextAuth v5 beta (Credentials provider, JWT sessions) + bcryptjs.

External integrations: OpenAI, Google Gemini (`AI_PROVIDER` env switches), Stripe (live keys in `.env`), Resend (email), Google Maps (`@react-google-maps/api`), pdfkit + pdf-parse + poppler-utils (PDFs), `@napi-rs/canvas`, `xlsx`.

Note: `package.json` has `"name": "baborette"` — legacy, do not "fix" it. The AI agent inside the app is also called **Baborella** (`src/lib/baborella/`).

## Architecture

### Route groups (App Router)

- `src/app/(auth)/` — `login`, `esqueci-password`, `repor-password`. Public.
- `src/app/(dashboard)/` — every authenticated UI page (clientes, vendas, cobrancas, prospectos, tarefas, rotas, mapa, orcamentos, comissoes, reconciliacao, definicoes, admin, etc.). All wrapped by `(dashboard)/layout.tsx` which mounts `Sidebar` + `ImpersonationBanner` + `BaborellaGlobal`.
- `src/app/api/` — ~50 route folders. Names are Portuguese (vendas, cobranças, prospectos, tarefas, etc.) — match the dashboard route names.

### Auth + permissions (the part most code touches)

`src/middleware.ts` runs `auth()` from `next-auth` on most paths; the matcher explicitly excludes `_next`, PWA assets, `api/auth/*`, `api/pwa/*`, `api/reconciliacao*`, and the public auth pages.

`src/lib/auth.config.ts` does the route-level gate (calls `canAccessRoute(role, pathname)`). `src/lib/auth.ts` adds the Credentials provider, JWT/session callbacks, and the **impersonation** mechanism — admins can `update()` the session with `{ impersonating: { id, name, email } }` and the JWT keeps `originalUserId` so `getEffectiveUserId()` returns the impersonated user for data scoping. `ImpersonationLog` model audits every impersonation.

Three roles (`UserRole` enum): `MASTERADMIN` > `ADMIN` > `SELLER`. Permissions are constants in `src/lib/permissions.ts`. Use the helpers in `src/lib/api-auth.ts` from API routes:

- `requireAuth()` — throws a `NextResponse` (401) if not logged in.
- `requirePermission(PERMISSIONS.X)` — throws 403 if missing.
- `userScopedWhere(session, selectedSellerId?)` — returns `{}` for ADMIN/MASTERADMIN viewing all data, `{ userId: <effectiveId> }` for SELLER. **Always merge this into Prisma `where` for any user-owned resource** (Cliente, Venda, Prospecto, Tarefa, Amostra, Orcamento, Comunicacao, RotaSalva, Campanha, ObjetivoVario, Despesa, Visita, etc.). Don't query without it or admins-as-sellers see leak across users.
- ADMIN can use the seller-filter dropdown (`SellerFilterContext`) to view a specific seller's data; the `selectedSellerId` query param feeds `userScopedWhere`.

API responses go through `apiSuccess` / `apiError` in `src/lib/api-response.ts` (handles `Cache-Control` headers, structured error shape).

### Prisma data model — Portuguese domain language

Schema is in Portuguese. Core entities:
- **User** owns: `Cliente`, `Prospecto`, `Tarefa`, `Comunicacao`, `Amostra`, `Orcamento`, `RotaSalva`, `Campanha`, `Visita`, `Despesa`, `MoodEntry`, `ObjetivoVario`, `UserFile`, plus all reconciliation/commission rows.
- **Venda → ItemVenda → Produto** (sales lines).
- **Cobranca → Parcela** (collections / installments — installments are the source of truth for paid-vs-pending).
- **Devolucao → ItemDevolucao + ImagemDevolucao** (returns).
- **Reconciliacao{Mensal,Comissoes} → ItemReconciliacao{,Comissao}** (monthly recon + commission recon, each with its own discrepancy enum).
- **Objetivo{Mensal,Trimestral,Anual,Vario,VarioMeta,NovosClientesAnual,NovosClientesTrimestral}** + `Premio{Mensal,Trimestral,Anual}` (sales targets and bonuses — there are many tiers, don't collapse them).
- **AI tables**: `ClienteInsight`, `AIInsight`, `CobrancaRisk`, `ProdutoInsight`, `BaborellaChat`, `BaborellaAction`, `BaborellaSession`, `TokenBalance`, `TokenUsage`, `TokenPurchase`, `TokenAllocation`.
- **Historical rate tables**: `HistoricoIVA`, `HistoricoComissao`, `HistoricoComissaoVendedor`. Always read rates via `src/lib/iva.ts` (`getIVAForDate`) and `src/lib/comissao.ts` (`getComissaoForDate` / per-seller variants) — never hard-code 23% IVA or 3.5% commission. Rates are date-banded (`dataInicio`/`dataFim`); the lookup picks the row active on the given date.

### Baborella AI agent (`src/lib/baborella/`)

In-app assistant exposed as a chat widget. Architecture:
- `registry.ts` — tool registry. Tools live in `tools/{clientes,cobrancas,global,mapa,prospectos,rotas,tarefas,vendas}.ts`.
- `executor.ts` — two-step execution: `createPendingAction` for write operations (writes `BaborellaAction` row, requires user approval), `executeToolDirectly` for reads. `approveAndExecuteAction` / `rejectAction` finalize.
- `prompts.ts` — system prompt + approval prompt builder.
- `context.ts` — `buildEnhancedContext` injects current entity (cliente/venda/etc.) into the prompt.
- `session.ts` — chat history persistence.
- AI provider switch is via `AI_PROVIDER` env (`gemini` default; `openai` also wired). `src/lib/ai.ts` has an in-memory 1h response cache and per-user token accounting via `TokenBalance`/`TokenUsage`.

When adding a new write capability for the agent, register a tool AND ensure it goes through `createPendingAction`, not direct execution. Approval is a hard requirement — that's why every action is logged in `BaborellaAction` with status (`PENDING`/`APPROVED`/`REJECTED`/`EXECUTED`).

### Files / uploads

`UPLOADS_DIR` env (`/uploads` in container, `/home/ubuntu/carolina-crm/uploads` in dev) is bind-mounted. Files go through `/api/files` and the `UserFile` table tracks ownership + scoping. PDF text extraction uses `pdf-parse` + `poppler-utils` (installed in the runner stage of the Dockerfile).

## Conventions worth knowing

- **Language**: domain code, DB columns, UI strings, and API paths are all in Portuguese (PT-PT). Don't translate them.
- **`getEffectiveUserId(session)`** is the right id for "whose data is this" — it returns the impersonated user when impersonating, the original user otherwise. Use it instead of `session.user.id` for ownership writes.
- **Cache layer** (`src/lib/cache.ts`) is in-memory with TTL + tag invalidation. Designed to be swappable for Redis later — don't reach for Redis yet.
- **Standalone output**: `next.config.ts` sets `output: "standalone"` so the Dockerfile only copies `.next/standalone` + `.next/static` + `public` + Prisma client. If you add a runtime dependency that needs files outside `node_modules`, add an explicit `COPY` in the Dockerfile.
- **Migrations vs db push**: prefer `prisma migrate dev` for any schema change that needs to land in production. The `migrations/` folder is the source of truth — `db push` skips it and will diverge.
- **Seeding**: `prisma/seed.ts` upserts default user(s) (including `carolina` / `carolina123`). Safe to re-run.
- **Stripe keys in `.env` are LIVE.** Don't commit, don't run test scripts that hit `stripe.charges.*` without a clear reason.
