import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import UsersList from "./UsersList"

export const dynamic = 'force-dynamic'

async function getUsers() {
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      lastLoginAt: true,
      createdAt: true,
      _count: {
        select: {
          clientes: true,
        }
      }
    }
  })
}

export default async function UsuariosPage() {
  const session = await auth()

  // Only MASTERADMIN can access this page
  if (!session?.user || session.user.role !== "MASTERADMIN") {
    redirect("/")
  }

  const users = await getUsers()

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-medium tracking-wide text-foreground">Gestao de Usuarios</h1>
          <p className="text-muted-foreground">{users.length} usuarios registados</p>
        </div>
        <Link
          href="/admin/usuarios/novo"
          className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-medium hover:bg-primary-hover transition flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Novo Usuario
        </Link>
      </div>

      <UsersList users={users} currentUserId={session.user.id} />
    </div>
  )
}
