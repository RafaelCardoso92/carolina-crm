import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import UserForm from "../UserForm"

export default async function NovoUsuarioPage() {
  const session = await auth()

  // ADMIN and MASTERADMIN can access
  if (!session?.user || (session.user.role !== "MASTERADMIN" && session.user.role !== "ADMIN")) {
    redirect("/")
  }

  const isMasterAdmin = session.user.role === "MASTERADMIN"

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-medium tracking-wide text-foreground">
          {isMasterAdmin ? "Novo Usuario" : "Novo Vendedor"}
        </h1>
        <p className="text-muted-foreground">
          {isMasterAdmin ? "Criar uma nova conta de usuario" : "Criar uma nova conta de vendedor"}
        </p>
      </div>

      <UserForm isMasterAdmin={isMasterAdmin} />
    </div>
  )
}
