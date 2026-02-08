import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import UserForm from "../UserForm"

export const dynamic = "force-dynamic"

interface EditUsuarioPageProps {
  params: Promise<{ id: string }>
}

export default async function EditUsuarioPage({ params }: EditUsuarioPageProps) {
  const session = await auth()

  // ADMIN and MASTERADMIN can access
  if (!session?.user || (session.user.role !== "MASTERADMIN" && session.user.role !== "ADMIN")) {
    redirect("/")
  }

  const isMasterAdmin = session.user.role === "MASTERADMIN"
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

  // ADMIN cannot edit ADMIN or MASTERADMIN accounts
  if (!isMasterAdmin && user.role !== "SELLER") {
    redirect("/admin/usuarios")
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-medium tracking-wide text-foreground">
          {isMasterAdmin ? "Editar Usuario" : "Editar Vendedor"}
        </h1>
        <p className="text-muted-foreground">{user.name || user.email}</p>
      </div>

      <UserForm user={user} isMasterAdmin={isMasterAdmin} />
    </div>
  )
}
