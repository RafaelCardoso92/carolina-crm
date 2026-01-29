import { NextResponse } from "next/server"

// Large fallback list of Portuguese quotes
const fallbackQuotes = [
  // Encouragement
  { text: "Tu consegues. Acredita no teu potencial.", author: "" },
  { text: "Tu és mais forte do que pensas.", author: "" },
  { text: "Respira fundo. Tu és incrível.", author: "" },
  { text: "Hoje é um bom dia para ter um bom dia.", author: "" },
  { text: "A tua dedicação inspira todos à tua volta.", author: "" },
  { text: "O teu esforço faz a diferença.", author: "" },
  { text: "Sorri, o melhor ainda está por vir.", author: "" },
  { text: "Cada dia é uma nova oportunidade para brilhar.", author: "" },
  { text: "Acredita em ti mesma e tudo será possível.", author: "" },
  { text: "Não desistas. O início é sempre o mais difícil.", author: "" },
  { text: "Cada cliente satisfeito é uma vitória.", author: "" },
  { text: "O trabalho duro de hoje é o sucesso de amanhã.", author: "" },
  { text: "Grandes coisas nunca vieram de zonas de conforto.", author: "" },
  { text: "Um passo de cada vez, chegarás longe.", author: "" },
  { text: "A força não vem do corpo, vem da vontade.", author: "" },
  { text: "O impossível é apenas uma opinião.", author: "" },
  { text: "Faz o teu melhor e o universo fará o resto.", author: "" },
  { text: "A tua atitude determina a tua direção.", author: "" },
  { text: "És uma guerreira. Continua a lutar.", author: "" },
  { text: "O teu trabalho tem valor. Tu tens valor.", author: "" },
  { text: "Lembra-te porque começaste.", author: "" },
  { text: "Está quase! Não pares agora.", author: "" },
  { text: "Orgulha-te de quão longe chegaste.", author: "" },
  { text: "Mereces todo o sucesso que está a caminho.", author: "" },
  { text: "Os teus sonhos são válidos.", author: "" },
  { text: "Hoje vai correr tudo bem.", author: "" },
  { text: "És capaz de superar qualquer obstáculo.", author: "" },
  { text: "A tua energia positiva faz a diferença.", author: "" },
  { text: "Confia no processo. Os resultados virão.", author: "" },
  { text: "Cada pequena vitória conta.", author: "" },
  { text: "O teu melhor é sempre suficiente.", author: "" },
  { text: "Amanhã agradecerás o esforço de hoje.", author: "" },
  { text: "O sucesso é a soma de pequenos esforços repetidos dia após dia.", author: "Robert Collier" },
  { text: "A persistência é o caminho do êxito.", author: "Charles Chaplin" },
  { text: "O único modo de fazer um excelente trabalho é amar o que fazes.", author: "Steve Jobs" },
  { text: "Acredita que podes e já estás a meio caminho.", author: "Theodore Roosevelt" },
  { text: "O sucesso não é a chave para a felicidade. A felicidade é a chave para o sucesso.", author: "Albert Schweitzer" },
  { text: "Nunca é tarde demais para seres aquilo que poderias ter sido.", author: "George Eliot" },
  { text: "A vida é 10% o que nos acontece e 90% como reagimos.", author: "Charles Swindoll" },
  { text: "Não contes os dias, faz os dias contarem.", author: "Muhammad Ali" },
]

async function fetchQuoteFromAPI(): Promise<{ text: string; author: string } | null> {
  try {
    // Try Stoic Quotes API (has Portuguese support via translation proxy)
    const response = await fetch("https://api.mymemory.translated.net/get?q=You%20have%20power%20over%20your%20mind%20-%20not%20outside%20events.%20Realize%20this%2C%20and%20you%20will%20find%20strength.&langpair=en|pt", {
      signal: AbortSignal.timeout(3000)
    })
    if (response.ok) {
      const data = await response.json()
      if (data.responseData?.translatedText) {
        return { text: data.responseData.translatedText, author: "Marco Aurélio" }
      }
    }
  } catch {
    // API failed
  }

  try {
    // Try Quotable API and translate
    const quoteRes = await fetch("https://api.quotable.io/random?tags=inspirational", {
      signal: AbortSignal.timeout(3000)
    })
    if (quoteRes.ok) {
      const quoteData = await quoteRes.json()
      // Translate to Portuguese
      const translateRes = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(quoteData.content)}&langpair=en|pt`,
        { signal: AbortSignal.timeout(3000) }
      )
      if (translateRes.ok) {
        const translateData = await translateRes.json()
        if (translateData.responseData?.translatedText) {
          return {
            text: translateData.responseData.translatedText,
            author: quoteData.author
          }
        }
      }
    }
  } catch {
    // API failed
  }

  return null
}

export async function GET() {
  // Try to fetch from online API first
  const onlineQuote = await fetchQuoteFromAPI()
  
  if (onlineQuote) {
    return NextResponse.json(onlineQuote)
  }
  
  // Fallback to local quotes
  const randomQuote = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)]
  return NextResponse.json(randomQuote)
}
