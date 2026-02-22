"use client"

import { useState } from "react"
import { useEstadoColors } from "@/hooks/useEstadoColors"
import { DEFAULT_ESTADO_COLORS } from "@/lib/estadoColors"

interface Props {
  isOpen: boolean
  onClose: () => void
}

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16",
  "#22c55e", "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9",
  "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#d946ef",
  "#ec4899", "#f43f5e", "#64748b", "#475569", "#1e293b",
]

export default function EstadoColorSettings({ isOpen, onClose }: Props) {
  const { colors, updateColor, resetColors } = useEstadoColors()
  const [activeEstado, setActiveEstado] = useState<string | null>(null)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Cores dos Estados</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Personalize as cores do pipeline</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {colors.map((estado) => (
            <div key={estado.value} className="flex items-center gap-4">
              {/* Color button */}
              <button
                onClick={() => setActiveEstado(activeEstado === estado.value ? null : estado.value)}
                className="w-10 h-10 rounded-xl border-2 border-gray-200 dark:border-gray-600 flex-shrink-0 transition-transform hover:scale-105"
                style={{ backgroundColor: estado.color }}
                title="Clique para mudar"
              />

              {/* Label */}
              <div className="flex-1">
                <span className="font-medium text-gray-900 dark:text-white">{estado.label}</span>
                <span className="ml-2 text-xs text-gray-500 dark:text-gray-400 font-mono">{estado.color}</span>
              </div>

              {/* Reset to default */}
              {estado.color !== DEFAULT_ESTADO_COLORS.find(d => d.value === estado.value)?.color && (
                <button
                  onClick={() => updateColor(estado.value, DEFAULT_ESTADO_COLORS.find(d => d.value === estado.value)?.color || "#64748b")}
                  className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  title="Repor original"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              )}
            </div>
          ))}

          {/* Color picker for active estado */}
          {activeEstado && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                Selecione uma cor para <strong>{colors.find(c => c.value === activeEstado)?.label}</strong>:
              </p>
              <div className="grid grid-cols-10 gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => {
                      updateColor(activeEstado, color)
                      setActiveEstado(null)
                    }}
                    className={`w-6 h-6 rounded-md border-2 transition-transform hover:scale-110 ${
                      colors.find(c => c.value === activeEstado)?.color === color
                        ? "border-gray-900 dark:border-white scale-110"
                        : "border-transparent"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>

              {/* Custom color input */}
              <div className="mt-3 flex items-center gap-2">
                <label className="text-xs text-gray-500 dark:text-gray-400">Ou introduza:</label>
                <input
                  type="color"
                  value={colors.find(c => c.value === activeEstado)?.color || "#64748b"}
                  onChange={(e) => updateColor(activeEstado, e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={colors.find(c => c.value === activeEstado)?.color || ""}
                  onChange={(e) => {
                    const val = e.target.value
                    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                      updateColor(activeEstado, val)
                    }
                  }}
                  placeholder="#000000"
                  className="w-24 px-2 py-1 text-sm font-mono bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl">
          <button
            onClick={resetColors}
            className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            Repor todas
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white text-sm font-medium rounded-lg"
          >
            Concluido
          </button>
        </div>
      </div>
    </div>
  )
}
