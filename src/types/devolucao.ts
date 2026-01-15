import type { Devolucao, ItemDevolucao, ImagemDevolucao, EstadoDevolucao, Produto, ItemVenda, Venda, Cliente } from "@prisma/client"

// Request types
export interface CreateDevolucaoRequest {
  vendaId: string
  motivo?: string
  itens: CreateItemDevolucaoInput[]
}

export interface CreateItemDevolucaoInput {
  itemVendaId: string
  quantidade: number
  motivo: string
  // Optional replacement
  substituicaoId?: string
  qtdSubstituicao?: number
  precoSubstituicao?: number
}

export interface UpdateDevolucaoRequest {
  motivo?: string
  estado?: EstadoDevolucao
}

// Response types
export interface DevolucaoWithRelations extends Devolucao {
  itens: (ItemDevolucao & {
    itemVenda: ItemVenda & {
      produto: Produto
    }
    substituicao: Produto | null
  })[]
  imagens: ImagemDevolucao[]
  venda: Venda & {
    cliente: Cliente
  }
}

export interface DevolucaoListResponse {
  success: boolean
  devolucoes?: DevolucaoWithRelations[]
  error?: string
}

export interface DevolucaoResponse {
  success: boolean
  devolucao?: DevolucaoWithRelations
  error?: string
}

export interface ImageUploadResponse {
  success: boolean
  imagem?: ImagemDevolucao
  error?: string
}

// Summary types for display
export interface VendaComDevolucoes extends Venda {
  cliente: Cliente
  itens: (ItemVenda & { produto: Produto })[]
  devolucoes: DevolucaoWithRelations[]
}

export interface VendaResumo {
  totalOriginal: number
  totalDevolvido: number
  totalSubstituido: number
  totalLiquido: number  // = totalOriginal - totalDevolvido + totalSubstituido
}

// Helper type for item availability (how much can still be returned)
export interface ItemVendaDisponivel extends ItemVenda {
  produto: Produto
  quantidadeDevolvida: number
  quantidadeDisponivel: number  // = quantidade - quantidadeDevolvida
}

// Reason options for returns (for dropdowns)
export const MOTIVOS_DEVOLUCAO = [
  "Produto danificado",
  "Produto errado",
  "Quantidade incorreta",
  "Cliente desistiu",
  "Prazo de validade",
  "Defeito de fabrico",
  "Outro"
] as const

export type MotivoDevolucao = typeof MOTIVOS_DEVOLUCAO[number]
