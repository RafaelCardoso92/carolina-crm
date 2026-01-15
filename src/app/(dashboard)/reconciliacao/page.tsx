import { prisma } from "@/lib/prisma"
import ReconciliacaoView from "./ReconciliacaoView"

export const dynamic = "force-dynamic"

const meses = [
  "", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
]

export default async function ReconciliacaoPage() {
  const now = new Date()
  const currentYear = now.getFullYear()

  // Fetch all reconciliations
  const reconciliacoes = await prisma.reconciliacaoMensal.findMany({
    include: {
      itens: {
        include: {
          cliente: {
            select: { id: true, nome: true, codigo: true }
          },
          venda: {
            select: { id: true, total: true, mes: true, ano: true }
          }
        },
        orderBy: [
          { corresponde: "asc" },
          { codigoClientePdf: "asc" }
        ]
      }
    },
    orderBy: [{ ano: "desc" }, { mes: "desc" }]
  })

  // Get available years
  const anosDisponiveis = [currentYear, currentYear - 1, currentYear - 2]

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
          <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          Reconciliação de Vendas
        </h1>
        <p className="text-muted-foreground mt-1">
          Confirme as vendas mensais com o MAPA 104 da contabilidade
        </p>
      </div>

      <ReconciliacaoView
        reconciliacoes={JSON.parse(JSON.stringify(reconciliacoes))}
        meses={meses}
        anosDisponiveis={anosDisponiveis}
      />
    </div>
  )
}
