import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import ProspectoForm from "@/components/ProspectoForm"

export default async function EditarProspectoPage({
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

  const prospectoData = {
    id: prospecto.id,
    nomeEmpresa: prospecto.nomeEmpresa,
    tipoNegocio: prospecto.tipoNegocio,
    website: prospecto.website,
    facebook: prospecto.facebook,
    instagram: prospecto.instagram,
    nomeContacto: prospecto.nomeContacto,
    cargoContacto: prospecto.cargoContacto,
    telefone: prospecto.telefone,
    email: prospecto.email,
    morada: prospecto.morada,
    cidade: prospecto.cidade,
    codigoPostal: prospecto.codigoPostal,
    latitude: prospecto.latitude,
    longitude: prospecto.longitude,
    estado: prospecto.estado,
    proximaAccao: prospecto.proximaAccao,
    dataProximaAccao: prospecto.dataProximaAccao?.toISOString() || null,
    notas: prospecto.notas,
    fonte: prospecto.fonte,
  }

  return (
    <div>
      <div className="mb-4">
        <Link
          href={`/prospectos/${id}`}
          className="text-muted-foreground hover:text-foreground transition flex items-center gap-1.5 mb-2 text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Voltar
        </Link>
        <h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
          <svg className="w-5 h-5 md:w-6 md:h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <span className="truncate">Editar</span>
        </h1>
      </div>
      <ProspectoForm prospecto={prospectoData} />
    </div>
  )
}
