import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import UserForm from "../UserForm"

export const dynamic = 'force-dynamic'

interface EditUsuarioPageProps {
  params: Promise<{ id: string }>
}

export default async function EditUsuarioPage({ params }: EditUsuarioPageProps) {
  const session = await auth()

  if (!session?.user || session.user.role !== "MASTERADMIN") {
    redirect("/")
  }

  const { id } = await params

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true
    }
  })

  if (!user) {
    notFound()
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-medium tracking-wide text-foreground">Editar Usuario</h1>
        <p className="text-muted-foreground">{user.name || user.email}</p>
      </div>

      <UserForm user={user} />
    </div>
  )
}
