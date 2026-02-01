import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import crypto from "crypto"
import { sendPasswordResetEmail } from "@/lib/email"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email e obrigatorio" }, { status: 400 })
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    })

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({ success: true })
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex")
    const resetTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex")

    // Set token expiry to 1 hour from now
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000)

    // Save token to user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetTokenHash,
        resetPasswordExpires: resetExpires
      }
    })

    // Build reset URL
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
    const resetUrl = `${baseUrl}/repor-password?token=${resetToken}`

    // Log the reset URL for development
    console.log("=================================")
    console.log("PASSWORD RESET LINK:")
    console.log(resetUrl)
    console.log("=================================")

    // Send email if Resend is configured
    if (process.env.RESEND_API_KEY) {
      const result = await sendPasswordResetEmail(user.email, resetUrl)
      if (!result.success) {
        console.error("Failed to send email:", result.error)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in forgot-password:", error)
    return NextResponse.json({ error: "Ocorreu um erro" }, { status: 500 })
  }
}
