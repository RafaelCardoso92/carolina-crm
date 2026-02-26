"use client"

import { useState, useEffect } from "react"

interface SellerMood {
  seller: {
    id: string
    name: string | null
    email: string
  }
  today: number | null
  weekMoods: Record<string, number | null>
  weeklyAverage: number | null
  daysTracked: number
}

interface TeamMoodsData {
  teamMoods: SellerMood[]
  todayDate: string
  summary: {
    teamTodayAverage: number | null
    votedToday: number
    totalSellers: number
    participationRate: number
  }
}

const moodEmojis = ["", "😢", "😕", "😐", "🙂", "😄"]
const moodLabels = ["", "Muito Mal", "Mal", "Normal", "Bem", "Muito Bem"]
const moodColors = ["", "bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-lime-500", "bg-green-500"]

export default function TeamMoods() {
  const [data, setData] = useState<TeamMoodsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    fetchTeamMoods()
  }, [])

  async function fetchTeamMoods() {
    try {
      const res = await fetch("/api/mood/team")
      if (res.ok) {
        const moodData = await res.json()
        setData(moodData)
      }
    } catch (error) {
      console.error("Error fetching team moods:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-1/3 mb-4"></div>
          <div className="h-20 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  if (!data || data.teamMoods.length === 0) {
    return null
  }

  const dayNames = ["D", "S", "T", "Q", "Q", "S", "S"]
  const weekDates = Object.keys(data.teamMoods[0]?.weekMoods || {})

  // Separate sellers who voted today from those who didn't
  const votedToday = data.teamMoods.filter(s => s.today !== null)
  const notVotedToday = data.teamMoods.filter(s => s.today === null)

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-xl">
              <span className="text-xl">💜</span>
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Bem-Estar da Equipa</h3>
              <p className="text-sm text-muted-foreground">
                {data.summary.votedToday}/{data.summary.totalSellers} registaram hoje
              </p>
            </div>
          </div>
          {data.summary.teamTodayAverage !== null && (
            <div className="text-center">
              <div className="text-3xl">{moodEmojis[Math.round(data.summary.teamTodayAverage)]}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Media: {data.summary.teamTodayAverage.toFixed(1)}
              </p>
            </div>
          )}
        </div>

        {/* Participation bar */}
        <div className="mt-3">
          <div className="w-full bg-white/50 dark:bg-black/20 rounded-full h-2">
            <div
              className="h-2 rounded-full bg-purple-500 transition-all"
              style={{ width: data.summary.participationRate + "%" }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {data.summary.participationRate}% participacao
          </p>
        </div>
      </div>

      {/* Sellers who voted today */}
      {votedToday.length > 0 && (
        <div className="p-4 border-b border-border">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Registado Hoje
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {votedToday.map(seller => (
              <div
                key={seller.seller.id}
                className="flex items-center gap-2 p-2 rounded-lg bg-muted/30"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${moodColors[seller.today!]}`}>
                  <span className="text-sm">{moodEmojis[seller.today!]}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {seller.seller.name || seller.seller.email.split("@")[0]}
                  </p>
                  <p className="text-xs text-muted-foreground">{moodLabels[seller.today!]}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sellers who haven't voted */}
      {notVotedToday.length > 0 && (
        <div className="p-4 border-b border-border">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Ainda Nao Registado
          </p>
          <div className="flex flex-wrap gap-2">
            {notVotedToday.map(seller => (
              <span
                key={seller.seller.id}
                className="px-3 py-1 rounded-full bg-muted text-sm text-muted-foreground"
              >
                {seller.seller.name || seller.seller.email.split("@")[0]}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Weekly overview toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-3 flex items-center justify-between text-sm text-muted-foreground hover:bg-muted/30 transition"
      >
        <span>Ver historico semanal</span>
        <svg
          className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Weekly history */}
      {expanded && (
        <div className="p-4 bg-muted/20">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="pb-2 font-medium text-muted-foreground">Vendedor</th>
                  {weekDates.map(date => {
                    const dayIndex = new Date(date).getDay()
                    const isToday = date === data.todayDate
                    return (
                      <th
                        key={date}
                        className={`pb-2 text-center font-medium ${isToday ? "text-primary" : "text-muted-foreground"}`}
                      >
                        {dayNames[dayIndex]}
                      </th>
                    )
                  })}
                  <th className="pb-2 text-center font-medium text-muted-foreground">Media</th>
                </tr>
              </thead>
              <tbody>
                {data.teamMoods.map(seller => (
                  <tr key={seller.seller.id} className="border-t border-border">
                    <td className="py-2 font-medium">
                      {seller.seller.name || seller.seller.email.split("@")[0]}
                    </td>
                    {weekDates.map(date => {
                      const mood = seller.weekMoods[date]
                      const isToday = date === data.todayDate
                      return (
                        <td key={date} className="py-2 text-center">
                          <div
                            className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center text-sm ${
                              mood ? moodColors[mood] : "bg-muted"
                            } ${isToday ? "ring-2 ring-primary ring-offset-1" : ""}`}
                          >
                            {mood ? moodEmojis[mood] : "-"}
                          </div>
                        </td>
                      )
                    })}
                    <td className="py-2 text-center">
                      {seller.weeklyAverage !== null ? (
                        <span className="font-medium">{seller.weeklyAverage.toFixed(1)}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
