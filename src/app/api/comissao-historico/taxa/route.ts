import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getComissaoForDate, getComissaoForMonth } from "@/lib/comissao"

// GET: Get the commission rate for a specific date or month/year
export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get("date")
    const mes = searchParams.get("mes")
    const ano = searchParams.get("ano")

    let taxa: number

    if (mes && ano) {
      // Get rate for specific month/year
      taxa = await getComissaoForMonth(parseInt(mes), parseInt(ano))
    } else if (dateParam) {
      // Get rate for specific date
      taxa = await getComissaoForDate(new Date(dateParam))
    } else {
      // Get current rate
      taxa = await getComissaoForDate(new Date())
    }

    return NextResponse.json({
      success: true,
      taxa
    })
  } catch (error) {
    console.error("Error getting commission rate:", error)
    return NextResponse.json(
      { success: false, error: "Erro ao obter taxa de comissão", taxa: 3.5 },
      { status: 500 }
    )
  }
}
