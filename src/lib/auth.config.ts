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
      
      // Allow public files for PWA
      const isPublicFile = [
        "/manifest.json",
        "/sw.js",
        "/icon-192.png",
        "/icon-512.png"
      ].includes(nextUrl.pathname) || nextUrl.pathname.startsWith("/icons")

      if (isApiRoute || isPublicFile) {
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
