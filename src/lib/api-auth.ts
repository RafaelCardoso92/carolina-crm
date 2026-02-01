import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { Permission, hasPermission, getEffectiveUserId, userScopedWhere, canViewAllData } from "./permissions"
import { UserRole } from "@prisma/client"
import { Session } from "next-auth"

/**
 * Standard unauthorized response
 */
export function unauthorized() {
  return NextResponse.json(
    { error: "Não autenticado" },
    { status: 401 }
  )
}

/**
 * Standard forbidden response
 */
export function forbidden() {
  return NextResponse.json(
    { error: "Sem permissão" },
    { status: 403 }
  )
}

/**
 * Get authenticated session or return null
 */
export async function getAuthSession(): Promise<Session | null> {
  return await auth()
}

/**
 * Require authentication - returns session or throws unauthorized response
 */
export async function requireAuth(): Promise<Session> {
  const session = await auth()
  if (!session?.user) {
    throw unauthorized()
  }
  return session
}

/**
 * Require specific permission - returns session or throws forbidden response
 */
export async function requirePermission(permission: Permission): Promise<Session> {
  const session = await requireAuth()
  // Default to ADMIN role if not set (for backwards compatibility with old sessions)
  const role = session.user.role || "ADMIN"
  if (!hasPermission(role, permission)) {
    throw forbidden()
  }
  // Ensure the session has the role for downstream code
  session.user.role = role
  return session
}

/**
 * Require one of the specified roles
 */
export async function requireRole(roles: UserRole[]): Promise<Session> {
  const session = await requireAuth()
  if (!roles.includes(session.user.role)) {
    throw forbidden()
  }
  return session
}

/**
 * Helper type for API route handlers
 */
export type AuthenticatedHandler = (
  request: Request,
  session: Session
) => Promise<Response>

/**
 * Wrapper for API routes that require authentication
 * Catches the thrown responses and returns them
 */
export function withAuth(handler: AuthenticatedHandler) {
  return async (request: Request) => {
    try {
      const session = await requireAuth()
      return await handler(request, session)
    } catch (error) {
      if (error instanceof NextResponse) {
        return error
      }
      throw error
    }
  }
}

/**
 * Wrapper for API routes that require a specific permission
 */
export function withPermission(permission: Permission, handler: AuthenticatedHandler) {
  return async (request: Request) => {
    try {
      const session = await requirePermission(permission)
      return await handler(request, session)
    } catch (error) {
      if (error instanceof NextResponse) {
        return error
      }
      throw error
    }
  }
}

// Re-export useful functions from permissions
export { getEffectiveUserId, userScopedWhere, canViewAllData, hasPermission }
