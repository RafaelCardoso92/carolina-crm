import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "./prisma"
import { authConfig } from "./auth.config"
import { UserRole, UserStatus } from "@prisma/client"
import type { Session } from "next-auth"
import { canImpersonateUser } from "./permissions"
import { checkRateLimit } from "./rate-limit"

// How often the jwt callback re-reads the user's status/role from the DB
const USER_RECHECK_MS = 5 * 60 * 1000

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // 10 attempts / 15 min per IP+email (skipped when the IP is unknown)
        const email = String(credentials.email).toLowerCase().trim()
        if (!checkRateLimit(request, email, "login").allowed) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string }
        })

        if (!user) {
          return null
        }

        // Check user status - only ACTIVE users can login
        if (user.status !== "ACTIVE") {
          return null
        }

        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!passwordMatch) {
          return null
        }

        // Update last login time
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() }
        })

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status
        }
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.role = user.role as UserRole
        token.status = user.status as UserStatus
        token.checkedAt = Date.now()
      }

      // Re-check status/role from DB at most every USER_RECHECK_MS; inactive/deleted -> invalidate
      if (!user && token.id && Date.now() - ((token.checkedAt as number | undefined) ?? 0) > USER_RECHECK_MS) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, status: true }
        })
        if (!dbUser || dbUser.status !== "ACTIVE") return null
        token.role = dbUser.role
        token.status = dbUser.status
        token.checkedAt = Date.now()
      }

      // Handle impersonation session updates. The client only says WHO; the server re-validates.
      if (trigger === "update" && session) {
        if (session.impersonating === null) {
          // Stop impersonating
          delete token.impersonating
          delete token.originalUserId
        } else if (session.impersonating) {
          const targetId = typeof session.impersonating.id === "string" ? session.impersonating.id : ""
          const actor = { user: { id: token.id as string, role: token.role } } as Session
          const target = targetId
            ? await prisma.user.findUnique({
                where: { id: targetId },
                select: { id: true, name: true, email: true }
              })
            : null
          if (target && await canImpersonateUser(actor, target.id, prisma)) {
            token.impersonating = target
            token.originalUserId = token.id
          }
          // else: rejected, token left unchanged
        }
      }

      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as UserRole
        session.user.status = token.status as UserStatus

        // Include impersonation info in session
        if (token.impersonating) {
          session.user.impersonating = token.impersonating as {
            id: string
            name: string | null
            email: string
          }
          session.user.originalUserId = token.originalUserId as string
        }
      }
      return session
    }
  }
})
