import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'
import Link from "next/link"
import ClientesList from "./ClientesList"

async function getClientes() {
  return prisma.cliente.findMany({
    orderBy: { nome: "asc" },
    include: {
      _count: {
        select: { vendas: true, cobrancas: true }
      }
    }
  })
}

export default async function ClientesPage() {
  const clientes = await getClientes()

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-medium tracking-wide text-foreground">Clientes</h1>
          <p className="text-muted-foreground">{clientes.length} clientes registados</p>
        </div>
        <Link
          href="/clientes/novo"
          className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-medium hover:bg-primary-hover transition flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Novo Cliente
        </Link>
      </div>

      <ClientesList clientes={clientes} />
    </div>
  )
}
