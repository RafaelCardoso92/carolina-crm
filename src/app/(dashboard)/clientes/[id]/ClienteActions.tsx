"use client"

import { useState } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import TransferClienteModal from "@/components/TransferClienteModal"

interface ClienteActionsProps {
  clienteId: string
  clienteNome: string
  currentSellerId: string
}

export default function ClienteActions({ clienteId, clienteNome, currentSellerId }: ClienteActionsProps) {
  const { data: session } = useSession()
  const [showTransferModal, setShowTransferModal] = useState(false)

  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "MASTERADMIN"

  return (
    <>
      <div className="flex gap-2">
        {isAdmin && (
          <button
            onClick={() => setShowTransferModal(true)}
            className="bg-amber-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-amber-600 transition flex items-center gap-2"
            title="Transferir para outro vendedor"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            Transferir
          </button>
        )}
        <Link
          href={`/clientes/${clienteId}/editar`}
          className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-hover transition"
        >
          Editar
        </Link>
      </div>

      <TransferClienteModal
        clienteId={clienteId}
        clienteNome={clienteNome}
        currentSellerId={currentSellerId}
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
      />
    </>
  )
}
