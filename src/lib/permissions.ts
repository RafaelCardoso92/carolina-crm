import { UserRole } from "@prisma/client"
import { Session } from "next-auth"

// Permission constants
export const PERMISSIONS = {
  // User management
  MANAGE_USERS: "manage_users",
  IMPERSONATE: "impersonate",

  // View all data (MASTERADMIN only)
  VIEW_ALL_DATA: "view_all_data",

  // Produtos (shared resource)
  PRODUTOS_READ: "produtos_read",
  PRODUTOS_WRITE: "produtos_write",

  // User-owned resources
  CLIENTES_READ: "clientes_read",
  CLIENTES_WRITE: "clientes_write",
  VENDAS_READ: "vendas_read",
  VENDAS_WRITE: "vendas_write",
  COBRANCAS_READ: "cobrancas_read",
  COBRANCAS_WRITE: "cobrancas_write",
  PROSPECTOS_READ: "prospectos_read",
  PROSPECTOS_WRITE: "prospectos_write",
  TAREFAS_READ: "tarefas_read",
  TAREFAS_WRITE: "tarefas_write",
  COMUNICACOES_READ: "comunicacoes_read",
  COMUNICACOES_WRITE: "comunicacoes_write",
  AMOSTRAS_READ: "amostras_read",
  AMOSTRAS_WRITE: "amostras_write",
  ORCAMENTOS_READ: "orcamentos_read",
  ORCAMENTOS_WRITE: "orcamentos_write",
  ROTAS_READ: "rotas_read",
  ROTAS_WRITE: "rotas_write",
  CAMPANHAS_READ: "campanhas_read",
  CAMPANHAS_WRITE: "campanhas_write",
  DASHBOARD_READ: "dashboard_read",
  DEFINICOES_READ: "definicoes_read",
  DEFINICOES_WRITE: "definicoes_write",
} as const

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

// Role permission mapping
// SELLER and ADMIN have the same permissions - full CRM access to their own data
// MASTERADMIN has additional permissions: user management, impersonation, view all data
const STANDARD_USER_PERMISSIONS: Permission[] = [
  PERMISSIONS.PRODUTOS_READ,
  PERMISSIONS.PRODUTOS_WRITE,
  PERMISSIONS.CLIENTES_READ,
  PERMISSIONS.CLIENTES_WRITE,
  PERMISSIONS.VENDAS_READ,
  PERMISSIONS.VENDAS_WRITE,
  PERMISSIONS.COBRANCAS_READ,
  PERMISSIONS.COBRANCAS_WRITE,
  PERMISSIONS.PROSPECTOS_READ,
  PERMISSIONS.PROSPECTOS_WRITE,
  PERMISSIONS.TAREFAS_READ,
  PERMISSIONS.TAREFAS_WRITE,
  PERMISSIONS.COMUNICACOES_READ,
  PERMISSIONS.COMUNICACOES_WRITE,
  PERMISSIONS.AMOSTRAS_READ,
  PERMISSIONS.AMOSTRAS_WRITE,
  PERMISSIONS.ORCAMENTOS_READ,
  PERMISSIONS.ORCAMENTOS_WRITE,
  PERMISSIONS.ROTAS_READ,
  PERMISSIONS.ROTAS_WRITE,
  PERMISSIONS.CAMPANHAS_READ,
  PERMISSIONS.CAMPANHAS_WRITE,
  PERMISSIONS.DASHBOARD_READ,
  PERMISSIONS.DEFINICOES_READ,
  PERMISSIONS.DEFINICOES_WRITE,
]

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  MASTERADMIN: Object.values(PERMISSIONS),
  ADMIN: STANDARD_USER_PERMISSIONS,
  SELLER: STANDARD_USER_PERMISSIONS,
}

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}

/**
 * Check if user can view all data (not just their own)
 */
export function canViewAllData(role: UserRole): boolean {
  return role === "MASTERADMIN"
}

/**
 * Get the effective user ID (handles impersonation)
 */
export function getEffectiveUserId(session: Session): string {
  return session.user.impersonating?.id ?? session.user.id
}

/**
 * Check if currently impersonating
 */
export function isImpersonating(session: Session): boolean {
  return !!session.user.impersonating
}

/**
 * Build a Prisma where clause scoped to user's data
 * MASTERADMIN sees all, others see only their own data
 * Returns a plain object that can be spread into any Prisma where clause
 */
export function userScopedWhere(session: Session): { userId?: string } {
  const role = session.user.role || "ADMIN"
  if (canViewAllData(role) && !session.user.impersonating) {
    return {} // No filtering for MASTERADMIN (unless impersonating)
  }
  return { userId: getEffectiveUserId(session) }
}

/**
 * Routes that each role can access
 * SELLER and ADMIN have the same routes - full CRM access
 * MASTERADMIN additionally has /admin for user management
 */
const STANDARD_USER_ROUTES = [
  "/",
  "/clientes",
  "/vendas",
  "/cobrancas",
  "/prospectos",
  "/reconciliacao",
  "/tarefas",
  "/definicoes",
  "/produtos",
  "/rotas",
  "/orcamentos",
  "/campanhas",
]

export const ROLE_ROUTES: Record<UserRole, string[]> = {
  MASTERADMIN: [
    ...STANDARD_USER_ROUTES,
    "/admin",
  ],
  ADMIN: STANDARD_USER_ROUTES,
  SELLER: STANDARD_USER_ROUTES,
}

/**
 * Check if a role can access a specific route
 */
export function canAccessRoute(role: UserRole, pathname: string): boolean {
  const allowedRoutes = ROLE_ROUTES[role] || []
  return allowedRoutes.some(route =>
    pathname === route || pathname.startsWith(route + "/")
  )
}
