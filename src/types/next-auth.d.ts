import { UserRole, UserStatus } from "@prisma/client"

declare module "next-auth" {
  interface User {
    id: string
    role: UserRole
    status: UserStatus
  }

  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      role: UserRole
      status: UserStatus
      // Impersonation fields
      impersonating?: {
        id: string
        name: string | null
        email: string
      }
      originalUserId?: string
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: UserRole
    status: UserStatus
    // Impersonation fields
    impersonating?: {
      id: string
      name: string | null
      email: string
    }
    originalUserId?: string
  }
}
