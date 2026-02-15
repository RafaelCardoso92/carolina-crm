// Shared estado colors configuration
// Colors can be customized via localStorage

export interface EstadoConfig {
  value: string
  label: string
  color: string // hex color
}

export const DEFAULT_ESTADO_COLORS: EstadoConfig[] = [
  { value: "NOVO", label: "Novo", color: "#64748b" },
  { value: "CONTACTADO", label: "Contactado", color: "#3b82f6" },
  { value: "REUNIAO", label: "Reunião", color: "#f59e0b" },
  { value: "PROPOSTA", label: "Proposta", color: "#f97316" },
  { value: "NEGOCIACAO", label: "Negociação", color: "#a855f7" },
  { value: "GANHO", label: "Ganho", color: "#22c55e" },
  { value: "PERDIDO", label: "Perdido", color: "#ef4444" },
]

const STORAGE_KEY = "baborette-estado-colors"

export function getEstadoColors(): EstadoConfig[] {
  if (typeof window === "undefined") return DEFAULT_ESTADO_COLORS

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      // Merge with defaults to ensure all estados exist
      return DEFAULT_ESTADO_COLORS.map(def => {
        const custom = parsed.find((p: EstadoConfig) => p.value === def.value)
        return custom ? { ...def, color: custom.color } : def
      })
    }
  } catch (e) {
    console.error("Error reading estado colors:", e)
  }
  return DEFAULT_ESTADO_COLORS
}

export function saveEstadoColors(colors: EstadoConfig[]): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(colors))
    // Dispatch event for other components to react
    window.dispatchEvent(new CustomEvent("estado-colors-changed", { detail: colors }))
  } catch (e) {
    console.error("Error saving estado colors:", e)
  }
}

export function getEstadoColor(estado: string): string {
  const colors = getEstadoColors()
  return colors.find(c => c.value === estado)?.color || "#64748b"
}

export function getEstadoLabel(estado: string): string {
  const colors = getEstadoColors()
  return colors.find(c => c.value === estado)?.label || estado
}

// Generate Tailwind-compatible classes from hex color
export function hexToTailwind(hex: string): { bg: string; text: string; bgLight: string } {
  // For dynamic colors, we use inline styles, but provide fallback classes
  return {
    bg: `bg-[${hex}]`,
    text: `text-[${hex}]`,
    bgLight: `bg-[${hex}]/10`,
  }
}
