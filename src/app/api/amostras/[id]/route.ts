import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Check ownership for sellers
    if (session.user.role === "SELLER") {
      const amostra = await prisma.amostra.findUnique({
        where: { id },
        select: { userId: true }
      })
      if (amostra?.userId !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    await prisma.amostra.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting amostra:", error)
    return NextResponse.json({ error: "Erro ao eliminar amostra" }, { status: 500 })
  }
}
