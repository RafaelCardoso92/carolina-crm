import type { NextAuthConfig } from "next-auth"
import { canAccessRoute } from "./permissions"
import { UserRole } from "@prisma/client"

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login"
  },
  providers: [], // Added in auth.ts
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const pathname = nextUrl.pathname
      const userRole = auth?.user?.role as UserRole | undefined

      // Allow public files for PWA
      const publicPaths = [
        "/manifest.json",
        "/sw.js",
        "/icon-192.png",
        "/icon-512.png",
        "/favicon.ico"
      ]

      // Check if path is a public file
      if (publicPaths.some(p => pathname === p || pathname.endsWith(p))) {
        return true
      }

      // Check if path starts with icons
      if (pathname.startsWith("/icons")) {
        return true
      }

      // Allow API routes (they handle their own auth)
      if (pathname.startsWith("/api")) {
        return true
      }

      // Allow login page
      if (pathname === "/login") {
        if (isLoggedIn) {
          return Response.redirect(new URL("/", nextUrl))
        }
        return true
      }

      // All other routes require authentication
      if (!isLoggedIn) {
        return false // Will redirect to login
      }

      // Check role-based access
      if (userRole && !canAccessRoute(userRole, pathname)) {
        // Redirect to home if user doesn't have access
        return Response.redirect(new URL("/", nextUrl))
      }

      return true
    }
  }
}
