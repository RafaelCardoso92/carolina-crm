import ProspectoForm from "@/components/ProspectoForm"
import Link from "next/link"

export default function NovoProspectoPage() {
  return (
    <div>
      <div className="mb-4">
        <Link
          href="/prospectos"
          className="text-muted-foreground hover:text-foreground transition flex items-center gap-1.5 mb-2 text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Voltar
        </Link>
        <h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
          <svg className="w-5 h-5 md:w-6 md:h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Novo Prospecto
        </h1>
      </div>
      <ProspectoForm />
    </div>
  )
}
