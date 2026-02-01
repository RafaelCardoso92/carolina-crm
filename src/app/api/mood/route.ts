import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, getEffectiveUserId } from "@/lib/api-auth"

// Get today's date in YYYY-MM-DD format
function getToday() {
  const now = new Date()
  return now.toISOString().split("T")[0]
}

// Get dates for the last 7 days
function getLast7Days() {
  const dates = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    dates.push(date.toISOString().split("T")[0])
  }
  return dates
}

export async function GET() {
  try {
    const session = await requireAuth()
    const userId = getEffectiveUserId(session)
    const today = getToday()
    const last7Days = getLast7Days()

    // Get today's mood for this user
    const todayMood = await prisma.moodEntry.findUnique({
      where: { userId_date: { userId, date: today } }
    })

    // Get last 7 days of moods for this user
    const weekMoods = await prisma.moodEntry.findMany({
      where: {
        userId,
        date: { in: last7Days }
      },
      orderBy: { date: "asc" }
    })

    // Create a map of date -> rating
    const moodMap: Record<string, number | null> = {}
    last7Days.forEach(date => {
      const entry = weekMoods.find(m => m.date === date)
      moodMap[date] = entry ? entry.rating : null
    })

    // Calculate weekly average
    const ratings = weekMoods.map(m => m.rating)
    const weeklyAverage = ratings.length > 0
      ? Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length * 10) / 10
      : null

    return NextResponse.json({
      today: todayMood?.rating || null,
      todayDate: today,
      weekMoods: moodMap,
      weeklyAverage,
      daysTracked: ratings.length
    })
  } catch (error) {
    if (error instanceof NextResponse) {
      return error
    }
    console.error("Error fetching mood:", error)
    return NextResponse.json({ error: "Erro ao carregar humor" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth()
    const userId = getEffectiveUserId(session)
    const { rating } = await request.json()
    const today = getToday()

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating deve ser entre 1 e 5" }, { status: 400 })
    }

    // Check if already voted today
    const existing = await prisma.moodEntry.findUnique({
      where: { userId_date: { userId, date: today } }
    })

    if (existing) {
      return NextResponse.json({ error: "Ja votaste hoje!" }, { status: 400 })
    }

    // Create new mood entry
    const mood = await prisma.moodEntry.create({
      data: {
        userId,
        date: today,
        rating
      }
    })

    return NextResponse.json({ success: true, mood })
  } catch (error) {
    if (error instanceof NextResponse) {
      return error
    }
    console.error("Error saving mood:", error)
    return NextResponse.json({ error: "Erro ao guardar humor" }, { status: 500 })
  }
}
