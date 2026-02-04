"use client"

import { useState, useEffect } from "react"

interface MoodData {
  today: number | null
  todayDate: string
  weekMoods: Record<string, number | null>
  weeklyAverage: number | null
  daysTracked: number
}

const moodEmojis = ["", "😢", "😕", "😐", "🙂", "😄"]
const moodLabels = ["", "Muito Mal", "Mal", "Normal", "Bem", "Muito Bem"]
const moodColors = ["", "bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-lime-500", "bg-green-500"]

interface MoodTrackerProps {
  compact?: boolean
}

export default function MoodTracker({ compact = false }: MoodTrackerProps) {
  const [data, setData] = useState<MoodData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hoveredRating, setHoveredRating] = useState<number | null>(null)

  useEffect(() => {
    fetchMood()
  }, [])

  async function fetchMood() {
    try {
      const res = await fetch("/api/mood")
      if (res.ok) {
        const moodData = await res.json()
        setData(moodData)
      }
    } catch (error) {
      console.error("Error fetching mood:", error)
    } finally {
      setLoading(false)
    }
  }

  async function submitMood(rating: number) {
    if (data?.today || saving) return

    setSaving(true)
    try {
      const res = await fetch("/api/mood", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating })
      })

      if (res.ok) {
        fetchMood()
      } else {
        const errorData = await res.json()
        alert(errorData.error || "Erro ao guardar")
      }
    } catch (error) {
      console.error("Error saving mood:", error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className={compact ? "bg-white/10 rounded-xl p-3" : "bg-card rounded-xl border border-border p-3"}>
        <div className="animate-pulse">
          <div className={compact ? "h-3 bg-white/20 rounded w-1/3 mb-2" : "h-3 bg-muted rounded w-1/3 mb-2"}></div>
          <div className={compact ? "h-6 bg-white/20 rounded" : "h-8 bg-muted rounded"}></div>
        </div>
      </div>
    )
  }

  if (!data) return null

  const weekDays = Object.entries(data.weekMoods)
  const dayNames = ["D", "S", "T", "Q", "Q", "S", "S"]

  if (compact) {
    return (
      <div className="bg-white/10 rounded-xl p-3">
        <p className="text-xs font-medium text-white/80 mb-2">Como te sentes?</p>
        {data.today ? (
          <div className="flex items-center gap-2">
            <span className="text-2xl">{moodEmojis[data.today]}</span>
            <span className="text-xs text-white/70">{moodLabels[data.today]}</span>
          </div>
        ) : (
          <div className="flex justify-between gap-1">
            {[1, 2, 3, 4, 5].map(rating => (
              <button
                key={rating}
                onClick={() => submitMood(rating)}
                disabled={saving}
                className="w-8 h-8 rounded-full flex items-center justify-center text-lg transition-all transform hover:scale-110 disabled:opacity-50 bg-white/10 hover:bg-white/20"
                title={moodLabels[rating]}
              >
                {moodEmojis[rating]}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-card rounded-xl border border-border p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-foreground">Como te sentes?</h3>
        {data.weeklyAverage !== null && (
          <span className="text-xs text-muted-foreground">
            Media: {data.weeklyAverage.toFixed(1)} {moodEmojis[Math.round(data.weeklyAverage)]}
          </span>
        )}
      </div>

      {data.today ? (
        <div className="flex items-center gap-3 py-1">
          <span className="text-3xl">{moodEmojis[data.today]}</span>
          <div>
            <p className="text-sm font-medium text-foreground">{moodLabels[data.today]}</p>
            <p className="text-xs text-muted-foreground">Humor de hoje registado</p>
          </div>
        </div>
      ) : (
        <div className="py-1">
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map(rating => (
              <button
                key={rating}
                onClick={() => submitMood(rating)}
                onMouseEnter={() => setHoveredRating(rating)}
                onMouseLeave={() => setHoveredRating(null)}
                disabled={saving}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-xl transition-all transform hover:scale-110 disabled:opacity-50 ${
                  hoveredRating === rating ? moodColors[rating] : "bg-muted"
                }`}
              >
                {moodEmojis[rating]}
              </button>
            ))}
          </div>
          {hoveredRating && (
            <p className="text-center text-xs text-muted-foreground mt-1">
              {moodLabels[hoveredRating]}
            </p>
          )}
        </div>
      )}

      <div className="mt-2 pt-2 border-t border-border">
        <div className="flex justify-between gap-0.5">
          {weekDays.map(([date, mood]) => {
            const dayIndex = new Date(date).getDay()
            const isToday = date === data.todayDate
            return (
              <div key={date} className="flex-1 text-center">
                <div className="text-[10px] text-muted-foreground mb-0.5">
                  {dayNames[dayIndex]}
                </div>
                <div
                  className={`w-6 h-6 mx-auto rounded-full flex items-center justify-center text-sm ${
                    mood ? moodColors[mood] : "bg-muted"
                  } ${isToday ? "ring-1 ring-primary ring-offset-1" : ""}`}
                >
                  {mood ? moodEmojis[mood] : "-"}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
