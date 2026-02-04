"use client"

import { useState, useEffect } from "react"

const quotes = [
  { text: "O sucesso é a soma de pequenos esforços repetidos dia após dia.", author: "Robert Collier" },
  { text: "A persistência é o caminho do êxito.", author: "Charles Chaplin" },
  { text: "Acredita em ti mesmo e tudo será possível.", author: "Desconhecido" },
  { text: "O único lugar onde o sucesso vem antes do trabalho é no dicionário.", author: "Vidal Sassoon" },
  { text: "Não esperes por oportunidades extraordinárias. Agarra ocasiões comuns e torna-as grandes.", author: "Orison Swett Marden" },
  { text: "O segredo do sucesso é a constância do propósito.", author: "Benjamin Disraeli" },
  { text: "Grandes realizações são possíveis quando se dá importância aos pequenos começos.", author: "Lao Tsé" },
  { text: "A melhor maneira de prever o futuro é criá-lo.", author: "Peter Drucker" },
  { text: "Não tenhas medo de crescer lentamente, tem medo apenas de ficar parado.", author: "Provérbio Chinês" },
  { text: "O teu trabalho vai preencher grande parte da tua vida. A única forma de ficares satisfeito é fazeres o que acreditas ser um grande trabalho.", author: "Steve Jobs" },
  { text: "Cada dia é uma nova oportunidade para mudar a tua vida.", author: "Desconhecido" },
  { text: "O sucesso não é a chave para a felicidade. A felicidade é a chave para o sucesso.", author: "Albert Schweitzer" },
  { text: "Quem quer fazer algo encontra um meio, quem não quer fazer nada encontra uma desculpa.", author: "Roberto Shinyashiki" },
  { text: "A diferença entre o ordinário e o extraordinário é esse pequeno extra.", author: "Jimmy Johnson" },
  { text: "Nunca é tarde demais para ser aquilo que sempre desejaste ser.", author: "George Eliot" },
  { text: "O optimismo é a fé em ação. Nada se pode fazer sem esperança e confiança.", author: "Helen Keller" },
  { text: "Faz o teu melhor, na condição que tens, enquanto não tens condições melhores.", author: "Mario Sergio Cortella" },
  { text: "A única maneira de fazer um excelente trabalho é amar o que fazes.", author: "Steve Jobs" },
  { text: "Transforma os teus obstáculos em oportunidades e os teus problemas em possibilidades.", author: "Roy Bennett" },
  { text: "O impossível é apenas o possível que alguém ainda não realizou.", author: "Desconhecido" },
  { text: "Cada conquista começa com a decisão de tentar.", author: "Gail Devers" },
  { text: "A atitude é uma pequena coisa que faz uma grande diferença.", author: "Winston Churchill" },
  { text: "Não importa quão devagar vás, desde que não pares.", author: "Confúcio" },
  { text: "O futuro pertence àqueles que acreditam na beleza dos seus sonhos.", author: "Eleanor Roosevelt" },
  { text: "Coragem não é a ausência de medo, mas sim a decisão de que algo é mais importante que o medo.", author: "Ambrose Redmoon" },
  { text: "Sê a mudança que queres ver no mundo.", author: "Mahatma Gandhi" },
  { text: "A vida é 10% o que nos acontece e 90% como reagimos a isso.", author: "Charles Swindoll" },
  { text: "Sonha grande e atreve-te a falhar.", author: "Norman Vaughan" },
  { text: "A excelência não é um ato, mas um hábito.", author: "Aristóteles" },
  { text: "Acredita que podes e já estás a meio caminho.", author: "Theodore Roosevelt" },
  { text: "O único limite para a nossa realização de amanhã serão as nossas dúvidas de hoje.", author: "Franklin D. Roosevelt" },
]

interface DailyQuoteProps {
  compact?: boolean
}

export default function DailyQuote({ compact = false }: DailyQuoteProps) {
  const [quoteIndex, setQuoteIndex] = useState<number | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * quotes.length)
    setQuoteIndex(randomIndex)
  }, [])

  function getNewQuote() {
    setIsRefreshing(true)
    setTimeout(() => {
      let newIndex = Math.floor(Math.random() * quotes.length)
      while (newIndex === quoteIndex && quotes.length > 1) {
        newIndex = Math.floor(Math.random() * quotes.length)
      }
      setQuoteIndex(newIndex)
      setIsRefreshing(false)
    }, 300)
  }

  const quote = quoteIndex !== null ? quotes[quoteIndex] : null

  if (!quote) {
    return (
      <div className={compact ? "bg-white/10 rounded-xl p-3" : "bg-card rounded-xl border border-border p-3"}>
        <div className="animate-pulse">
          <div className={compact ? "h-3 bg-white/20 rounded w-3/4 mb-2" : "h-3 bg-secondary rounded w-3/4 mb-1"}></div>
          <div className={compact ? "h-3 bg-white/20 rounded w-1/2" : "h-3 bg-secondary rounded w-1/2"}></div>
        </div>
      </div>
    )
  }

  if (compact) {
    return (
      <div className="bg-white/10 rounded-xl p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className={`text-xs text-white/90 leading-relaxed line-clamp-3 transition-opacity duration-300 ${isRefreshing ? "opacity-0" : "opacity-100"}`}>
              "{quote.text}"
            </p>
            <p className={`text-[10px] text-white/60 mt-1 transition-opacity duration-300 ${isRefreshing ? "opacity-0" : "opacity-100"}`}>
              — {quote.author}
            </p>
          </div>
          <button
            onClick={getNewQuote}
            disabled={isRefreshing}
            className="p-1 rounded text-white/60 hover:text-white hover:bg-white/10 transition disabled:opacity-50 shrink-0"
            title="Nova citação"
          >
            <svg className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-xl border border-border p-3">
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
          </svg>
        </div>
        
        <div className="flex-1 min-w-0">
          <p className={`text-sm text-foreground leading-relaxed transition-opacity duration-300 ${isRefreshing ? "opacity-0" : "opacity-100"}`}>
            {quote.text}
          </p>
          <p className={`text-xs text-muted-foreground mt-1 transition-opacity duration-300 ${isRefreshing ? "opacity-0" : "opacity-100"}`}>
            — {quote.author}
          </p>
        </div>
        
        <button
          onClick={getNewQuote}
          disabled={isRefreshing}
          className="shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition disabled:opacity-50"
          title="Nova citação"
        >
          <svg className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
    </div>
  )
}
