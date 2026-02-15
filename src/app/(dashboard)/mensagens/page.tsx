"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { isAdminOrHigher } from "@/lib/permissions"
import SendMessageModal from "@/components/SendMessageModal"

interface Message {
  id: string
  content: string
  entityType: string
  entityId: string | null
  entityName: string | null
  priority: string
  flagged: boolean
  read: boolean
  readAt: string | null
  createdAt: string
  sender: { id: string; name: string | null; email: string }
  recipient: { id: string; name: string | null; email: string }
  replies: Message[]
  _count?: { replies: number }
}

const priorityColors: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-600",
  NORMAL: "bg-blue-100 text-blue-600",
  HIGH: "bg-orange-100 text-orange-600",
  URGENT: "bg-red-100 text-red-600"
}

const priorityLabels: Record<string, string> = {
  LOW: "Baixa",
  NORMAL: "Normal",
  HIGH: "Alta",
  URGENT: "Urgente"
}

const entityLabels: Record<string, string> = {
  CLIENTE: "Cliente",
  VENDA: "Venda",
  COBRANCA: "Cobranca",
  PROSPECTO: "Prospecto",
  TAREFA: "Tarefa",
  GERAL: "Geral"
}

export default function MensagensPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "unread" | "flagged">("all")
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [showNewMessage, setShowNewMessage] = useState(false)
  const [replyContent, setReplyContent] = useState("")
  const [sendingReply, setSendingReply] = useState(false)

  const isAdmin = session?.user?.role && isAdminOrHigher(session.user.role)

  useEffect(() => {
    fetchMessages()
  }, [filter])

  async function fetchMessages() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter === "unread") params.set("unread", "true")
      
      const res = await fetch(`/api/messages?${params}`)
      if (res.ok) {
        let data = await res.json()
        if (filter === "flagged") {
          data = data.filter((m: Message) => m.flagged)
        }
        setMessages(data)
      }
    } catch (error) {
      console.error("Error fetching messages:", error)
    } finally {
      setLoading(false)
    }
  }

  async function markAsRead(id: string) {
    try {
      const res = await fetch(`/api/messages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read: true })
      })
      if (res.ok) {
        // Update local state immediately
        setMessages(prev => prev.map(m =>
          m.id === id ? { ...m, read: true, readAt: new Date().toISOString() } : m
        ))
        if (selectedMessage?.id === id) {
          setSelectedMessage(prev => prev ? { ...prev, read: true, readAt: new Date().toISOString() } : null)
        }
        // Dispatch event to update sidebar unread count
        window.dispatchEvent(new CustomEvent('messageRead'))
      } else {
        const errorData = await res.json().catch(() => ({}))
        console.error("Failed to mark as read:", res.status, errorData)
      }
    } catch (error) {
      console.error("Error marking as read:", error)
    }
  }

  async function toggleFlag(id: string, currentFlag: boolean) {
    try {
      await fetch(`/api/messages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flagged: !currentFlag })
      })
      fetchMessages()
      if (selectedMessage?.id === id) {
        setSelectedMessage({ ...selectedMessage, flagged: !currentFlag })
      }
    } catch (error) {
      console.error("Error toggling flag:", error)
    }
  }

  async function sendReply() {
    if (!selectedMessage || !replyContent.trim()) return
    
    setSendingReply(true)
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId: selectedMessage.sender.id === session?.user?.id 
            ? selectedMessage.recipient.id 
            : selectedMessage.sender.id,
          content: replyContent,
          entityType: selectedMessage.entityType,
          entityId: selectedMessage.entityId,
          entityName: selectedMessage.entityName,
          parentId: selectedMessage.id
        })
      })
      
      if (res.ok) {
        setReplyContent("")
        // Refresh message to get new reply
        const msgRes = await fetch(`/api/messages/${selectedMessage.id}`)
        if (msgRes.ok) {
          const updated = await msgRes.json()
          setSelectedMessage(updated)
        }
        fetchMessages()
      }
    } catch (error) {
      console.error("Error sending reply:", error)
    } finally {
      setSendingReply(false)
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Mensagens</h1>
          <p className="text-muted-foreground">Comunicacao interna sobre trabalho</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowNewMessage(true)}
            className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-semibold hover:bg-primary-hover transition flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nova Mensagem
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        {["all", "unread", "flagged"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === f
                ? "bg-primary text-white"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {f === "all" ? "Todas" : f === "unread" ? "Nao lidas" : "Sinalizadas"}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Messages List */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="max-h-[600px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">A carregar...</div>
            ) : messages.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">Nenhuma mensagem</div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  onClick={() => {
                    setSelectedMessage(msg)
                    // Mark as read if unread - API will check if user is recipient
                    if (!msg.read) {
                      markAsRead(msg.id)
                    }
                  }}
                  className={`p-4 border-b border-border cursor-pointer hover:bg-muted/50 transition ${
                    selectedMessage?.id === msg.id ? "bg-muted" : ""
                  } ${!msg.read && msg.recipient.id === session?.user?.id ? "bg-primary/5" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {msg.flagged && (
                          <span className="text-red-500">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M3 3v18h2v-8h14l-2-4 2-4H5V3H3z"/>
                            </svg>
                          </span>
                        )}
                        {!msg.read && msg.recipient.id === session?.user?.id && (
                          <span className="w-2 h-2 bg-primary rounded-full"></span>
                        )}
                        <span className="font-medium text-foreground truncate">
                          {msg.sender.id === session?.user?.id ? `Para: ${msg.recipient.name || msg.recipient.email}` : msg.sender.name || msg.sender.email}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{msg.content}</p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${priorityColors[msg.priority]}`}>
                          {priorityLabels[msg.priority]}
                        </span>
                        {msg.entityType !== "GERAL" && (
                          <span className="text-xs text-muted-foreground">
                            {entityLabels[msg.entityType]}: {msg.entityName || msg.entityId}
                          </span>
                        )}
                        {msg._count && msg._count.replies > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {msg._count.replies} resposta{msg._count.replies > 1 ? "s" : ""}
                          </span>
                        )}
                        {/* Read receipt for sent messages */}
                        {msg.sender.id === session?.user?.id && (
                          <span className={`flex items-center gap-1 text-xs ${msg.read ? "text-blue-600" : "text-muted-foreground"}`}>
                            {msg.read ? (
                              <>
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z"/>
                                </svg>
                                Lida
                              </>
                            ) : (
                              <>
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                                </svg>
                                Enviada
                              </>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(msg.createdAt).toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit" })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Message Detail */}
        <div className="bg-card rounded-2xl border border-border p-6">
          {selectedMessage ? (
            <div className="h-full flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-foreground">
                    {selectedMessage.sender.id === session?.user?.id
                      ? `Para: ${selectedMessage.recipient.name || selectedMessage.recipient.email}`
                      : `De: ${selectedMessage.sender.name || selectedMessage.sender.email}`
                    }
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedMessage.createdAt).toLocaleString("pt-PT")}
                  </p>
                  {/* Read receipt for sender */}
                  {selectedMessage.sender.id === session?.user?.id && (
                    <p className={`text-xs mt-1 flex items-center gap-1 ${selectedMessage.read ? "text-blue-600" : "text-muted-foreground"}`}>
                      {selectedMessage.read ? (
                        <>
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z"/>
                          </svg>
                          Lida {selectedMessage.readAt && `em ${new Date(selectedMessage.readAt).toLocaleString("pt-PT")}`}
                        </>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                          </svg>
                          Enviada, aguardando leitura
                        </>
                      )}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <button
                      onClick={() => toggleFlag(selectedMessage.id, selectedMessage.flagged)}
                      className={`p-2 rounded-lg transition ${
                        selectedMessage.flagged 
                          ? "bg-red-100 text-red-600" 
                          : "hover:bg-muted text-muted-foreground"
                      }`}
                      title={selectedMessage.flagged ? "Remover sinalizacao" : "Sinalizar problema"}
                    >
                      <svg className="w-5 h-5" fill={selectedMessage.flagged ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3v18h2v-8h14l-2-4 2-4H5V3H3z"/>
                      </svg>
                    </button>
                  )}
                  <span className={`px-2 py-1 rounded text-xs font-medium ${priorityColors[selectedMessage.priority]}`}>
                    {priorityLabels[selectedMessage.priority]}
                  </span>
                </div>
              </div>

              {selectedMessage.entityType !== "GERAL" && (
                <div className="bg-muted rounded-lg p-3 mb-4">
                  <span className="text-sm text-muted-foreground">
                    {entityLabels[selectedMessage.entityType]}: 
                  </span>
                  <span className="text-sm font-medium text-foreground ml-1">
                    {selectedMessage.entityName || selectedMessage.entityId}
                  </span>
                </div>
              )}

              <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-foreground whitespace-pre-wrap">{selectedMessage.content}</p>
                </div>

                {selectedMessage.replies?.map((reply) => (
                  <div key={reply.id} className={`rounded-lg p-4 ${
                    reply.sender.id === session?.user?.id ? "bg-primary/10 ml-8" : "bg-muted/50 mr-8"
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{reply.sender.name || reply.sender.email}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(reply.createdAt).toLocaleString("pt-PT")}
                      </span>
                    </div>
                    <p className="text-foreground whitespace-pre-wrap">{reply.content}</p>
                  </div>
                ))}
              </div>

              {/* Reply Input */}
              <div className="border-t border-border pt-4">
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Escrever resposta..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <div className="flex justify-end mt-2">
                  <button
                    onClick={sendReply}
                    disabled={!replyContent.trim() || sendingReply}
                    className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary-hover transition disabled:opacity-50"
                  >
                    {sendingReply ? "A enviar..." : "Responder"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              Selecione uma mensagem para ver detalhes
            </div>
          )}
        </div>
      </div>

      {showNewMessage && (
        <SendMessageModal
          onClose={() => setShowNewMessage(false)}
          onSent={() => {
            setShowNewMessage(false)
            fetchMessages()
          }}
        />
      )}
    </div>
  )
}
