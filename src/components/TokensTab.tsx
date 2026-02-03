"use client"

import { useState, useEffect } from "react"
import Swal from "sweetalert2"

type TokenBalance = {
  total: number
  used: number
  remaining: number
  totalFormatted: string
  usedFormatted: string
  remainingFormatted: string
}

type TokenUsage = {
  id: string
  inputTokens: number
  outputTokens: number
  totalTokens: number
  costEur: number
  feature: string
  createdAt: string
}

type TokenPurchase = {
  id: string
  tokens: number
  amountEur: number
  status: string
  createdAt: string
}

type UserWithTokens = {
  id: string
  name: string | null
  email: string
  role: string
  tokensTotal: number
  tokensUsed: number
  tokensRemaining: number
}

interface TokensTabProps {
  isAdmin: boolean
}

const MIN_PURCHASE = 5
const TOKENS_PER_EUR = 200000

function formatTokens(tokens: number): string {
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(2)}M`
  } else if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}K`
  }
  return tokens.toString()
}

export default function TokensTab({ isAdmin }: TokensTabProps) {
  const [balance, setBalance] = useState<TokenBalance | null>(null)
  const [usage, setUsage] = useState<TokenUsage[]>([])
  const [purchases, setPurchases] = useState<TokenPurchase[]>([])
  const [users, setUsers] = useState<UserWithTokens[]>([])
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(false)
  const [allocating, setAllocating] = useState(false)
  
  // Purchase form
  const [purchaseAmount, setPurchaseAmount] = useState("5")
  
  // Allocation form (admin only)
  const [selectedUserId, setSelectedUserId] = useState("")
  const [allocateTokens, setAllocateTokens] = useState("")
  const [allocateReason, setAllocateReason] = useState("")

  useEffect(() => {
    fetchData()
    
    // Check for success/cancel from Stripe redirect
    const params = new URLSearchParams(window.location.search)
    if (params.get("success") === "true") {
      Swal.fire({
        icon: "success",
        title: "Compra concluida!",
        text: "Os tokens foram adicionados a sua conta.",
        confirmButtonColor: "#b8860b"
      })
      // Clean URL
      window.history.replaceState({}, "", "/definicoes?tab=tokens")
    } else if (params.get("canceled") === "true") {
      Swal.fire({
        icon: "info",
        title: "Compra cancelada",
        text: "A compra foi cancelada.",
        confirmButtonColor: "#b8860b"
      })
      window.history.replaceState({}, "", "/definicoes?tab=tokens")
    }
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const [tokensRes, usersRes] = await Promise.all([
        fetch("/api/tokens?usage=true"),
        isAdmin ? fetch("/api/tokens/allocate") : Promise.resolve(null)
      ])

      if (tokensRes.ok) {
        const data = await tokensRes.json()
        setBalance(data.balance)
        setUsage(data.usage || [])
        setPurchases(data.purchases || [])
      }

      if (usersRes?.ok) {
        const usersData = await usersRes.json()
        setUsers(usersData)
      }
    } catch (error) {
      console.error("Error fetching token data:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handlePurchase() {
    const amount = parseFloat(purchaseAmount)
    if (isNaN(amount) || amount < MIN_PURCHASE) {
      Swal.fire({
        icon: "error",
        title: "Valor invalido",
        text: `O valor minimo e €${MIN_PURCHASE}`,
        confirmButtonColor: "#b8860b"
      })
      return
    }

    if (amount > 1000) {
      Swal.fire({
        icon: "error",
        title: "Valor invalido",
        text: "O valor maximo por compra e €1000",
        confirmButtonColor: "#b8860b"
      })
      return
    }

    setPurchasing(true)
    try {
      const res = await fetch("/api/tokens/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount })
      })

      const data = await res.json()
      
      if (res.ok && data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url
      } else {
        throw new Error(data.error || "Erro ao criar sessao de pagamento")
      }
    } catch (error) {
      console.error("Purchase error:", error)
      Swal.fire({
        icon: "error",
        title: "Erro",
        text: error instanceof Error ? error.message : "Erro ao processar compra",
        confirmButtonColor: "#b8860b"
      })
    } finally {
      setPurchasing(false)
    }
  }

  async function handleAllocate() {
    if (!selectedUserId || !allocateTokens) {
      Swal.fire({
        icon: "error",
        title: "Dados em falta",
        text: "Selecione um utilizador e quantidade de tokens",
        confirmButtonColor: "#b8860b"
      })
      return
    }

    const tokens = parseInt(allocateTokens)
    if (isNaN(tokens) || tokens <= 0) {
      Swal.fire({
        icon: "error",
        title: "Valor invalido",
        text: "Insira um numero valido de tokens",
        confirmButtonColor: "#b8860b"
      })
      return
    }

    setAllocating(true)
    try {
      const res = await fetch("/api/tokens/allocate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUserId,
          tokens,
          reason: allocateReason || "Admin allocation"
        })
      })

      const data = await res.json()

      if (res.ok) {
        Swal.fire({
          icon: "success",
          title: "Tokens alocados!",
          text: `${formatTokens(tokens)} tokens alocados a ${data.user.name || data.user.email}`,
          confirmButtonColor: "#b8860b"
        })
        setSelectedUserId("")
        setAllocateTokens("")
        setAllocateReason("")
        fetchData()
      } else {
        throw new Error(data.error || "Erro ao alocar tokens")
      }
    } catch (error) {
      console.error("Allocation error:", error)
      Swal.fire({
        icon: "error",
        title: "Erro",
        text: error instanceof Error ? error.message : "Erro ao alocar tokens",
        confirmButtonColor: "#b8860b"
      })
    } finally {
      setAllocating(false)
    }
  }

  const tokensForAmount = Math.floor(parseFloat(purchaseAmount || "0") * TOKENS_PER_EUR)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">A carregar...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Balance Card */}
      <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-6 border border-primary/20">
        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Saldo de Tokens
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-primary">{balance?.remainingFormatted || "0"}</p>
            <p className="text-sm text-muted-foreground">Disponiveis</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-foreground">{balance?.usedFormatted || "0"}</p>
            <p className="text-sm text-muted-foreground">Usados</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-muted-foreground">{balance?.totalFormatted || "0"}</p>
            <p className="text-sm text-muted-foreground">Total</p>
          </div>
        </div>
        {balance && balance.total > 0 && (
          <div className="mt-4">
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all" 
                style={{ width: `${Math.min(100, (balance.remaining / balance.total) * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Purchase Section */}
      <div className="bg-card rounded-2xl p-6 border border-border">
        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Comprar Tokens
        </h3>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-4">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Preco:</strong> €5 por 1 milhao de tokens
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
            Minimo: €{MIN_PURCHASE} ({formatTokens(MIN_PURCHASE * TOKENS_PER_EUR)} tokens)
          </p>
        </div>
        <div className="flex gap-3 items-end">
          <div className="w-32">
            <label className="block text-sm font-medium text-foreground mb-1">Valor em €</label>
            <input
              type="number"
              min={MIN_PURCHASE}
              max={1000}
              step="1"
              value={purchaseAmount}
              onChange={(e) => setPurchaseAmount(e.target.value)}
              className="w-full px-4 py-3 border-2 border-border rounded-xl bg-background text-foreground font-medium focus:ring-2 focus:ring-primary focus:border-primary outline-none text-center"
            />
          </div>
          <div className="flex-1">
            {tokensForAmount > 0 && (
              <p className="text-sm text-muted-foreground py-3">
                = {formatTokens(tokensForAmount)} tokens
              </p>
            )}
          </div>
          <div>
            <button
              onClick={handlePurchase}
              disabled={purchasing}
              className="px-6 py-3 bg-success text-white rounded-xl font-bold hover:bg-success/90 transition disabled:opacity-50 flex items-center gap-2"
            >
              {purchasing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  A processar...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  Comprar
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Admin Allocation Section */}
      {isAdmin && (
        <div className="bg-card rounded-2xl p-6 border border-amber-500/30">
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            Alocar Tokens (Admin)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-1">Utilizador</label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full px-4 py-3 border-2 border-border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              >
                <option value="">Selecionar utilizador...</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name || user.email} ({formatTokens(user.tokensRemaining)} disponiveis)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Tokens</label>
              <input
                type="number"
                min={1}
                value={allocateTokens}
                onChange={(e) => setAllocateTokens(e.target.value)}
                placeholder="Ex: 1000000"
                className="w-full px-4 py-3 border-2 border-border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleAllocate}
                disabled={allocating}
                className="w-full px-6 py-3 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition disabled:opacity-50"
              >
                {allocating ? "A alocar..." : "Alocar"}
              </button>
            </div>
          </div>
          <div className="mt-3">
            <input
              type="text"
              value={allocateReason}
              onChange={(e) => setAllocateReason(e.target.value)}
              placeholder="Razao (opcional)"
              className="w-full px-4 py-2 border border-border rounded-xl bg-background text-foreground text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            />
          </div>

          {/* Users Table */}
          {users.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-semibold text-muted-foreground mb-2">Saldos por Utilizador</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 font-semibold">Utilizador</th>
                      <th className="text-right py-2 px-3 font-semibold">Total</th>
                      <th className="text-right py-2 px-3 font-semibold">Usados</th>
                      <th className="text-right py-2 px-3 font-semibold">Disponiveis</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b border-border/50">
                        <td className="py-2 px-3">
                          <div>
                            <p className="font-medium">{user.name || "Sem nome"}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </td>
                        <td className="text-right py-2 px-3">{formatTokens(user.tokensTotal)}</td>
                        <td className="text-right py-2 px-3">{formatTokens(user.tokensUsed)}</td>
                        <td className="text-right py-2 px-3 font-semibold text-primary">{formatTokens(user.tokensRemaining)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recent Usage */}
      {usage.length > 0 && (
        <div className="bg-card rounded-2xl p-6 border border-border">
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Uso Recente (30 dias)
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {usage.slice(0, 20).map((u) => (
              <div key={u.id} className="flex justify-between items-center py-2 px-3 bg-muted/50 rounded-lg text-sm">
                <div>
                  <span className="font-medium capitalize">{u.feature.replace("_", " ")}</span>
                  <span className="text-muted-foreground ml-2">
                    {new Date(u.createdAt).toLocaleDateString("pt-PT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-medium">{formatTokens(u.totalTokens)}</span>
                  <span className="text-muted-foreground ml-1">tokens</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Purchase History */}
      {purchases.length > 0 && (
        <div className="bg-card rounded-2xl p-6 border border-border">
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Historico de Compras
          </h3>
          <div className="space-y-2">
            {purchases.map((p) => (
              <div key={p.id} className="flex justify-between items-center py-2 px-3 bg-muted/50 rounded-lg text-sm">
                <div>
                  <span className="font-medium">€{p.amountEur.toFixed(2)}</span>
                  <span className="text-muted-foreground ml-2">
                    {new Date(p.createdAt).toLocaleDateString("pt-PT")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span>{formatTokens(p.tokens)} tokens</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    p.status === "COMPLETED" ? "bg-success/10 text-success" :
                    p.status === "PENDING" ? "bg-amber-100 text-amber-700" :
                    "bg-red-100 text-red-700"
                  }`}>
                    {p.status === "COMPLETED" ? "Concluido" : 
                     p.status === "PENDING" ? "Pendente" : 
                     p.status === "REFUNDED" ? "Reembolsado" : "Falhado"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
