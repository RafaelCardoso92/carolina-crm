import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'
import ClienteForm from "@/components/ClienteForm"
import Link from "next/link"
import { notFound } from "next/navigation"

async function getCliente(id: string) {
  return prisma.cliente.findUnique({
    where: { id }
  })
}

export default async function EditarClientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cliente = await getCliente(id)

  if (!cliente) {
    notFound()
  }

  return (
    <div>
      <div className="mb-8">
        <Link href={`/clientes/${id}`} className="text-purple-600 hover:text-purple-700 flex items-center gap-1 mb-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Voltar
        </Link>
        <h1 className="text-3xl font-bold text-gray-800">Editar Cliente</h1>
        <p className="text-gray-500">{cliente.nome}</p>
      </div>

      <ClienteForm cliente={cliente} />
    </div>
  )
}
