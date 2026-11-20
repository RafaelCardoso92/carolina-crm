"use client"

import { useEffect, useRef, useState } from "react"
import { useJsApiLoader } from "@react-google-maps/api"
import { GOOGLE_MAPS_CONFIG } from "@/lib/google-maps"

export type PlaceEscolhido = { morada: string; cidade: string; codigoPostal: string; lat: number; lng: number }

type Sugestao = { id: string; texto: string; prediction: google.maps.places.PlacePrediction }

// Places API (New): the legacy google.maps.places.Autocomplete is not available to keys created after
// March 2025 ("This page can't load Google Maps correctly"), so suggestions are fetched and listed by hand.
export default function PlaceSearch({ onSelect, className }: { onSelect: (p: PlaceEscolhido) => void; className?: string }) {
  const { isLoaded } = useJsApiLoader(GOOGLE_MAPS_CONFIG)
  const [texto, setTexto] = useState("")
  const [sugestoes, setSugestoes] = useState<Sugestao[]>([])
  const [aberto, setAberto] = useState(false)
  const [erro, setErro] = useState("")
  const sessao = useRef<google.maps.places.AutocompleteSessionToken | null>(null)
  const pedido = useRef(0)

  useEffect(() => {
    if (!isLoaded || texto.trim().length < 3) return
    const n = ++pedido.current
    const t = setTimeout(async () => {
      try {
        const { AutocompleteSuggestion, AutocompleteSessionToken } =
          (await google.maps.importLibrary("places")) as google.maps.PlacesLibrary
        sessao.current ??= new AutocompleteSessionToken()
        const { suggestions } = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: texto, includedRegionCodes: ["pt"], language: "pt-PT", sessionToken: sessao.current,
        })
        if (n !== pedido.current) return
        setSugestoes(suggestions.flatMap(s => s.placePrediction
          ? [{ id: s.placePrediction.placeId, texto: s.placePrediction.text.text, prediction: s.placePrediction }] : []))
        setAberto(true)
        setErro("")
      } catch {
        if (n === pedido.current) setErro("Pesquisa do Google indisponível. Preencha a morada à mão.")
      }
    }, 250)
    return () => clearTimeout(t)
  }, [texto, isLoaded])

  async function escolher(s: Sugestao) {
    setAberto(false)
    try {
      const place = s.prediction.toPlace()
      await place.fetchFields({ fields: ["addressComponents", "location", "formattedAddress"] })
      sessao.current = null // a session ends with the details request
      if (!place.location) return
      const comp = (tipo: string) => place.addressComponents?.find(c => c.types.includes(tipo))?.longText ?? ""
      const rua = comp("route")
      const numero = comp("street_number")
      onSelect({
        morada: (numero ? `${rua}, ${numero}` : rua) || place.formattedAddress || "",
        cidade: comp("locality") || comp("administrative_area_level_2"),
        codigoPostal: comp("postal_code"),
        lat: place.location.lat(),
        lng: place.location.lng(),
      })
      setTexto("")
      setSugestoes([])
    } catch {
      setErro("Não foi possível obter este local. Tente outro ou preencha à mão.")
    }
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={texto}
        onChange={e => {
          setTexto(e.target.value)
          if (e.target.value.trim().length < 3) { pedido.current++; setSugestoes([]) }
        }}
        onFocus={() => sugestoes.length && setAberto(true)}
        onBlur={() => setTimeout(() => setAberto(false), 150)}
        placeholder="Pesquise por nome do estabelecimento ou morada..."
        autoComplete="off"
        className={className}
      />
      {aberto && sugestoes.length > 0 && (
        <ul role="listbox" aria-label="Sugestões do Google" className="absolute z-30 mt-1 w-full max-h-72 overflow-auto rounded-xl border border-border bg-card shadow-lg">
          {sugestoes.map(s => (
            <li key={s.id}>
              <button
                type="button"
                onMouseDown={e => e.preventDefault()}
                onClick={() => escolher(s)}
                className="w-full min-h-11 px-4 py-2 text-left text-sm text-foreground hover:bg-secondary"
              >
                {s.texto}
              </button>
            </li>
          ))}
        </ul>
      )}
      {erro && <p className="text-xs text-red-700 mt-1">{erro}</p>}
    </div>
  )
}
