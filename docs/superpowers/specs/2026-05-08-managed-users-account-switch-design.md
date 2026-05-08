# Managed users + account switcher

**Date:** 2026-05-08
**Status:** Approved (verbally), pending spec review
**Scope:** Schema change + permission relaxation + sidebar UI

## Problem

Catarina is a Carolina-managed account. Two requirements:

1. Catarina must not be able to log in directly (her account exists only so her data is partitioned under her own `userId`).
2. Carolina, while logged in as herself, must be able to switch to viewing/working as Catarina without admin privileges.

## Solution

Reuse the existing impersonation pipeline (`/api/admin/impersonate` + JWT `impersonating` + `getEffectiveUserId` + `userScopedWhere` + `ImpersonationBanner`). Two additions:

- A new self-referential FK `User.managedByUserId` records the manager-managed relationship.
- A new permission rule: a user may impersonate a target if the target's `managedByUserId === me.id`, in addition to the existing `IMPERSONATE` permission held by ADMIN/MASTERADMIN.

Catarina's `status` is set to `INACTIVE` so the existing login-time check (`auth.ts: status !== "ACTIVE" → null`) blocks direct login.

### Schema change

```prisma
model User {
  // ...existing fields...
  managedByUserId String?
  managedBy       User?   @relation("ManagedUsers", fields: [managedByUserId], references: [id], onDelete: SetNull)
  managedUsers    User[]  @relation("ManagedUsers")
  @@index([managedByUserId])
}
```

One nullable column + one index. No data deleted, no existing value migrated.

### Data

```sql
-- Catarina becomes managed by Carolina and blocked from login
UPDATE "User"
   SET "managedByUserId" = '<carolina.id>',
       status = 'INACTIVE'
 WHERE id = 'catarina-seller-001';
```

### Backend

**New helper** in `src/lib/permissions.ts`:
```ts
export async function canImpersonateUser(
  session: Session,
  targetUserId: string
): Promise<boolean>
```
Returns `true` if:
- session role grants `PERMISSIONS.IMPERSONATE` (existing admin path), OR
- `prisma.user.findUnique({ where: { id: targetUserId } }).managedByUserId === session.user.id`

The endpoint also rejects self-impersonation (already does today).

**Modified `POST /api/admin/impersonate`:**
- Replace `requirePermission(PERMISSIONS.IMPERSONATE)` with `requireAuth()` + `canImpersonateUser(session, userId)` (returns 403 on false).
- Audit log unchanged — every impersonation is recorded in `ImpersonationLog` regardless of path.

**New endpoint `GET /api/me/managed-users`:**
- Returns `[{ id, name, email, status }]` of users where `managedByUserId === session.user.id`.
- Used by the sidebar widget to know whether to render and what options to show.
- Empty array → widget doesn't render.

### UI

**New component `src/components/AccountSwitcher.tsx`** (client, ~80 LOC):
- On mount, fetches `/api/me/managed-users` once.
- If the list is empty, renders nothing (no visual change for users without managed accounts).
- Otherwise renders a small button in the sidebar above "Sair":
  - Shows current effective name (e.g. "Carolina" when self, "Catarina" when impersonating).
  - Caret opens a popover listing: own account first, then each managed user.
  - Clicking own account → `DELETE /api/admin/impersonate` then `updateSession({ impersonating: null })` then `router.refresh()`.
  - Clicking a managed user → `POST /api/admin/impersonate { userId }` then `updateSession({ impersonating: ... })` then `router.refresh()`.

**Sidebar integration** (`src/components/Sidebar.tsx`): mount `<AccountSwitcher />` directly above the existing logout button. Hidden by the component itself when there are no managed users — Sidebar.tsx doesn't need a conditional.

**ImpersonationBanner fix** (`src/components/ImpersonationBanner.tsx`): the "Parar" handler currently redirects to `/admin/usuarios`. Sellers can't access that route (it 403s). Change to `router.push("/")` after stopping; admin users see the dashboard, the dashboard is fine for everyone.

### Login behavior on logout

Logout clears the JWT. Next login goes through `authorize()` from scratch, which never sets `impersonating`. So a Carolina-impersonating-Catarina session, when logged out and Carolina logs back in, returns to her own account. No additional code.

## Out of scope

- No bulk admin UI for assigning `managedByUserId` (set Catarina manually via SQL; can be added to admin UI later).
- No multi-level chains (managed account managing another managed account). The schema allows it; the impersonate check only walks one level.
- Catarina's data continues to live under her own `userId`. We are not merging or moving rows.
- No change to who CAN'T log in beyond Catarina — only her status flips to INACTIVE in this rollout.

## Files touched

| File | Change |
|---|---|
| `prisma/schema.prisma` | add `managedByUserId` + self-relation + index |
| `prisma/migrations/<ts>_add_managed_users/migration.sql` | column + index + FK |
| `src/lib/permissions.ts` | new `canImpersonateUser(session, targetUserId)` helper |
| `src/app/api/admin/impersonate/route.ts` | replace permission check with `canImpersonateUser` |
| `src/app/api/me/managed-users/route.ts` | new GET endpoint |
| `src/components/AccountSwitcher.tsx` | new client component |
| `src/components/Sidebar.tsx` | mount AccountSwitcher above logout |
| `src/components/ImpersonationBanner.tsx` | post-stop redirect → `/` |
| (DB run-once) | UPDATE Catarina: set `managedByUserId`, `status='INACTIVE'` |

Estimated diff: ~200 LOC + 1 migration.

## Acceptance check

- Catarina cannot log in (`status = INACTIVE`; auth returns null).
- Carolina logs in normally.
- Carolina sees the account switcher in the sidebar with "Catarina" listed.
- Clicking "Catarina" — banner appears red, vendas/clientes/cobranças list shows Catarina's data, all writes apply to Catarina.
- Clicking "Carolina (eu)" or banner "Parar" — returns to Carolina's data.
- A user without any managed users sees no switcher.
- An ADMIN/MASTERADMIN's existing impersonation flow still works.
- `ImpersonationLog` records every switch.

## Security check

- Catarina's `INACTIVE` status — no code path lets an INACTIVE user open a session via `authorize()`.
- The impersonate endpoint never returns the target's password or other secrets — already only returns `id, name, email`.
- A managed user can never impersonate their manager — `canImpersonateUser` only allows impersonator → target where target is managed by impersonator. The reverse direction is implicitly denied.
- Log integrity: every successful POST writes to `ImpersonationLog` before returning the session payload.
