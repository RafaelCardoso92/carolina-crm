"use client"

import { useState, useEffect } from "react"

interface Segmento {
  segmento: "A" | "B" | "C"
  tags: string[]
  potencialMensal: number | null
  notas: string | null
}

interface Props {
  clienteId: string
}

const segmentoColors = {
  A: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 border-green-300",
  B: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 border-blue-300",
  C: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 border-gray-300"
}

const segmentoLabels = {
  A: "Alto Valor",
  B: "Medio Valor",
  C: "Baixo Valor"
}

export default function CustomerSegmentation({ clienteId }: Props) {
  const [segmento, setSegmento] = useState<Segmento | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    segmento: "C" as "A" | "B" | "C",
    tags: [] as string[],
    potencialMensal: "",
    notas: ""
  })
  const [newTag, setNewTag] = useState("")

  useEffect(() => {
    fetchSegmento()
  }, [clienteId])

  async function fetchSegmento() {
    try {
      const res = await fetch(`/api/segmentos?clienteId=${clienteId}`)
      const data = await res.json()
      if (data) {
        setSegmento(data)
        setFormData({
          segmento: data.segmento,
          tags: data.tags || [],
          potencialMensal: data.potencialMensal?.toString() || "",
          notas: data.notas || ""
        })
      }
    } catch (error) {
      console.error("Error:", error)
    }
    setLoading(false)
  }

  async function handleSave() {
    try {
      const res = await fetch("/api/segmentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clienteId,
          ...formData,
          potencialMensal: formData.potencialMensal ? parseFloat(formData.potencialMensal) : null
        })
      })
      if (res.ok) {
        setEditing(false)
        fetchSegmento()
      }
    } catch (error) {
      console.error("Error:", error)
    }
  }

  function addTag() {
    if (newTag && !formData.tags.includes(newTag)) {
      setFormData({ ...formData, tags: [...formData.tags, newTag] })
      setNewTag("")
    }
  }

  function removeTag(tag: string) {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) })
  }

  if (loading) {
    return <div className="animate-pulse h-24 bg-muted rounded-xl"></div>
  }

  return (
    <div className="bg-card rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Segmentacao</h3>
        <button
          onClick={() => setEditing(!editing)}
          className="text-sm text-primary hover:underline"
        >
          {editing ? "Cancelar" : "Editar"}
        </button>
      </div>

      {editing ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">Segmento</label>
            <div className="flex gap-2">
              {(["A", "B", "C"] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setFormData({ ...formData, segmento: s })}
                  className={`flex-1 py-2 px-4 rounded-lg border-2 font-medium transition ${
                    formData.segmento === s
                      ? segmentoColors[s]
                      : "border-border bg-secondary text-muted-foreground"
                  }`}
                >
                  {s} - {segmentoLabels[s]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">Tags</label>
            <div className="flex gap-2 flex-wrap mb-2">
              {formData.tags.map(tag => (
                <span
                  key={tag}
                  className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm flex items-center gap-1"
                >
                  {tag}
                  <button onClick={() => removeTag(tag)} className="hover:text-red-500">x</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTag}
                onChange={e => setNewTag(e.target.value)}
                onKeyPress={e => e.key === "Enter" && (e.preventDefault(), addTag())}
                placeholder="Nova tag..."
                className="flex-1 border border-border rounded-lg px-3 py-2 bg-background text-foreground text-sm"
              />
              <button onClick={addTag} className="px-3 py-2 bg-secondary rounded-lg text-foreground hover:bg-secondary/80">
                +
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Potencial Mensal (EUR)</label>
            <input
              type="number"
              value={formData.potencialMensal}
              onChange={e => setFormData({ ...formData, potencialMensal: e.target.value })}
              className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground"
              placeholder="Ex: 500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Notas</label>
            <textarea
              value={formData.notas}
              onChange={e => setFormData({ ...formData, notas: e.target.value })}
              className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground"
              rows={2}
            />
          </div>

          <button
            onClick={handleSave}
            className="w-full bg-primary text-white py-2 rounded-lg font-medium hover:bg-primary-hover transition"
          >
            Guardar
          </button>
        </div>
      ) : segmento ? (
        <div>
          <div className="flex items-center gap-3 mb-3">
            <span className={`px-4 py-2 rounded-lg font-bold text-lg border-2 ${segmentoColors[segmento.segmento]}`}>
              {segmento.segmento}
            </span>
            <span className="text-foreground font-medium">{segmentoLabels[segmento.segmento]}</span>
          </div>
          
          {segmento.tags.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-3">
              {segmento.tags.map(tag => (
                <span key={tag} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                  {tag}
                </span>
              ))}
            </div>
          )}
          
          {segmento.potencialMensal && (
            <p className="text-sm text-muted-foreground">
              Potencial mensal: <span className="font-medium text-foreground">{Number(segmento.potencialMensal).toFixed(2)} EUR</span>
            </p>
          )}
          
          {segmento.notas && (
            <p className="text-sm text-muted-foreground mt-2">{segmento.notas}</p>
          )}
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-muted-foreground text-sm mb-2">Cliente ainda nao segmentado</p>
          <button
            onClick={() => setEditing(true)}
            className="text-primary hover:underline text-sm"
          >
            Definir segmento
          </button>
        </div>
      )}
    </div>
  )
}
