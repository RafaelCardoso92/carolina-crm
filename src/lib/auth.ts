import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "./prisma"
import { authConfig } from "./auth.config"
import { UserRole, UserStatus } from "@prisma/client"

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
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
      }

      // Handle impersonation session updates
      if (trigger === "update" && session) {
        if (session.impersonating) {
          token.impersonating = session.impersonating
          token.originalUserId = token.originalUserId || token.id
        } else if (session.impersonating === null) {
          // Stop impersonating
          delete token.impersonating
          delete token.originalUserId
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
