"use client"

import { useEffect, useState } from "react"
import ChatBaborella from "./ChatBaborella"

interface ClienteBaborellaProps {
  clienteId: string
}

export default function ClienteBaborella({ clienteId }: ClienteBaborellaProps) {
  const [context, setContext] = useState<string>("")
  const [clienteName, setClienteName] = useState<string>("Cliente")
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetchContext()
  }, [clienteId])

  async function fetchContext() {
    try {
      // Fetch full client data with all relations
      const res = await fetch(`/api/clientes/${clienteId}?full=true`)
      if (res.ok) {
        const data = await res.json()
        setClienteName(data.nome)
        
        // Build comprehensive context
        const contextParts: string[] = []
        
        // Basic info
        contextParts.push("=== INFORMACAO DO CLIENTE ===")
        contextParts.push(`Nome: ${data.nome}`)
        if (data.codigo) contextParts.push(`Código: ${data.codigo}`)
        if (data.telefone) contextParts.push(`Telefone: ${data.telefone}`)
        if (data.email) contextParts.push(`Email: ${data.email}`)
        if (data.morada) contextParts.push(`Morada: ${data.morada}`)
        contextParts.push(`Estado: ${data.ativo ? "Ativo" : "Inativo"}`)
        if (data.ultimoContacto) {
          contextParts.push(`Último contacto: ${new Date(data.ultimoContacto).toLocaleDateString("pt-PT")}`)
        }
        if (data.notas) contextParts.push(`Notas: ${data.notas}`)
        
        // Sales history
        if (data.vendas && data.vendas.length > 0) {
          contextParts.push("")
          contextParts.push("=== HISTORICO DE VENDAS ===")
          const totalVendas = data.vendas.reduce((sum: number, v: any) => sum + Number(v.total), 0)
          contextParts.push(`Total geral: ${totalVendas.toFixed(2)} EUR (${data.vendas.length} vendas)`)
          
          // List recent sales with details
          const recentSales = data.vendas.slice(0, 10)
          recentSales.forEach((v: any, idx: number) => {
            const meses = ["", "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
            contextParts.push(`${idx + 1}. ${meses[v.mes]} ${v.ano}: ${Number(v.total).toFixed(2)} EUR`)
            if (v.itens && v.itens.length > 0) {
              const produtos = v.itens.map((i: any) => `${i.produto?.nome || "Produto"} (x${i.quantidade})`).join(", ")
              contextParts.push(`   Produtos: ${produtos}`)
            }
          })
          
          // Product preferences
          const allProducts: Record<string, { qty: number; total: number }> = {}
          data.vendas.forEach((v: any) => {
            v.itens?.forEach((i: any) => {
              const name = i.produto?.nome || "Desconhecido"
              if (!allProducts[name]) allProducts[name] = { qty: 0, total: 0 }
              allProducts[name].qty += Number(i.quantidade)
              allProducts[name].total += Number(i.subtotal || 0)
            })
          })
          const topProducts = Object.entries(allProducts)
            .sort((a, b) => b[1].total - a[1].total)
            .slice(0, 5)
          
          if (topProducts.length > 0) {
            contextParts.push("")
            contextParts.push("Produtos mais comprados:")
            topProducts.forEach(([name, data]) => {
              contextParts.push(`- ${name}: ${data.qty} unidades, ${data.total.toFixed(2)} EUR`)
            })
          }
        }
        
        // Collections
        if (data.cobrancas && data.cobrancas.length > 0) {
          contextParts.push("")
          contextParts.push("=== COBRANCAS ===")
          const pendentes = data.cobrancas.filter((c: any) => !c.pago)
          const pagas = data.cobrancas.filter((c: any) => c.pago)
          const pendentesValor = pendentes.reduce((sum: number, c: any) => sum + Number(c.valor), 0)
          const pagasValor = pagas.reduce((sum: number, c: any) => sum + Number(c.valor), 0)
          
          contextParts.push(`Pagas: ${pagas.length} (${pagasValor.toFixed(2)} EUR)`)
          contextParts.push(`Pendentes: ${pendentes.length} (${pendentesValor.toFixed(2)} EUR)`)
          
          if (pendentes.length > 0) {
            contextParts.push("Cobrancas pendentes:")
            pendentes.slice(0, 5).forEach((c: any) => {
              contextParts.push(`- Fatura ${c.fatura || "s/n"}: ${Number(c.valor).toFixed(2)} EUR`)
            })
          }
        }
        
        
        
        // Samples
        if (data.amostras && data.amostras.length > 0) {
          contextParts.push("")
          contextParts.push("=== AMOSTRAS ENVIADAS ===")
          data.amostras.slice(0, 5).forEach((s: any) => {
            const date = new Date(s.createdAt).toLocaleDateString("pt-PT")
            contextParts.push(`- ${date}: ${s.produto?.nome || "Produto"} - ${s.estado}`)
          })
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
    <ChatBaborella
      entityType="cliente"
      entityId={clienteId}
      entityName={clienteName}
      context={context}
    />
  )
}
