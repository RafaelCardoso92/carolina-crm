"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import HelpTooltip from "./HelpTooltip"

interface Tarefa {
  id: string
  titulo: string
  tipo: string | null
  prioridade: "BAIXA" | "MEDIA" | "ALTA" | "URGENTE"
  estado: string
  dataVencimento: string | null
  cliente: { id: string; nome: string } | null
  prospecto: { id: string; nomeEmpresa: string } | null
}

interface ClienteFollowUp {
  id: string
  nome: string
  codigo: string | null
  telefone: string | null
  ultimoContacto: string | null
  diasSemContacto: number | null
  segmento: { segmento: string } | null
  ultimaVenda: { total: string; mes: number; ano: number } | null
}

const prioridadeColors = {
  BAIXA: "border-l-gray-400",
  MEDIA: "border-l-blue-500",
  ALTA: "border-l-orange-500",
  URGENTE: "border-l-red-500"
}

const prioridadeLabels = {
  BAIXA: "Baixa",
  MEDIA: "Media",
  ALTA: "Alta",
  URGENTE: "Urgente"
}

export function TarefasWidget() {
  const [tarefas, setTarefas] = useState<Tarefa[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTarefas() {
      try {
        const [pendentes, atrasadas] = await Promise.all([
          fetch("/api/tarefas?hoje=true&limit=5").then(r => r.json()),
          fetch("/api/tarefas?atrasadas=true&limit=5").then(r => r.json())
        ])
        // Combine and dedupe
        const all = [...atrasadas, ...pendentes]
        const unique = all.filter((t, i) => all.findIndex(x => x.id === t.id) === i)
        setTarefas(unique.slice(0, 5))
      } catch (error) {
        console.error("Error:", error)
      }
      setLoading(false)
    }
    fetchTarefas()
  }, [])

  if (loading) {
    return (
      <div className="bg-card rounded-xl shadow-sm p-6 border-l-4 border-primary">
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-muted rounded w-1/3"></div>
          <div className="h-4 bg-muted rounded w-full"></div>
          <div className="h-4 bg-muted rounded w-full"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-xl shadow-sm p-6 border-l-4 border-primary">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-foreground flex items-center gap-2">
          <span className="p-2 bg-primary/10 rounded-lg">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </span>
          Tarefas
          <HelpTooltip text="Tarefas pendentes para hoje e atrasadas. A cor da borda indica a prioridade: cinza=baixa, azul=media, laranja=alta, vermelho=urgente." />
        </h3>
        <Link href="/tarefas" className="text-sm text-primary hover:underline">
          Ver todas
        </Link>
      </div>

      {tarefas.length === 0 ? (
        <div className="text-center py-4">
          <svg className="w-12 h-12 text-green-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-muted-foreground text-sm">Nenhuma tarefa pendente - bom trabalho!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tarefas.map(tarefa => {
            const isOverdue = tarefa.dataVencimento && new Date(tarefa.dataVencimento) < new Date()
            return (
              <Link
                key={tarefa.id}
                href="/tarefas"
                className={`block p-3 rounded-lg bg-secondary/50 border-l-4 ${prioridadeColors[tarefa.prioridade]} hover:bg-secondary transition`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">{tarefa.titulo}</p>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-1">
                      {tarefa.tipo && (
                        <span className="bg-secondary px-2 py-0.5 rounded">{tarefa.tipo}</span>
                      )}
                      <span className={`px-2 py-0.5 rounded ${
                        tarefa.prioridade === "URGENTE" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                        tarefa.prioridade === "ALTA" ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" :
                        "bg-secondary"
                      }`}>
                        {prioridadeLabels[tarefa.prioridade]}
                      </span>
                      {tarefa.dataVencimento && (
                        <span className={isOverdue ? "text-red-600 dark:text-red-400 font-medium" : ""}>
                          {new Date(tarefa.dataVencimento).toLocaleDateString("pt-PT")}
                          {isOverdue && " (Atrasada)"}
                        </span>
                      )}
                    </div>
                    {(tarefa.cliente || tarefa.prospecto) && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {tarefa.cliente?.nome || tarefa.prospecto?.nomeEmpresa}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function FollowUpWidget() {
  const [clientes, setClientes] = useState<ClienteFollowUp[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchFollowUp() {
      try {
        const res = await fetch("/api/dashboard/followup?dias=30")
        const data = await res.json()
        setClientes(data.slice(0, 5))
      } catch (error) {
        console.error("Error:", error)
      }
      setLoading(false)
    }
    fetchFollowUp()
  }, [])

  if (loading) {
    return (
      <div className="bg-card rounded-xl shadow-sm p-6 border-l-4 border-orange-500">
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-muted rounded w-1/3"></div>
          <div className="h-4 bg-muted rounded w-full"></div>
          <div className="h-4 bg-muted rounded w-full"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-xl shadow-sm p-6 border-l-4 border-orange-500">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-foreground flex items-center gap-2">
          <span className="p-2 bg-orange-500/10 rounded-lg">
            <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
          Follow-up Necessario
          <HelpTooltip text="Clientes ativos que nao foram contactados nos ultimos 30 dias. Manter contacto regular aumenta a fidelizacao." />
        </h3>
      </div>

      {clientes.length === 0 ? (
        <div className="text-center py-4">
          <svg className="w-12 h-12 text-green-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
          </svg>
          <p className="text-muted-foreground text-sm">Todos os clientes contactados recentemente!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {clientes.map(cliente => (
            <div
              key={cliente.id}
              className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition"
            >
              <Link
                href={`/clientes/${cliente.id}`}
                className="flex-1 min-w-0"
              >
                <p className="font-medium text-foreground text-sm truncate">{cliente.nome}</p>
                <p className="text-xs text-muted-foreground">
                  {cliente.diasSemContacto === null
                    ? "Nunca contactado"
                    : `${cliente.diasSemContacto} dias sem contacto`}
                  {cliente.segmento && (
                    <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                      cliente.segmento.segmento === "A" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                      cliente.segmento.segmento === "B" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                      "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                    }`}>
                      Segmento {cliente.segmento.segmento}
                    </span>
                  )}
                </p>
              </Link>
              {cliente.telefone && (
                <a
                  href={`https://wa.me/351${cliente.telefone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition ml-2 flex-shrink-0"
                  title="Contactar via WhatsApp"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
