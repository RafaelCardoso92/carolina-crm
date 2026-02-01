import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import crypto from "crypto"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")

    if (!token) {
      return NextResponse.json({ valid: false })
    }

    // Hash the token to compare with stored hash
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex")

    // Find user with this token that hasn't expired
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: tokenHash,
        resetPasswordExpires: {
          gt: new Date()
        }
      }
    })

    return NextResponse.json({ valid: !!user })
  } catch (error) {
    console.error("Error validating reset token:", error)
    return NextResponse.json({ valid: false })
  }
}
