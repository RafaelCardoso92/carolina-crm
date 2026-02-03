"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Swal from "sweetalert2"

type Message = {
  role: "user" | "assistant"
  content: string
  timestamp?: string
  tokensUsed?: number
}

type TokenBalance = {
  remaining: number
  isNegative: boolean
}

interface ChatBaborellaProps {
  entityType: "cliente" | "prospecto"
  entityId: string
  entityName: string
  context: string
}

export default function ChatBaborella({ entityType, entityId, entityName, context }: ChatBaborellaProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [tokens, setTokens] = useState<TokenBalance | null>(null)
  const [lastTokensUsed, setLastTokensUsed] = useState<number | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      fetchChat()
      inputRef.current?.focus()
    }
  }, [isOpen])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  async function fetchChat() {
    try {
      const res = await fetch(`/api/ai/baborella?entityType=${entityType}&entityId=${entityId}`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
        setTokens(data.tokens)
      }
    } catch (error) {
      console.error("Error fetching chat:", error)
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || loading) return

    if (tokens?.isNegative) {
      Swal.fire({
        icon: "warning",
        title: "Tokens esgotados",
        html: "Precisas de mais tokens para continuar a conversar com a Baborella.",
        confirmButtonText: "Comprar Tokens",
        confirmButtonColor: "#ec4899",
        showCancelButton: true,
        cancelButtonText: "Cancelar"
      }).then((result) => {
        if (result.isConfirmed) {
          window.location.href = "/definicoes?tab=tokens"
        }
      })
      return
    }

    const userMessage = input.trim()
    setInput("")
    setLoading(true)
    setLastTokensUsed(null)

    // Optimistically add user message
    setMessages(prev => [...prev, {
      role: "user",
      content: userMessage,
      timestamp: new Date().toISOString()
    }])

    try {
      const res = await fetch("/api/ai/baborella", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityType,
          entityId,
          message: userMessage,
          context
        })
      })

      const data = await res.json()

      if (res.status === 402) {
        Swal.fire({
          icon: "warning",
          title: "Tokens insuficientes",
          text: "Precisas de mais tokens para continuar.",
          confirmButtonText: "Comprar Tokens",
          confirmButtonColor: "#ec4899"
        }).then(() => {
          window.location.href = "/definicoes?tab=tokens"
        })
        // Remove optimistic message
        setMessages(prev => prev.slice(0, -1))
        return
      }

      if (res.ok) {
        setMessages(prev => [...prev, {
          role: "assistant",
          content: data.message,
          timestamp: new Date().toISOString(),
          tokensUsed: data.tokensUsed
        }])
        setTokens(data.tokens)
        setLastTokensUsed(data.tokensUsed)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error("Error sending message:", error)
      // Remove optimistic message
      setMessages(prev => prev.slice(0, -1))
      Swal.fire({
        icon: "error",
        title: "Erro",
        text: "Nao consegui enviar a mensagem. Tenta novamente!",
        confirmButtonColor: "#ec4899"
      })
    } finally {
      setLoading(false)
    }
  }

  async function clearChat() {
    const result = await Swal.fire({
      icon: "question",
      title: "Limpar conversa?",
      text: "Toda a conversa sera apagada.",
      showCancelButton: true,
      confirmButtonText: "Limpar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc2626"
    })

    if (result.isConfirmed) {
      try {
        await fetch(`/api/ai/baborella?entityType=${entityType}&entityId=${entityId}`, {
          method: "DELETE"
        })
        setMessages([])
      } catch (error) {
        console.error("Error clearing chat:", error)
      }
    }
  }

  function formatTokens(num: number): string {
    if (Math.abs(num) >= 1000000) return (num / 1000000).toFixed(2) + "M"
    if (Math.abs(num) >= 1000) return (num / 1000).toFixed(1) + "K"
    return num.toString()
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={"fixed bottom-4 right-4 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 " + (isOpen ? "bg-gray-600" : "bg-gradient-to-br from-pink-500 to-purple-600")}
        title="Falar com Baborella"
      >
        {isOpen ? (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 z-50 w-80 sm:w-96 h-[500px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-pink-200 dark:border-pink-800 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 00.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-2.47 2.47a2.25 2.25 0 01-1.591.659H9.061a2.25 2.25 0 01-1.591-.659L5 14.5m14 0V17a2 2 0 01-2 2H7a2 2 0 01-2-2v-2.5" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Baborella</h3>
                <p className="text-pink-100 text-xs">Assistente de {entityName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {tokens && (
                <Link 
                  href="/definicoes?tab=tokens"
                  className={"text-xs px-2 py-1 rounded-full font-medium " + (tokens.isNegative ? "bg-red-500 text-white" : "bg-white/20 text-white")}
                >
                  {formatTokens(tokens.remaining)}
                </Link>
              )}
              {messages.length > 0 && (
                <button
                  onClick={clearChat}
                  className="text-white/70 hover:text-white transition p-1"
                  title="Limpar conversa"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gradient-to-b from-pink-50/50 to-white dark:from-gray-800/50 dark:to-gray-900">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                </svg>
              </div>
                <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm">
                  Ola! Sou a Baborella, a tua assistente.
                </p>
                <p className="text-gray-500 dark:text-gray-500 text-xs mt-1">
                  Pergunta-me qualquer coisa sobre {entityName}!
                </p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={"flex " + (msg.role === "user" ? "justify-end" : "justify-start")}
              >
                <div
                  className={"max-w-[85%] rounded-2xl px-3 py-2 text-sm " + (
                    msg.role === "user"
                      ? "bg-gradient-to-br from-pink-500 to-purple-600 text-white rounded-br-md"
                      : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-sm border border-pink-100 dark:border-pink-900 rounded-bl-md"
                  )}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  {msg.tokensUsed && (
                    <p className={"text-[10px] mt-1 " + (msg.role === "user" ? "text-pink-200" : "text-gray-400")}>
                      {msg.tokensUsed.toLocaleString()} tokens
                    </p>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-pink-100 dark:border-pink-900">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                    <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                    <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Token usage indicator */}
          {lastTokensUsed && (
            <div className="px-3 py-1 bg-pink-50 dark:bg-pink-900/20 text-center">
              <p className="text-xs text-pink-600 dark:text-pink-400">
                Ultima resposta: {lastTokensUsed.toLocaleString()} tokens
              </p>
            </div>
          )}

          {/* Input */}
          <form onSubmit={sendMessage} className="p-3 border-t border-pink-100 dark:border-pink-900 bg-white dark:bg-gray-900">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={tokens?.isNegative ? "Adiciona tokens para continuar..." : "Escreve uma mensagem..."}
                disabled={loading || tokens?.isNegative}
                className="flex-1 px-3 py-2 text-sm rounded-xl border border-pink-200 dark:border-pink-800 bg-pink-50/50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-400 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading || !input.trim() || tokens?.isNegative}
                className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-medium hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
