import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import UserForm from "../UserForm"

export default async function NovoUsuarioPage() {
  const session = await auth()

  if (!session?.user || session.user.role !== "MASTERADMIN") {
    redirect("/")
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-medium tracking-wide text-foreground">Novo Usuario</h1>
        <p className="text-muted-foreground">Criar uma nova conta de usuario</p>
      </div>

      <UserForm />
    </div>
  )
}
