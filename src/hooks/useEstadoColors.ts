"use client"

import { useState, useEffect, useCallback } from "react"
import { EstadoConfig, getEstadoColors, saveEstadoColors, DEFAULT_ESTADO_COLORS } from "@/lib/estadoColors"

export function useEstadoColors() {
  const [colors, setColors] = useState<EstadoConfig[]>(DEFAULT_ESTADO_COLORS)

  useEffect(() => {
    // Load colors on mount
    setColors(getEstadoColors())

    // Listen for changes from other components
    const handleChange = (e: CustomEvent<EstadoConfig[]>) => {
      setColors(e.detail)
    }

    window.addEventListener("estado-colors-changed", handleChange as EventListener)
    return () => window.removeEventListener("estado-colors-changed", handleChange as EventListener)
  }, [])

  const updateColor = useCallback((estado: string, newColor: string) => {
    const updated = colors.map(c =>
      c.value === estado ? { ...c, color: newColor } : c
    )
    setColors(updated)
    saveEstadoColors(updated)
  }, [colors])

  const resetColors = useCallback(() => {
    setColors(DEFAULT_ESTADO_COLORS)
    saveEstadoColors(DEFAULT_ESTADO_COLORS)
  }, [])

  const getColor = useCallback((estado: string): string => {
    return colors.find(c => c.value === estado)?.color || "#64748b"
  }, [colors])

  const getLabel = useCallback((estado: string): string => {
    return colors.find(c => c.value === estado)?.label || estado
  }, [colors])

  return {
    colors,
    updateColor,
    resetColors,
    getColor,
    getLabel,
    saveColors: (newColors: EstadoConfig[]) => {
      setColors(newColors)
      saveEstadoColors(newColors)
    }
  }
}
