import type { NextAuthConfig } from "next-auth"

export const authConfig: NextAuthConfig = {
  trustHost: true,
  pages: {
    signIn: "/login"
  },
  providers: [], // Added in auth.ts
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const pathname = nextUrl.pathname
      
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
      
      // Allow API routes
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

      return true
    }
  }
}
