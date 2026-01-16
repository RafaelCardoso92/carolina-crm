import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "./prisma"
import { authConfig } from "./auth.config"
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from "./rate-limit"

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

        // Get IP for rate limiting (use email as fallback identifier)
        const identifier = credentials.email as string

        // Check rate limit
        const rateCheck = checkRateLimit(identifier)
        if (!rateCheck.allowed) {
          throw new Error(`Too many attempts. Try again in ${rateCheck.blockedFor} minutes.`)
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string }
        })

        if (!user) {
          recordFailedAttempt(identifier)
          return null
        }

        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!passwordMatch) {
          const result = recordFailedAttempt(identifier)
          if (result.blocked) {
            throw new Error(`Too many failed attempts. Account locked for ${result.blockedFor} minutes.`)
          }
          return null
        }

        // Successful login - reset rate limit
        resetRateLimit(identifier)

        return {
          id: user.id,
          email: user.email,
          name: user.name
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
      }
      return session
    }
  }
})
