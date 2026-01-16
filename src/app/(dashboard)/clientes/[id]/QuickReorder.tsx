"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface Props {
  vendaId: string
  clienteNome: string
}

export default function QuickReorder({ vendaId, clienteNome }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleReorder() {
    if (!confirm(`Criar nova venda com os mesmos itens da ultima venda de ${clienteNome}?`)) {
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/vendas/repetir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendaId })
      })

      if (res.ok) {
        const data = await res.json()
        alert("Venda criada com sucesso!")
        router.refresh()
      } else {
        alert("Erro ao criar venda")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Erro ao criar venda")
    }
    setLoading(false)
  }

  return (
    <button
      onClick={handleReorder}
      disabled={loading}
      className="flex items-center gap-3 p-3 bg-green-500/10 rounded-lg hover:bg-green-500/20 transition w-full disabled:opacity-50"
    >
      <span className="p-2 bg-green-500 rounded-lg text-white">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </span>
      <span className="font-medium text-foreground">
        {loading ? "A criar..." : "Repetir Ultima Venda"}
      </span>
    </button>
  )
}
