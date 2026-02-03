import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { stripe } from "@/lib/stripe"
import crypto from "crypto"
import Stripe from "stripe"

// Disable body parsing - we need the raw body for signature verification
export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET not configured")
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 })
  }

  try {
    const body = await request.text()
    const signature = request.headers.get("stripe-signature")

    if (!signature) {
      console.error("No Stripe signature found")
      return NextResponse.json({ error: "No signature" }, { status: 400 })
    }

    // Verify webhook signature - THIS IS CRITICAL FOR SECURITY
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error("Webhook signature verification failed:", err)
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    // Handle the event
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session

      // Get metadata
      const { purchaseId, userId, tokens, amountEur, securityHash } = session.metadata || {}

      if (!purchaseId || !userId || !tokens) {
        console.error("Missing metadata in webhook:", session.metadata)
        return NextResponse.json({ error: "Invalid metadata" }, { status: 400 })
      }

      // Verify security hash
      const expectedHash = crypto
        .createHmac("sha256", webhookSecret)
        .update(`${purchaseId}:${userId}:${tokens}`)
        .digest("hex")

      if (securityHash !== expectedHash) {
        console.error("Security hash mismatch - possible tampering attempt")
        return NextResponse.json({ error: "Security verification failed" }, { status: 400 })
      }

      // Verify purchase exists and is pending
      const purchase = await prisma.tokenPurchase.findUnique({
        where: { id: purchaseId }
      })

      if (!purchase) {
        console.error("Purchase not found:", purchaseId)
        return NextResponse.json({ error: "Purchase not found" }, { status: 400 })
      }

      if (purchase.status !== "PENDING") {
        console.log("Purchase already processed:", purchaseId)
        return NextResponse.json({ received: true })
      }

      // Verify purchase matches
      if (purchase.userId !== userId || purchase.tokens !== parseInt(tokens)) {
        console.error("Purchase mismatch:", { purchase, metadata: session.metadata })
        return NextResponse.json({ error: "Purchase mismatch" }, { status: 400 })
      }

      // All verifications passed - credit tokens atomically
      await prisma.$transaction(async (tx) => {
        // Update purchase status
        await tx.tokenPurchase.update({
          where: { id: purchaseId },
          data: {
            status: "COMPLETED",
            stripePaymentId: session.payment_intent as string,
            completedAt: new Date()
          }
        })

        // Credit tokens to user
        await tx.tokenBalance.upsert({
          where: { userId },
          create: {
            userId,
            tokensTotal: purchase.tokens,
            tokensUsed: 0
          },
          update: {
            tokensTotal: { increment: purchase.tokens }
          }
        })
      })

      console.log(`Successfully credited ${tokens} tokens to user ${userId}`)
    }

    // Handle failed/refunded payments
    if (event.type === "checkout.session.expired" || event.type === "charge.refunded") {
      const session = event.data.object as Stripe.Checkout.Session | Stripe.Charge
      
      let purchaseId: string | undefined
      if ("metadata" in session && session.metadata?.purchaseId) {
        purchaseId = session.metadata.purchaseId
      }

      if (purchaseId) {
        await prisma.tokenPurchase.update({
          where: { id: purchaseId },
          data: { 
            status: event.type === "charge.refunded" ? "REFUNDED" : "FAILED" 
          }
        })
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
  }
}
