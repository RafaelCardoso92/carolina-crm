"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { UserRole, UserStatus } from "@prisma/client"

interface User {
  id: string
  name: string | null
  email: string
  role: UserRole
  status: UserStatus
  lastLoginAt: Date | null
  createdAt: Date
  _count: {
    clientes: number
  }
}

interface UsersListProps {
  users: User[]
  currentUserId: string
}

const roleLabels: Record<UserRole, string> = {
  MASTERADMIN: "Master Admin",
  ADMIN: "Admin",
  SELLER: "Vendedor"
}

const roleColors: Record<UserRole, string> = {
  MASTERADMIN: "bg-purple-100 text-purple-700",
  ADMIN: "bg-blue-100 text-blue-700",
  SELLER: "bg-green-100 text-green-700"
}

const statusLabels: Record<UserStatus, string> = {
  ACTIVE: "Ativo",
  INACTIVE: "Inativo",
  PENDING: "Pendente"
}

const statusColors: Record<UserStatus, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  INACTIVE: "bg-red-100 text-red-700",
  PENDING: "bg-yellow-100 text-yellow-700"
}

export default function UsersList({ users, currentUserId }: UsersListProps) {
  const router = useRouter()
  const { update: updateSession } = useSession()
  const [loading, setLoading] = useState<string | null>(null)

  const handleImpersonate = async (user: User) => {
    if (loading) return

    setLoading(user.id)
    try {
      const res = await fetch("/api/admin/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Erro ao impersonar")
      }

      const data = await res.json()

      // Update the session with impersonation data
      await updateSession({
        impersonating: data.impersonating
      })

      router.refresh()
      router.push("/")
    } catch (error) {
      console.error("Error impersonating:", error)
      alert(error instanceof Error ? error.message : "Erro ao impersonar usuario")
    } finally {
      setLoading(null)
    }
  }

  const handleDeactivate = async (user: User) => {
    if (loading) return
    if (!confirm(`Tem certeza que deseja desativar ${user.name || user.email}?`)) return

    setLoading(user.id)
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "DELETE"
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Erro ao desativar")
      }

      router.refresh()
    } catch (error) {
      console.error("Error deactivating:", error)
      alert(error instanceof Error ? error.message : "Erro ao desativar usuario")
    } finally {
      setLoading(null)
    }
  }

  const handleActivate = async (user: User) => {
    if (loading) return

    setLoading(user.id)
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACTIVE" })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Erro ao ativar")
      }

      router.refresh()
    } catch (error) {
      console.error("Error activating:", error)
      alert(error instanceof Error ? error.message : "Erro ao ativar usuario")
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Usuario</th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Cargo</th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Ultimo Login</th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Clientes</th>
              <th className="text-right p-4 text-sm font-medium text-muted-foreground">Acoes</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition">
                <td className="p-4">
                  <div>
                    <p className="font-medium text-foreground">{user.name || "-"}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${roleColors[user.role]}`}>
                    {roleLabels[user.role]}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[user.status]}`}>
                    {statusLabels[user.status]}
                  </span>
                </td>
                <td className="p-4 text-sm text-muted-foreground">
                  {user.lastLoginAt
                    ? new Date(user.lastLoginAt).toLocaleDateString("pt-PT", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })
                    : "Nunca"}
                </td>
                <td className="p-4 text-sm text-muted-foreground">
                  {user._count.clientes}
                </td>
                <td className="p-4">
                  <div className="flex items-center justify-end gap-2">
                    {/* Edit button */}
                    <button
                      onClick={() => router.push(`/admin/usuarios/${user.id}`)}
                      className="p-2 hover:bg-muted rounded-lg transition"
                      title="Editar"
                    >
                      <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>

                    {/* Impersonate button - only for non-self and non-MASTERADMIN */}
                    {user.id !== currentUserId && user.role !== "MASTERADMIN" && user.status === "ACTIVE" && (
                      <button
                        onClick={() => handleImpersonate(user)}
                        disabled={loading === user.id}
                        className="p-2 hover:bg-muted rounded-lg transition disabled:opacity-50"
                        title="Impersonar"
                      >
                        <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                    )}

                    {/* Deactivate/Activate button - not for self */}
                    {user.id !== currentUserId && (
                      user.status === "ACTIVE" ? (
                        <button
                          onClick={() => handleDeactivate(user)}
                          disabled={loading === user.id}
                          className="p-2 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                          title="Desativar"
                        >
                          <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                          </svg>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleActivate(user)}
                          disabled={loading === user.id}
                          className="p-2 hover:bg-green-50 rounded-lg transition disabled:opacity-50"
                          title="Ativar"
                        >
                          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                      )
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
