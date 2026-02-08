"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { UserRole, UserStatus } from "@prisma/client"

interface User {
  id: string
  name: string | null
  email: string
  role: UserRole
  status: UserStatus
}

interface UserFormProps {
  user?: User
  isMasterAdmin: boolean
}

export default function UserForm({ user, isMasterAdmin }: UserFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    password: "",
    role: user?.role || "SELLER" as UserRole,
    status: user?.status || "ACTIVE" as UserStatus
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const url = user ? `/api/admin/users/${user.id}` : "/api/admin/users"
      const method = user ? "PATCH" : "POST"

      // Dont send empty password on update
      const body: Record<string, string> = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        status: formData.status
      }

      if (formData.password) {
        body.password = formData.password
      }

      // Require password for new users
      if (!user && !formData.password) {
        setError("Senha e obrigatoria para novos usuarios")
        setLoading(false)
        return
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Erro ao salvar usuario")
      }

      router.push("/admin/usuarios")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar usuario")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card rounded-2xl border border-border p-6 space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Nome
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          placeholder="Nome do usuario"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
          className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          placeholder="email@exemplo.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Senha {!user && <span className="text-red-500">*</span>}
        </label>
        <input
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required={!user}
          className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          placeholder={user ? "Deixe vazio para manter a senha atual" : "Senha do usuario"}
        />
      </div>

      {isMasterAdmin ? (
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Cargo <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
            className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="SELLER">Vendedor (conta standard)</option>
            <option value="ADMIN">Admin (gere vendedores)</option>
            <option value="MASTERADMIN">Master Admin (acesso total + gestao de usuarios)</option>
          </select>
          <p className="mt-1 text-sm text-muted-foreground">
            {formData.role === "SELLER" && "Acesso completo ao sistema, exceto gestao de utilizadores"}
            {formData.role === "ADMIN" && "Tudo o que o vendedor pode fazer + gestao de vendedores"}
            {formData.role === "MASTERADMIN" && "Acesso total ao sistema incluindo gestao de usuarios"}
          </p>
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Cargo
          </label>
          <div className="px-4 py-3 rounded-xl border border-border bg-muted text-muted-foreground">
            Vendedor (conta standard)
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Acesso completo ao sistema, exceto gestao de utilizadores
          </p>
          <input type="hidden" name="role" value="SELLER" />
        </div>
      )}

      {user && (
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Status
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as UserStatus })}
            className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="ACTIVE">Ativo</option>
            <option value="INACTIVE">Inativo</option>
            <option value="PENDING">Pendente</option>
          </select>
        </div>
      )}

      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-medium hover:bg-primary-hover transition disabled:opacity-50"
        >
          {loading ? "Salvando..." : user ? "Atualizar" : "Criar Vendedor"}
        </button>
        <Link
          href="/admin/usuarios"
          className="px-6 py-3 rounded-xl border border-border hover:bg-muted transition text-center"
        >
          Cancelar
        </Link>
      </div>
    </form>
  )
}
