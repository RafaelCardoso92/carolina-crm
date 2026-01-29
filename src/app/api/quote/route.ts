import { NextResponse } from "next/server"

// Fallback quotes in Portuguese - motivational for hard working days
const fallbackQuotes = [
  { text: "O sucesso é a soma de pequenos esforços repetidos dia após dia.", author: "Robert Collier" },
  { text: "Acredita em ti mesma e tudo será possível.", author: "Desconhecido" },
  { text: "Cada dia é uma nova oportunidade para brilhar.", author: "Desconhecido" },
  { text: "Tu és mais forte do que pensas.", author: "Desconhecido" },
  { text: "O trabalho duro de hoje é o sucesso de amanhã.", author: "Desconhecido" },
  { text: "Não desistas. O início é sempre o mais difícil.", author: "Desconhecido" },
  { text: "A persistência é o caminho do êxito.", author: "Charles Chaplin" },
  { text: "Grandes coisas nunca vieram de zonas de conforto.", author: "Desconhecido" },
  { text: "Tu consegues. Acredita no teu potencial.", author: "Desconhecido" },
  { text: "Hoje é um bom dia para ter um bom dia.", author: "Desconhecido" },
  { text: "A tua dedicação inspira todos à tua volta.", author: "Desconhecido" },
  { text: "Cada cliente satisfeito é uma vitória.", author: "Desconhecido" },
  { text: "O teu esforço faz a diferença.", author: "Desconhecido" },
  { text: "Respira fundo. Tu és incrível.", author: "Desconhecido" },
  { text: "Um passo de cada vez, chegarás longe.", author: "Desconhecido" },
  { text: "A força não vem do corpo, vem da vontade.", author: "Desconhecido" },
  { text: "Sorri, o melhor ainda está por vir.", author: "Desconhecido" },
  { text: "O impossível é apenas uma opinião.", author: "Desconhecido" },
  { text: "Faz o teu melhor e o universo fará o resto.", author: "Desconhecido" },
  { text: "A tua atitude determina a tua direção.", author: "Desconhecido" },
]

export async function GET() {
  try {
    // Try to fetch from ZenQuotes API
    const response = await fetch("https://zenquotes.io/api/random", {
      next: { revalidate: 0 } // Don't cache
    })
    
    if (response.ok) {
      const data = await response.json()
      if (data && data[0]) {
        return NextResponse.json({
          text: data[0].q,
          author: data[0].a
        })
      }
    }
  } catch (error) {
    // API failed, use fallback
  }
  
  // Return random fallback quote
  const randomQuote = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)]
  return NextResponse.json(randomQuote)
}
