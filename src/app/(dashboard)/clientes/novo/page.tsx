import ClienteForm from "@/components/ClienteForm"
import Link from "next/link"

export default function NovoClientePage() {
  return (
    <div>
      <div className="mb-8">
        <Link href="/clientes" className="text-purple-600 hover:text-purple-700 flex items-center gap-1 mb-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Voltar
        </Link>
        <h1 className="text-3xl font-bold text-gray-800">Novo Cliente</h1>
      </div>

      <ClienteForm />
    </div>
  )
}
