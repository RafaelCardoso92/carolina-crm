export interface ProspectoTacticsRequest {
  prospectoId: string
  provider?: "gemini" | "openai"  // Optional: override default provider
}

export interface TacticaItem {
  texto: string
  explicacao: string  // Why this suggestion is good
}

export interface ProspectoTactics {
  abordagem: {
    texto: string
    explicacao: string
  }
  iniciadoresConversa: TacticaItem[]
  pontosDor: TacticaItem[]
  dicasSucesso: TacticaItem[]
  probabilidadeConversao: {
    nivel: "Alta" | "Media" | "Baixa"
    justificacao: string
  }
}

export interface ProspectoTacticsResponse {
  success: boolean
  tactics?: ProspectoTactics | null
  provider?: string | null
  generatedAt?: string | null
  tacticId?: string  // ID of saved tactic for deletion
  error?: string
}

export interface ClienteInsightsRequest {
  clienteId: string
  provider?: "gemini" | "openai"  // Optional: override default provider
}

export interface UpsellRecomendacao {
  produto: string
  razao: string
  explicacao: string  // Why this upsell makes sense
}

export interface ClienteInsights {
  resumoComportamento: {
    texto: string
    explicacao: string
  }
  padraoCompras: {
    texto: string
    explicacao: string
  }
  recomendacoesUpsell: UpsellRecomendacao[]
  sugestoesEngagement: TacticaItem[]
  tendenciaSazonal: {
    texto: string
    explicacao: string
  }
}

export interface ClienteInsightsResponse {
  success: boolean
  insights?: ClienteInsights | null
  provider?: string | null
  generatedAt?: string | null
  insightId?: string  // ID of saved insight for deletion
  error?: string
}

export interface AISettingsResponse {
  currentProvider: "gemini" | "openai"
  availableProviders: {
    gemini: boolean
    openai: boolean
  }
}
