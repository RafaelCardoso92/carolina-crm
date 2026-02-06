import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

// This endpoint renews recurring campaigns to the next month
// Can be called by a cron job at the start of each month
// Or manually triggered from the UI

export async function POST(request: NextRequest) {
  try {
    // Optional: Add a secret key for cron job authentication
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    // If CRON_SECRET is set, validate it
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // Allow authenticated users too
      const { auth } = await import("@/lib/auth")
      const session = await auth()
      if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
    }

    const body = await request.json().catch(() => ({}))
    const targetMes = body.mes as number | undefined
    const targetAno = body.ano as number | undefined

    // Calculate current and next month
    const now = new Date()
    const currentMes = targetMes || now.getMonth() + 1
    const currentAno = targetAno || now.getFullYear()

    let nextMes = currentMes + 1
    let nextAno = currentAno
    if (nextMes > 12) {
      nextMes = 1
      nextAno++
    }

    // Find all recurring active campaigns for the current/previous month
    // that don't already exist in the next month
    const recurringCampanhas = await prisma.campanha.findMany({
      where: {
        recorrente: true,
        ativo: true,
        mes: currentMes,
        ano: currentAno,
      },
      include: {
        produtos: true,
      },
    })

    const results = {
      processed: 0,
      created: 0,
      skipped: 0,
      errors: 0,
      details: [] as { titulo: string; status: string; reason?: string }[],
    }

    for (const campanha of recurringCampanhas) {
      results.processed++

      // Check if a campaign with the same title already exists for next month
      const existing = await prisma.campanha.findFirst({
        where: {
          userId: campanha.userId,
          titulo: campanha.titulo,
          mes: nextMes,
          ano: nextAno,
        },
      })

      if (existing) {
        results.skipped++
        results.details.push({
          titulo: campanha.titulo,
          status: "skipped",
          reason: "Ja existe para o proximo mes",
        })
        continue
      }

      try {
        // Clone the campaign to the next month
        await prisma.campanha.create({
          data: {
            userId: campanha.userId,
            titulo: campanha.titulo,
            descricao: campanha.descricao,
            mes: nextMes,
            ano: nextAno,
            ativo: true,
            recorrente: true, // Keep it recurring
            produtos: {
              create: campanha.produtos.map((p) => ({
                produtoId: p.produtoId,
                nome: p.nome,
                precoUnit: p.precoUnit,
                quantidade: p.quantidade,
              })),
            },
          },
        })

        results.created++
        results.details.push({
          titulo: campanha.titulo,
          status: "created",
        })
      } catch (error) {
        console.error(`Error cloning campaign ${campanha.titulo}:`, error)
        results.errors++
        results.details.push({
          titulo: campanha.titulo,
          status: "error",
          reason: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Renovacao concluida: ${results.created} criadas, ${results.skipped} ignoradas`,
      fromMonth: `${currentMes}/${currentAno}`,
      toMonth: `${nextMes}/${nextAno}`,
      ...results,
    })
  } catch (error) {
    console.error("Error renewing campaigns:", error)
    return NextResponse.json(
      { error: "Erro ao renovar campanhas" },
      { status: 500 }
    )
  }
}

// GET endpoint to check which campaigns would be renewed
export async function GET(request: NextRequest) {
  try {
    const { auth } = await import("@/lib/auth")
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const mes = searchParams.get("mes") ? parseInt(searchParams.get("mes")!) : new Date().getMonth() + 1
    const ano = searchParams.get("ano") ? parseInt(searchParams.get("ano")!) : new Date().getFullYear()

    let nextMes = mes + 1
    let nextAno = ano
    if (nextMes > 12) {
      nextMes = 1
      nextAno++
    }

    // Get recurring campaigns that would be renewed
    const { userScopedWhere } = await import("@/lib/permissions")
    const userFilter = userScopedWhere(session)

    const recurringCampanhas = await prisma.campanha.findMany({
      where: {
        ...userFilter,
        recorrente: true,
        ativo: true,
        mes,
        ano,
      },
      select: {
        id: true,
        titulo: true,
        descricao: true,
        produtos: {
          select: { nome: true, precoUnit: true, quantidade: true },
        },
      },
    })

    // Check which ones already exist in the next month
    const nextMonthCampanhas = await prisma.campanha.findMany({
      where: {
        ...userFilter,
        mes: nextMes,
        ano: nextAno,
      },
      select: { titulo: true },
    })

    const existingTitles = new Set(nextMonthCampanhas.map((c) => c.titulo))

    const toRenew = recurringCampanhas.filter((c) => !existingTitles.has(c.titulo))
    const alreadyExists = recurringCampanhas.filter((c) => existingTitles.has(c.titulo))

    return NextResponse.json({
      currentMonth: `${mes}/${ano}`,
      nextMonth: `${nextMes}/${nextAno}`,
      toRenew,
      alreadyExists,
      totalRecurring: recurringCampanhas.length,
    })
  } catch (error) {
    console.error("Error checking campaigns:", error)
    return NextResponse.json(
      { error: "Erro ao verificar campanhas" },
      { status: 500 }
    )
  }
}
