"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

interface Seller {
  id: string
  name: string | null
  email: string
}

interface TransferClienteModalProps {
  clienteId: string
  clienteNome: string
  currentSellerId: string
  isOpen: boolean
  onClose: () => void
}

export default function TransferClienteModal({
  clienteId,
  clienteNome,
  currentSellerId,
  isOpen,
  onClose,
}: TransferClienteModalProps) {
  const router = useRouter()
  const [sellers, setSellers] = useState<Seller[]>([])
  const [selectedSellerId, setSelectedSellerId] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [loadingSellers, setLoadingSellers] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setLoadingSellers(true)
      fetch("/api/sellers")
        .then((res) => res.json())
        .then((data) => {
          const sellerList = Array.isArray(data) ? data : []
          // Filter out current seller
          setSellers(sellerList.filter((s: Seller) => s.id !== currentSellerId))
        })
        .catch((err) => console.error("Error fetching sellers:", err))
        .finally(() => setLoadingSellers(false))
    }
  }, [isOpen, currentSellerId])

  const handleTransfer = async () => {
    if (!selectedSellerId) {
      setError("Selecione um vendedor")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/clientes/${clienteId}/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newSellerId: selectedSellerId }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Erro ao transferir cliente")
      }

      const data = await res.json()
      alert(data.message)
      onClose()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao transferir cliente")
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">Transferir Cliente</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-muted-foreground mb-4">
          Transferir <strong className="text-foreground">{clienteNome}</strong> para outro vendedor.
          Todos os dados relacionados (tarefas, orcamentos, amostras) serao transferidos.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4">
            {error}
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-medium text-foreground mb-2">
            Novo Vendedor
          </label>
          {loadingSellers ? (
            <div className="px-4 py-3 rounded-xl border border-border bg-muted text-muted-foreground">
              A carregar vendedores...
            </div>
          ) : sellers.length === 0 ? (
            <div className="px-4 py-3 rounded-xl border border-border bg-muted text-muted-foreground">
              Nenhum vendedor disponivel
            </div>
          ) : (
            <select
              value={selectedSellerId}
              onChange={(e) => setSelectedSellerId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">Selecione um vendedor</option>
              {sellers.map((seller) => (
                <option key={seller.id} value={seller.id}>
                  {seller.name || seller.email}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-3 rounded-xl border border-border hover:bg-muted transition disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleTransfer}
            disabled={loading || !selectedSellerId}
            className="flex-1 bg-primary text-primary-foreground px-4 py-3 rounded-xl font-medium hover:bg-primary-hover transition disabled:opacity-50"
          >
            {loading ? "A transferir..." : "Transferir"}
          </button>
        </div>
      </div>
    </div>
  )
}
