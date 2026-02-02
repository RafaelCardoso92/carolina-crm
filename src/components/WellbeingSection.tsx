"use client"

import { useState, useEffect, useRef } from "react"
import MoodTracker from "./MoodTracker"
import DailyQuote from "./DailyQuote"

const quickTips = [
  { icon: "🧘", text: "Faz uma pausa de 5 minutos. Levanta-te e estica o corpo." },
  { icon: "💧", text: "Bebe um copo de agua. A hidratacao ajuda a concentracao." },
  { icon: "🌬️", text: "Respira fundo 3 vezes. Inspira pelo nariz, expira pela boca." },
  { icon: "🚶", text: "Da uma pequena caminhada. Movimentar-te ajuda a clarear a mente." },
  { icon: "☀️", text: "Abre uma janela ou vai la fora. Luz natural melhora o humor." },
  { icon: "🎵", text: "Ouve uma musica que gostes. A musica pode aliviar o stress." },
  { icon: "📵", text: "Desliga notificacoes por 30 minutos. Foca-te numa tarefa de cada vez." },
  { icon: "🙏", text: "Pensa em 3 coisas pelas quais estas grato hoje." },
  { icon: "💪", text: "Celebra as pequenas vitorias. Cada passo conta." },
  { icon: "🌿", text: "Olha para algo verde. A natureza acalma a mente." },
]

const affirmations = [
  "Sou capaz de superar qualquer desafio.",
  "O meu trabalho tem valor e faz a diferenca.",
  "Mereco ter sucesso e felicidade.",
  "Cada dia e uma nova oportunidade.",
  "Estou a dar o meu melhor e isso e suficiente.",
  "Os obstaculos sao oportunidades disfarçadas.",
  "Tenho a forca necessaria para continuar.",
  "O meu potencial e ilimitado.",
  "Sou resiliente e adaptavel.",
  "O progresso importa mais que a perfeicao.",
]

export default function WellbeingSection() {
  const [showBreathing, setShowBreathing] = useState(false)
  const [breathPhase, setBreathPhase] = useState<"inhale" | "hold" | "exhale" | "rest">("inhale")
  const [breathCount, setBreathCount] = useState(0)
  const [breathTimer, setBreathTimer] = useState(4)
  const [isBreathing, setIsBreathing] = useState(false)
  const [currentTip, setCurrentTip] = useState(0)
  const [currentAffirmation, setCurrentAffirmation] = useState(0)
  const [showTips, setShowTips] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Random tip and affirmation on load
    setCurrentTip(Math.floor(Math.random() * quickTips.length))
    setCurrentAffirmation(Math.floor(Math.random() * affirmations.length))
  }, [])

  useEffect(() => {
    if (!isBreathing) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    intervalRef.current = setInterval(() => {
      setBreathTimer(prev => {
        if (prev <= 1) {
          // Move to next phase
          setBreathPhase(current => {
            if (current === "inhale") return "hold"
            if (current === "hold") return "exhale"
            if (current === "exhale") {
              setBreathCount(c => c + 1)
              return "rest"
            }
            return "inhale"
          })
          // Reset timer based on phase
          return breathPhase === "inhale" ? 4 : breathPhase === "hold" ? 4 : breathPhase === "exhale" ? 4 : 2
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isBreathing, breathPhase])

  function startBreathing() {
    setIsBreathing(true)
    setBreathPhase("inhale")
    setBreathTimer(4)
    setBreathCount(0)
  }

  function stopBreathing() {
    setIsBreathing(false)
    setBreathPhase("inhale")
    setBreathTimer(4)
  }

  function nextTip() {
    setCurrentTip(prev => (prev + 1) % quickTips.length)
  }

  function nextAffirmation() {
    setCurrentAffirmation(prev => (prev + 1) % affirmations.length)
  }

  const phaseText = {
    inhale: "Inspira...",
    hold: "Segura...",
    exhale: "Expira...",
    rest: "Relaxa..."
  }

  const phaseColor = {
    inhale: "text-blue-500",
    hold: "text-amber-500",
    exhale: "text-green-500",
    rest: "text-purple-500"
  }

  return (
    <div className="space-y-3">
      {/* Main row: Quote + Mood */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <DailyQuote />
        <MoodTracker />
      </div>

      {/* Wellbeing Tools */}
      <div className="bg-card rounded-2xl border border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <span className="text-lg">💚</span>
            Bem-Estar
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => { setShowBreathing(!showBreathing); setShowTips(false); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                showBreathing ? "bg-primary text-white" : "bg-secondary text-foreground hover:bg-primary/10"
              }`}
            >
              🌬️ Respiracao
            </button>
            <button
              onClick={() => { setShowTips(!showTips); setShowBreathing(false); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                showTips ? "bg-primary text-white" : "bg-secondary text-foreground hover:bg-primary/10"
              }`}
            >
              💡 Dicas
            </button>
          </div>
        </div>

        {/* Default: Quick tip + Affirmation */}
        {!showBreathing && !showTips && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Quick Tip */}
            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <span className="text-xl">{quickTips[currentTip].icon}</span>
                  <p className="text-sm text-foreground">{quickTips[currentTip].text}</p>
                </div>
                <button
                  onClick={nextTip}
                  className="shrink-0 p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/50 transition"
                  title="Outra dica"
                >
                  <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Affirmation */}
            <div className="bg-purple-50 dark:bg-purple-950/30 rounded-xl p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <span className="text-xl">✨</span>
                  <p className="text-sm text-foreground italic">&quot;{affirmations[currentAffirmation]}&quot;</p>
                </div>
                <button
                  onClick={nextAffirmation}
                  className="shrink-0 p-1 rounded hover:bg-purple-100 dark:hover:bg-purple-900/50 transition"
                  title="Outra afirmacao"
                >
                  <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Breathing Exercise */}
        {showBreathing && (
          <div className="text-center py-4">
            {!isBreathing ? (
              <div>
                <p className="text-sm text-muted-foreground mb-3">
                  Exercicio de respiracao 4-4-4-2 para acalmar a mente
                </p>
                <button
                  onClick={startBreathing}
                  className="bg-primary text-white px-6 py-3 rounded-xl font-medium hover:bg-primary-hover transition"
                >
                  Comecar Exercicio
                </button>
              </div>
            ) : (
              <div>
                {/* Breathing circle */}
                <div className="relative w-32 h-32 mx-auto mb-4">
                  <div 
                    className={`absolute inset-0 rounded-full transition-all duration-1000 ${
                      breathPhase === "inhale" ? "scale-100 bg-blue-500/20" :
                      breathPhase === "hold" ? "scale-100 bg-amber-500/20" :
                      breathPhase === "exhale" ? "scale-75 bg-green-500/20" :
                      "scale-75 bg-purple-500/20"
                    }`}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className={`text-2xl font-bold ${phaseColor[breathPhase]}`}>{breathTimer}</p>
                      <p className={`text-sm font-medium ${phaseColor[breathPhase]}`}>{phaseText[breathPhase]}</p>
                    </div>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground mb-3">
                  Respiracoes completas: {breathCount}
                </p>
                
                <button
                  onClick={stopBreathing}
                  className="bg-secondary text-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted transition"
                >
                  Parar
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tips Panel */}
        {showTips && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground mb-2">Dicas rapidas para o teu bem-estar:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {quickTips.slice(0, 6).map((tip, i) => (
                <div key={i} className="flex items-start gap-2 bg-secondary/50 rounded-lg p-2">
                  <span className="text-lg">{tip.icon}</span>
                  <p className="text-xs text-foreground">{tip.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Help resources - subtle link */}
        <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Cuida da tua saude mental. Pequenas pausas fazem grande diferenca.
          </p>
          <a
            href="tel:808200204"
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            Linha de Apoio
          </a>
        </div>
      </div>
    </div>
  )
}
