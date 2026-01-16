import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const { auth } = NextAuth(authConfig)

// Public paths that don't need authentication
const publicPaths = [
  "/manifest.json",
  "/sw.js",
  "/favicon.ico",
  "/icon-192.png",
  "/icon-512.png"
]

function isPublicPath(pathname: string): boolean {
  return publicPaths.includes(pathname) || 
         pathname.startsWith("/icons") ||
         pathname.startsWith("/_next") ||
         pathname.startsWith("/api/auth")
}

export default async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const isPublic = isPublicPath(pathname)
  
  // Create a response with debug headers
  if (isPublic) {
    const response = NextResponse.next()
    response.headers.set("X-MW-Path", pathname)
    response.headers.set("X-MW-IsPublic", "true")
    return response
  }
  
  // For auth paths, we can only add headers by wrapping the response
  // but auth() doesn't return a response we can modify easily
  // So just return auth and rely on the path not being public
  const authResult = await auth(request as any)
  
  // Try to add our debug header to the auth response
  // This might work if authResult is a Response object
  if (authResult instanceof Response) {
    const newHeaders = new Headers(authResult.headers)
    newHeaders.set("X-MW-Path", pathname)
    newHeaders.set("X-MW-IsPublic", "false")
    return new Response(authResult.body, {
      status: authResult.status,
      statusText: authResult.statusText,
      headers: newHeaders
    })
  }
  
  return authResult
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"]
}
