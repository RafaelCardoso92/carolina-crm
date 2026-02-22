import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getIVAForDate, getIVAForMonth } from "@/lib/iva"

// GET: Get the IVA rate for a specific date or month/year
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
      taxa = await getIVAForMonth(parseInt(mes), parseInt(ano))
    } else if (dateParam) {
      // Get rate for specific date
      taxa = await getIVAForDate(new Date(dateParam))
    } else {
      // Get current rate
      taxa = await getIVAForDate(new Date())
    }

    return NextResponse.json({
      success: true,
      taxa
    })
  } catch (error) {
    console.error("Error getting IVA rate:", error)
    return NextResponse.json(
      { success: false, error: "Erro ao obter taxa de IVA", taxa: 23 },
      { status: 500 }
    )
  }
}
