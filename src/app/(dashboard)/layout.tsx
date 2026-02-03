"use client"

import { useSession } from "next-auth/react"
import Sidebar from "@/components/Sidebar"
import ImpersonationBanner from "@/components/ImpersonationBanner"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session } = useSession()
  const isImpersonating = session?.user?.impersonating

  return (
    <div className="flex min-h-screen bg-background">
      <ImpersonationBanner />
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Add padding-top for mobile header (pt-16) and impersonation banner (extra pt-11 when impersonating) */}
        <main className={`flex-1 p-4 md:p-6 lg:p-8 pt-20 lg:pt-8 ${isImpersonating ? "!pt-[7.5rem] lg:!pt-[4.75rem]" : ""}`}>
          {children}
        </main>
        <footer className="py-4 px-4 md:px-8 border-t border-border text-center">
          <p className="text-sm text-muted-foreground">
            Criado por{" "}
            <a
              href="https://rafaelcardoso.co.uk"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary-hover transition font-medium"
            >
              Rafael Cardoso
            </a>
            <span className="mx-2">•</span>
            <span className="font-medium">v2.2.5</span>
            <span className="ml-1 px-1.5 py-0.5 text-xs font-bold bg-primary/10 text-primary rounded">β</span>
          </p>
        </footer>
      </div>
    </div>
  )
}
