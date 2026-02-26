import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/api-auth"
import { PERMISSIONS } from "@/lib/permissions"

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
    // Only admins can view team moods
    await requirePermission(PERMISSIONS.VIEW_ALL_DATA)

    const today = getToday()
    const last7Days = getLast7Days()

    // Get all active sellers
    const sellers = await prisma.user.findMany({
      where: {
        role: "SELLER",
        status: "ACTIVE"
      },
      select: {
        id: true,
        name: true,
        email: true
      },
      orderBy: { name: "asc" }
    })

    // Get all mood entries for today
    const todayMoods = await prisma.moodEntry.findMany({
      where: {
        date: today,
        userId: { in: sellers.map(s => s.id) }
      }
    })

    // Get all mood entries for the last 7 days
    const weekMoods = await prisma.moodEntry.findMany({
      where: {
        date: { in: last7Days },
        userId: { in: sellers.map(s => s.id) }
      }
    })

    // Build response data
    const teamMoods = sellers.map(seller => {
      const todayMood = todayMoods.find(m => m.userId === seller.id)
      const sellerWeekMoods = weekMoods.filter(m => m.userId === seller.id)

      // Create week mood map
      const weekMoodMap: Record<string, number | null> = {}
      last7Days.forEach(date => {
        const entry = sellerWeekMoods.find(m => m.date === date)
        weekMoodMap[date] = entry ? entry.rating : null
      })

      // Calculate weekly average
      const ratings = sellerWeekMoods.map(m => m.rating)
      const weeklyAverage = ratings.length > 0
        ? Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length * 10) / 10
        : null

      return {
        seller: {
          id: seller.id,
          name: seller.name,
          email: seller.email
        },
        today: todayMood?.rating || null,
        weekMoods: weekMoodMap,
        weeklyAverage,
        daysTracked: ratings.length
      }
    })

    // Calculate team averages
    const allTodayRatings = todayMoods.map(m => m.rating)
    const teamTodayAverage = allTodayRatings.length > 0
      ? Math.round(allTodayRatings.reduce((a, b) => a + b, 0) / allTodayRatings.length * 10) / 10
      : null

    const votedToday = todayMoods.length
    const totalSellers = sellers.length

    return NextResponse.json({
      teamMoods,
      todayDate: today,
      summary: {
        teamTodayAverage,
        votedToday,
        totalSellers,
        participationRate: totalSellers > 0 ? Math.round((votedToday / totalSellers) * 100) : 0
      }
    })
  } catch (error) {
    if (error instanceof NextResponse) {
      return error
    }
    console.error("Error fetching team moods:", error)
    return NextResponse.json({ error: "Erro ao carregar humor da equipa" }, { status: 500 })
  }
}
