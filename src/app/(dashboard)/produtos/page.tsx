import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

import ProdutosList from "./ProdutosList"

async function getProdutos() {
  const produtos = await prisma.produto.findMany({
    where: { ativo: true },
    orderBy: [
      { categoria: "asc" },
      { nome: "asc" }
    ],
    select: {
      id: true,
      nome: true,
      codigo: true,
      categoria: true,
      preco: true,
      tipo: true
    }
  })

  // Serialize Decimal to number for client component
  return produtos.map(p => ({
    ...p,
    preco: p.preco ? Number(p.preco) : null
  }))
}

export default async function ProdutosPage() {
  const produtos = await getProdutos()

  // Group by category
  const categorias = produtos.reduce((acc, produto) => {
    const cat = produto.categoria || "Sem Categoria"
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(produto)
    return acc
  }, {} as Record<string, typeof produtos[number][]>)

  return (
    <div>
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Produtos</h1>
        <p className="text-muted-foreground flex items-center gap-2 mt-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          {produtos.length} produtos ativos
        </p>
      </div>

      <ProdutosList categorias={categorias} />
    </div>
  )
}
