import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { stripe, MIN_PURCHASE_EUR, calculateTokens, formatTokens } from "@/lib/stripe"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!stripe) {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 500 })
    }

    const body = await request.json()
    const { amount } = body

    // Validate amount
    const amountEur = parseFloat(amount)
    if (isNaN(amountEur) || amountEur < MIN_PURCHASE_EUR) {
      return NextResponse.json({ 
        error: `Minimum purchase is €${MIN_PURCHASE_EUR}` 
      }, { status: 400 })
    }

    // Cap at reasonable maximum
    if (amountEur > 1000) {
      return NextResponse.json({ 
        error: "Maximum single purchase is €1000" 
      }, { status: 400 })
    }

    const tokens = calculateTokens(amountEur)
    const userId = session.user.id

    // Generate a secure idempotency key
    const idempotencyKey = crypto.randomBytes(16).toString("hex")

    // Create pending purchase record FIRST (for security)
    const purchase = await prisma.tokenPurchase.create({
      data: {
        userId,
        tokens,
        amountEur,
        status: "PENDING"
      }
    })

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: "AI Tokens",
              description: `${formatTokens(tokens)} tokens for AI features`,
            },
            unit_amount: Math.round(amountEur * 100), // Stripe uses cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXTAUTH_URL || "https://carolina.rafaelcardoso.co.uk"}/definicoes?tab=tokens&success=true`,
      cancel_url: `${process.env.NEXTAUTH_URL || "https://carolina.rafaelcardoso.co.uk"}/definicoes?tab=tokens&canceled=true`,
      customer_email: session.user.email,
      metadata: {
        purchaseId: purchase.id,
        userId: userId,
        tokens: tokens.toString(),
        amountEur: amountEur.toString(),
        // Security hash to verify webhook
        securityHash: crypto
          .createHmac("sha256", process.env.STRIPE_WEBHOOK_SECRET || "fallback")
          .update(`${purchase.id}:${userId}:${tokens}`)
          .digest("hex")
      },
    }, {
      idempotencyKey
    })

    // Update purchase with Stripe session ID
    await prisma.tokenPurchase.update({
      where: { id: purchase.id },
      data: { stripeSessionId: checkoutSession.id }
    })

    return NextResponse.json({ 
      url: checkoutSession.url,
      sessionId: checkoutSession.id
    })
  } catch (error) {
    console.error("Error creating checkout session:", error)
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 })
  }
}
