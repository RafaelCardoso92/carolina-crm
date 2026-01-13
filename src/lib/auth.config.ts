import type { NextAuthConfig } from "next-auth"

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login"
  },
  providers: [], // Added in auth.ts
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isLoginPage = nextUrl.pathname === "/login"
      const isApiRoute = nextUrl.pathname.startsWith("/api")

      if (isApiRoute) {
        return true
      }

      if (!isLoggedIn && !isLoginPage) {
        return false // Will redirect to login
      }

      if (isLoggedIn && isLoginPage) {
        return Response.redirect(new URL("/", nextUrl))
      }

      return true
    }
  }
}
