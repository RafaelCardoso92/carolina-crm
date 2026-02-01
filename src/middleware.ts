import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"

const { auth } = NextAuth(authConfig)

export async function middleware(request: NextRequest) {
  // All other routes go through auth
  return auth(request as any)
}

export const config = {
  // Exclude PWA files, static files, auth routes, and public auth pages from middleware
  matcher: [
    "/((?!_next/static|_next/image|manifest\\.json|sw\\.js|icon-.*|icons/.*|favicon\\.ico|api/pwa/.*|api/auth/.*|login|esqueci-password|repor-password).*)"
  ],
}
