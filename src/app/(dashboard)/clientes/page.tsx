import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { userScopedWhere } from "@/lib/permissions"

export const dynamic = 'force-dynamic'
import Link from "next/link"
import ClientesList from "./ClientesList"

export default async function ClientesPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const clientes = await prisma.cliente.findMany({
    where: userScopedWhere(session),
    orderBy: { nome: "asc" },
    select: {
      id: true,
      nome: true,
      codigo: true,
      telefone: true,
      email: true,
      cidade: true,
      ativo: true,
      _count: {
        select: { vendas: true, cobrancas: true }
      }
    }
  })

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Clientes</h1>
          <p className="text-muted-foreground flex items-center gap-2 mt-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {clientes.length} clientes registados
          </p>
        </div>
        <Link
          href="/clientes/novo"
          className="bg-gradient-to-r from-primary to-primary/90 text-primary-foreground px-5 md:px-6 py-2.5 md:py-3 rounded-xl font-semibold hover:from-primary-hover hover:to-primary transition-all flex items-center gap-2 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 text-sm md:text-base w-full sm:w-auto justify-center"
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
