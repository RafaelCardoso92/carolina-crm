import UnifiedMap from "@/components/UnifiedMap"

export const metadata = {
  title: "Mapa | Baborette CRM",
  description: "Mapa de clientes e prospectos",
}

export default function MapaPage() {
  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Mapa</h1>
        <p className="text-muted-foreground mt-1">
          Visualize clientes e prospectos no mapa, e descubra novos saloes na area
        </p>
      </div>

      <UnifiedMap />
    </div>
  )
}
