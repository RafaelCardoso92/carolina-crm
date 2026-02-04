export const dynamic = 'force-dynamic'
import FicheirosView from "./FicheirosView"

export default function FicheirosPage() {
  return (
    <div>
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Ficheiros</h1>
        <p className="text-muted-foreground flex items-center gap-2 mt-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          Gestao de documentos e ficheiros
        </p>
      </div>

      <FicheirosView />
    </div>
  )
}
