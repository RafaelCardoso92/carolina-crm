"use client"

import { useEffect, useState } from "react"
import ChatBaboreta from "./ChatBaboreta"

interface ProspectoBaboretaProps {
  prospectoId: string
}

export default function ProspectoBaboreta({ prospectoId }: ProspectoBaboretaProps) {
  const [context, setContext] = useState<string>("")
  const [prospectoName, setProspectoName] = useState<string>("Prospecto")
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetchContext()
  }, [prospectoId])

  async function fetchContext() {
    try {
      const res = await fetch(`/api/prospectos/${prospectoId}`)
      if (res.ok) {
        const data = await res.json()
        setProspectoName(data.nomeEmpresa)
        
        // Build context string
        const contextParts = [
          `Empresa: ${data.nomeEmpresa}`,
          data.tipoNegocio ? `Tipo de negocio: ${data.tipoNegocio}` : null,
          data.nomeContacto ? `Contacto: ${data.nomeContacto}` : null,
          data.cargoContacto ? `Cargo: ${data.cargoContacto}` : null,
          data.telefone ? `Telefone: ${data.telefone}` : null,
          data.email ? `Email: ${data.email}` : null,
          data.morada ? `Morada: ${data.morada}` : null,
          data.cidade ? `Cidade: ${data.cidade}` : null,
          data.website ? `Website: ${data.website}` : null,
          data.facebook ? `Facebook: ${data.facebook}` : null,
          data.instagram ? `Instagram: ${data.instagram}` : null,
          `Estado no pipeline: ${data.estado}`,
          data.fonte ? `Fonte: ${data.fonte}` : null,
          data.proximaAccao ? `Proxima acao: ${data.proximaAccao}` : null,
          data.dataProximaAccao ? `Data proxima acao: ${new Date(data.dataProximaAccao).toLocaleDateString("pt-PT")}` : null,
          data.notas ? `Notas: ${data.notas}` : null,
        ].filter(Boolean)

        setContext(contextParts.join("\n"))
        setLoaded(true)
      }
    } catch (error) {
      console.error("Error fetching prospect context:", error)
      setLoaded(true)
    }
  }

  if (!loaded) return null

  return (
    <ChatBaboreta
      entityType="prospecto"
      entityId={prospectoId}
      entityName={prospectoName}
      context={context}
    />
  )
}
