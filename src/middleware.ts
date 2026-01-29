import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"

const { auth } = NextAuth(authConfig)

export default auth

export const config = {
  // Exclude PWA files, static files, and auth routes from middleware
  matcher: [
    "/((?!_next/static|_next/image|manifest\\.json|sw\\.js|icon-.*|icons/.*|favicon\\.ico|api/pwa/.*|api/auth/.*).*)"
  ],
}
