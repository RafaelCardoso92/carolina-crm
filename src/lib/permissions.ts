import { UserRole } from "@prisma/client"
import { Session } from "next-auth"

// Permission constants
export const PERMISSIONS = {
  // User management
  MANAGE_USERS: "manage_users",
  MANAGE_SELLERS: "manage_sellers",
  IMPERSONATE: "impersonate",

  // View all data (ADMIN and MASTERADMIN)
  VIEW_ALL_DATA: "view_all_data",

  // System settings (MASTERADMIN only)
  SYSTEM_SETTINGS: "system_settings",

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

// SELLER permissions - full CRM access to their own data
const SELLER_PERMISSIONS: Permission[] = [
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

// ADMIN permissions - can view all sellers' data
const ADMIN_PERMISSIONS: Permission[] = [
  ...SELLER_PERMISSIONS,
  PERMISSIONS.VIEW_ALL_DATA,
]

// MASTERADMIN (Developer) - everything including system management
const MASTERADMIN_PERMISSIONS: Permission[] = [
  ...ADMIN_PERMISSIONS,
  PERMISSIONS.MANAGE_USERS,
  PERMISSIONS.IMPERSONATE,
  PERMISSIONS.SYSTEM_SETTINGS,
]

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  MASTERADMIN: MASTERADMIN_PERMISSIONS,
  ADMIN: ADMIN_PERMISSIONS,
  SELLER: SELLER_PERMISSIONS,
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
  return role === "MASTERADMIN" || role === "ADMIN"
}

/**
 * Check if user is a seller (sees only their own data)
 */
export function isSeller(role: UserRole): boolean {
  return role === "SELLER"
}

/**
 * Check if user is admin or higher
 */
export function isAdminOrHigher(role: UserRole): boolean {
  return role === "ADMIN" || role === "MASTERADMIN"
}

/**
 * Check if user is developer (MASTERADMIN)
 */
export function isDeveloper(role: UserRole): boolean {
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
 * ADMIN/MASTERADMIN see all (or filtered by selectedSellerId), SELLER sees only their own
 * Returns a plain object that can be spread into any Prisma where clause
 */
export function userScopedWhere(session: Session, selectedSellerId?: string | null): { userId?: string } {
  const role = session.user.role || "SELLER"
  
  // If impersonating, always filter by impersonated user
  if (session.user.impersonating) {
    return { userId: session.user.impersonating.id }
  }
  
  // If admin/masteradmin viewing all data
  if (canViewAllData(role)) {
    // If a specific seller is selected, filter by that seller
    if (selectedSellerId) {
      return { userId: selectedSellerId }
    }
    // Otherwise show all data (no userId filter)
    return {}
  }
  
  // Regular sellers see only their own data
  return { userId: session.user.id }
}

/**
 * Routes that each role can access
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
  "/ficheiros",
]

export const ROLE_ROUTES: Record<UserRole, string[]> = {
  MASTERADMIN: [
    ...STANDARD_USER_ROUTES,
    "/admin",
    "/developer",
  ],
  ADMIN: [
    ...STANDARD_USER_ROUTES,
    "/admin",
  ],
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
