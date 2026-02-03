"use client"

import { useEffect, useState } from "react"
import ChatBaboreta from "./ChatBaboreta"

interface ClienteBaboretaProps {
  clienteId: string
}

export default function ClienteBaboreta({ clienteId }: ClienteBaboretaProps) {
  const [context, setContext] = useState<string>("")
  const [clienteName, setClienteName] = useState<string>("Cliente")
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetchContext()
  }, [clienteId])

  async function fetchContext() {
    try {
      const res = await fetch(`/api/clientes/${clienteId}`)
      if (res.ok) {
        const data = await res.json()
        setClienteName(data.nome)
        
        // Build context string
        const contextParts = [
          `Nome: ${data.nome}`,
          data.codigo ? `Codigo: ${data.codigo}` : null,
          data.telefone ? `Telefone: ${data.telefone}` : null,
          data.email ? `Email: ${data.email}` : null,
          data.morada ? `Morada: ${data.morada}` : null,
          data.notas ? `Notas: ${data.notas}` : null,
          `Estado: ${data.ativo ? "Ativo" : "Inativo"}`,
          data.ultimoContacto ? `Ultimo contacto: ${new Date(data.ultimoContacto).toLocaleDateString("pt-PT")}` : null,
        ].filter(Boolean)

        // Add sales summary
        if (data.vendas && data.vendas.length > 0) {
          const totalVendas = data.vendas.reduce((sum: number, v: any) => sum + Number(v.total), 0)
          contextParts.push(`Total de vendas: ${totalVendas.toFixed(2)} EUR (${data.vendas.length} vendas)`)
          
          // Recent products
          const recentProducts = data.vendas
            .slice(0, 3)
            .flatMap((v: any) => v.itens?.map((i: any) => i.produto?.nome) || [])
            .filter(Boolean)
            .slice(0, 5)
          if (recentProducts.length > 0) {
            contextParts.push(`Produtos recentes: ${recentProducts.join(", ")}`)
          }
        }

        // Add collections summary
        if (data.cobrancas && data.cobrancas.length > 0) {
          const pendentes = data.cobrancas.filter((c: any) => !c.pago)
          const pendentesValor = pendentes.reduce((sum: number, c: any) => sum + Number(c.valor), 0)
          if (pendentes.length > 0) {
            contextParts.push(`Cobrancas pendentes: ${pendentes.length} (${pendentesValor.toFixed(2)} EUR)`)
          }
        }

        setContext(contextParts.join("\n"))
        setLoaded(true)
      }
    } catch (error) {
      console.error("Error fetching client context:", error)
      setLoaded(true)
    }
  }

  if (!loaded) return null

  return (
    <ChatBaboreta
      entityType="cliente"
      entityId={clienteId}
      entityName={clienteName}
      context={context}
    />
  )
}
