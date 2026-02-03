import { NextResponse } from "next/server"

const manifest = {
  name: "Baborette",
  short_name: "BABOR CRM",
  description: "Sistema de gestao de clientes e vendas BABOR",
  start_url: "/",
  display: "standalone",
  background_color: "#ffffff",
  theme_color: "#005290",
  orientation: "portrait-primary",
  icons: [
    {
      src: "/icon-192.png",
      sizes: "192x192",
      type: "image/png",
      purpose: "any maskable"
    },
    {
      src: "/icon-512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "any maskable"
    }
  ],
  categories: ["business", "productivity"],
  shortcuts: [
    { name: "Dashboard", url: "/", description: "Ver dashboard" },
    { name: "Clientes", url: "/clientes", description: "Gerir clientes" },
    { name: "Vendas", url: "/vendas", description: "Registar vendas" },
    { name: "Tarefas", url: "/tarefas", description: "Ver tarefas" }
  ]
}

export const dynamic = "force-dynamic"

export async function GET() {
  return NextResponse.json(manifest, {
    headers: {
      "Cache-Control": "public, max-age=0",
    },
  })
}
