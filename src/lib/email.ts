import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@baboretes.com"

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: `Baboretes <${FROM_EMAIL}>`,
      to: email,
      subject: "Repor Password - Baboretes",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb; margin: 0; padding: 40px 20px;">
          <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
            <h1 style="color: #111827; font-size: 24px; font-weight: bold; margin: 0 0 24px; text-align: center;">
              Baboretes
            </h1>

            <p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 16px;">
              Recebemos um pedido para repor a password da sua conta.
            </p>

            <p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 24px;">
              Clique no botao abaixo para criar uma nova password:
            </p>

            <div style="text-align: center; margin: 32px 0;">
              <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(to right, #b8860b, #a67c00); color: white; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 12px;">
                Repor Password
              </a>
            </div>

            <p style="color: #6b7280; font-size: 14px; line-height: 20px; margin: 24px 0 0;">
              Este link expira em 1 hora. Se nao pediu para repor a password, ignore este email.
            </p>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">

            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
              Baboretes &copy; ${new Date().getFullYear()}
            </p>
          </div>
        </body>
        </html>
      `
    })

    if (error) {
      console.error("Resend error:", error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Email sending error:", error)
    return { success: false, error }
  }
}
