import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"

const ESTADOS_PIPELINE = [
  { value: "NOVO", label: "Novo", color: "bg-gray-500", textColor: "text-gray-700", bgLight: "bg-gray-100" },
  { value: "CONTACTADO", label: "Contactado", color: "bg-blue-500", textColor: "text-blue-700", bgLight: "bg-blue-100" },
  { value: "REUNIAO", label: "Reunião", color: "bg-yellow-500", textColor: "text-yellow-700", bgLight: "bg-yellow-100" },
  { value: "PROPOSTA", label: "Proposta", color: "bg-orange-500", textColor: "text-orange-700", bgLight: "bg-orange-100" },
  { value: "NEGOCIACAO", label: "Negociação", color: "bg-purple-500", textColor: "text-purple-700", bgLight: "bg-purple-100" },
  { value: "GANHO", label: "Ganho", color: "bg-green-500", textColor: "text-green-700", bgLight: "bg-green-100" },
  { value: "PERDIDO", label: "Perdido", color: "bg-red-500", textColor: "text-red-700", bgLight: "bg-red-100" },
]

export default async function ProspectoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const prospecto = await prisma.prospecto.findUnique({
    where: { id },
  })

  if (!prospecto) {
    notFound()
  }

  const estadoInfo = ESTADOS_PIPELINE.find((e) => e.value === prospecto.estado) || ESTADOS_PIPELINE[0]

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

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg md:text-xl lg:text-2xl font-bold text-foreground truncate">{prospecto.nomeEmpresa}</h1>
              <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${estadoInfo.bgLight} ${estadoInfo.textColor} whitespace-nowrap`}>
                {estadoInfo.label}
              </span>
            </div>
            {prospecto.tipoNegocio && (
              <p className="text-muted-foreground text-sm">{prospecto.tipoNegocio}</p>
            )}
          </div>
          <Link
            href={`/prospectos/${id}/editar`}
            className="bg-purple-600 text-white px-3 py-2 rounded-lg font-medium hover:bg-purple-700 transition flex items-center justify-center gap-1.5 text-sm shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Editar
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
        {/* Contact Info */}
        <div className="bg-card rounded-xl shadow-sm p-3 md:p-4">
          <h2 className="text-sm md:text-base font-bold text-foreground mb-2 md:mb-3 flex items-center gap-1.5">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Contacto
          </h2>
          <dl className="space-y-2">
            {prospecto.nomeContacto && (
              <div>
                <dt className="text-xs text-muted-foreground">Nome</dt>
                <dd className="font-medium text-foreground text-sm">{prospecto.nomeContacto}</dd>
              </div>
            )}
            {prospecto.cargoContacto && (
              <div>
                <dt className="text-xs text-muted-foreground">Cargo</dt>
                <dd className="font-medium text-foreground text-sm">{prospecto.cargoContacto}</dd>
              </div>
            )}
            {prospecto.telefone && (
              <div>
                <dt className="text-xs text-muted-foreground">Telefone</dt>
                <dd className="font-medium text-sm">
                  <a href={`tel:${prospecto.telefone}`} className="text-purple-600 hover:underline">
                    {prospecto.telefone}
                  </a>
                </dd>
              </div>
            )}
            {prospecto.email && (
              <div>
                <dt className="text-xs text-muted-foreground">Email</dt>
                <dd className="font-medium text-sm">
                  <a href={`mailto:${prospecto.email}`} className="text-purple-600 hover:underline break-all">
                    {prospecto.email}
                  </a>
                </dd>
              </div>
            )}
            {!prospecto.nomeContacto && !prospecto.telefone && !prospecto.email && (
              <p className="text-xs text-muted-foreground italic">Sem informação</p>
            )}
          </dl>
        </div>

        {/* Location Info */}
        <div className="bg-card rounded-xl shadow-sm p-3 md:p-4">
          <h2 className="text-sm md:text-base font-bold text-foreground mb-2 md:mb-3 flex items-center gap-1.5">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Localização
          </h2>
          <dl className="space-y-2">
            {prospecto.morada && (
              <div>
                <dt className="text-xs text-muted-foreground">Morada</dt>
                <dd className="font-medium text-foreground text-sm">{prospecto.morada}</dd>
              </div>
            )}
            {prospecto.cidade && (
              <div>
                <dt className="text-xs text-muted-foreground">Cidade</dt>
                <dd className="font-medium text-foreground text-sm">{prospecto.cidade}</dd>
              </div>
            )}
            {prospecto.codigoPostal && (
              <div>
                <dt className="text-xs text-muted-foreground">Código Postal</dt>
                <dd className="font-medium text-foreground text-sm">{prospecto.codigoPostal}</dd>
              </div>
            )}
            {!prospecto.morada && !prospecto.cidade && (
              <p className="text-xs text-muted-foreground italic">Sem informação</p>
            )}
          </dl>
        </div>

        {/* Online Presence */}
        <div className="bg-card rounded-xl shadow-sm p-3 md:p-4">
          <h2 className="text-sm md:text-base font-bold text-foreground mb-2 md:mb-3 flex items-center gap-1.5">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
            Online
          </h2>
          <dl className="space-y-2">
            {prospecto.website && (
              <div>
                <dt className="text-xs text-muted-foreground">Website</dt>
                <dd className="font-medium text-sm">
                  <a href={prospecto.website} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline break-all">
                    {prospecto.website}
                  </a>
                </dd>
              </div>
            )}
            {prospecto.facebook && (
              <div>
                <dt className="text-xs text-muted-foreground">Facebook</dt>
                <dd className="font-medium text-sm">
                  <a href={prospecto.facebook} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline break-all">
                    {prospecto.facebook}
                  </a>
                </dd>
              </div>
            )}
            {prospecto.instagram && (
              <div>
                <dt className="text-xs text-muted-foreground">Instagram</dt>
                <dd className="font-medium text-foreground text-sm">{prospecto.instagram}</dd>
              </div>
            )}
            {!prospecto.website && !prospecto.facebook && !prospecto.instagram && (
              <p className="text-xs text-muted-foreground italic">Sem informação</p>
            )}
          </dl>
        </div>

        {/* Pipeline Info */}
        <div className="bg-card rounded-xl shadow-sm p-3 md:p-4">
          <h2 className="text-sm md:text-base font-bold text-foreground mb-2 md:mb-3 flex items-center gap-1.5">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Pipeline
          </h2>
          <dl className="space-y-2">
            {prospecto.fonte && (
              <div>
                <dt className="text-xs text-muted-foreground">Fonte</dt>
                <dd className="font-medium text-foreground text-sm">{prospecto.fonte}</dd>
              </div>
            )}
            {prospecto.proximaAccao && (
              <div>
                <dt className="text-xs text-muted-foreground">Próxima Acção</dt>
                <dd className="font-medium text-foreground text-sm">{prospecto.proximaAccao}</dd>
              </div>
            )}
            {prospecto.dataProximaAccao && (
              <div>
                <dt className="text-xs text-muted-foreground">Data</dt>
                <dd className="font-medium text-foreground text-sm">
                  {new Date(prospecto.dataProximaAccao).toLocaleDateString("pt-PT")}
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Notes */}
        {prospecto.notas && (
          <div className="bg-card rounded-xl shadow-sm p-3 md:p-4 lg:col-span-2">
            <h2 className="text-sm md:text-base font-bold text-foreground mb-2 flex items-center gap-1.5">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Notas
            </h2>
            <p className="text-foreground whitespace-pre-wrap text-sm">{prospecto.notas}</p>
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="mt-4 text-xs text-muted-foreground">
        <p>Criado: {new Date(prospecto.createdAt).toLocaleDateString("pt-PT")}</p>
      </div>
    </div>
  )
}
