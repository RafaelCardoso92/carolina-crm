import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const [
      configuracoes,
      premiosMensais,
      premiosTrimestrais,
      premiosAnuais,
      objetivosAnuais,
      objetivosTrimestrais,
      objetivosMensais
    ] = await Promise.all([
      prisma.configuracao.findMany(),
      prisma.premioMensal.findMany({ orderBy: { minimo: "asc" } }),
      prisma.premioTrimestral.findMany({ orderBy: { minimo: "asc" } }),
      prisma.premioAnual.findMany({ orderBy: { minimo: "asc" } }),
      prisma.objetivoAnual.findMany({ orderBy: { ano: "desc" } }),
      prisma.objetivoTrimestral.findMany({ orderBy: [{ ano: "desc" }, { trimestre: "asc" }] }),
      prisma.objetivoMensal.findMany({ orderBy: [{ ano: "desc" }, { mes: "asc" }] })
    ])

    // Convert configuracoes array to object
    const config: Record<string, string> = {}
    configuracoes.forEach(c => {
      config[c.chave] = c.valor
    })

    return NextResponse.json({
      configuracoes: config,
      premiosMensais,
      premiosTrimestrais,
      premiosAnuais,
      objetivosAnuais,
      objetivosTrimestrais,
      objetivosMensais
    })
  } catch (error) {
    console.error("Error fetching settings:", error)
    return NextResponse.json({ error: "Erro ao carregar definicoes" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { tipo, dados } = body

    switch (tipo) {
      case "configuracao":
        await prisma.configuracao.upsert({
          where: { chave: dados.chave },
          update: { valor: dados.valor },
          create: { chave: dados.chave, valor: dados.valor, descricao: dados.descricao }
        })
        break

      case "premio_mensal":
        if (dados.id) {
          await prisma.premioMensal.update({
            where: { id: dados.id },
            data: { minimo: dados.minimo, premio: dados.premio, ordem: dados.ordem }
          })
        } else {
          await prisma.premioMensal.create({
            data: { minimo: dados.minimo, premio: dados.premio, ordem: dados.ordem }
          })
        }
        break

      case "premio_trimestral":
        if (dados.id) {
          await prisma.premioTrimestral.update({
            where: { id: dados.id },
            data: { minimo: dados.minimo, premio: dados.premio, ordem: dados.ordem }
          })
        } else {
          await prisma.premioTrimestral.create({
            data: { minimo: dados.minimo, premio: dados.premio, ordem: dados.ordem }
          })
        }
        break

      case "premio_anual":
        if (dados.id) {
          await prisma.premioAnual.update({
            where: { id: dados.id },
            data: { minimo: dados.minimo, premio: dados.premio, ordem: dados.ordem }
          })
        } else {
          await prisma.premioAnual.create({
            data: { minimo: dados.minimo, premio: dados.premio, ordem: dados.ordem }
          })
        }
        break

      case "objetivo_anual":
        await prisma.objetivoAnual.upsert({
          where: { ano: dados.ano },
          update: { objetivo: dados.objetivo },
          create: { ano: dados.ano, objetivo: dados.objetivo }
        })
        break

      case "objetivo_trimestral":
        await prisma.objetivoTrimestral.upsert({
          where: { trimestre_ano: { trimestre: dados.trimestre, ano: dados.ano } },
          update: { objetivo: dados.objetivo },
          create: { trimestre: dados.trimestre, ano: dados.ano, objetivo: dados.objetivo }
        })
        break

      case "objetivo_mensal":
        await prisma.objetivoMensal.upsert({
          where: { mes_ano: { mes: dados.mes, ano: dados.ano } },
          update: { objetivo: dados.objetivo },
          create: { mes: dados.mes, ano: dados.ano, objetivo: dados.objetivo }
        })
        break

      default:
        return NextResponse.json({ error: "Tipo invalido" }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving settings:", error)
    return NextResponse.json({ error: "Erro ao guardar definicoes" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get("tipo")
    const id = searchParams.get("id")

    if (!tipo || !id) {
      return NextResponse.json({ error: "Tipo e ID sao obrigatorios" }, { status: 400 })
    }

    switch (tipo) {
      case "premio_mensal":
        await prisma.premioMensal.delete({ where: { id } })
        break
      case "premio_trimestral":
        await prisma.premioTrimestral.delete({ where: { id } })
        break
      case "premio_anual":
        await prisma.premioAnual.delete({ where: { id } })
        break
      default:
        return NextResponse.json({ error: "Tipo invalido" }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting:", error)
    return NextResponse.json({ error: "Erro ao eliminar" }, { status: 500 })
  }
}
