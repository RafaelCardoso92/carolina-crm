import type { Prisma } from "@prisma/client"

// Estados
export type EstadoReconciliacao = "PENDENTE" | "EM_REVISAO" | "APROVADA" | "COM_PROBLEMAS"
export type TipoDiscrepancia = "VALOR_DIFERENTE" | "CLIENTE_NAO_EXISTE" | "VENDA_NAO_EXISTE" | "VENDA_EXTRA"

// Parsed data from PDF
export interface PdfClienteLine {
  codigo: string
  nome: string
  valorBruto: number
  desconto: number
  valorLiquido: number
}

export interface ParsedMapaPdf {
  dataInicio: Date | null
  dataFim: Date | null
  vendedor: string
  totalBruto: number
  totalDescontos: number
  totalLiquido: number
  clientes: PdfClienteLine[]
}

// Item with relations
export interface ItemReconciliacaoWithRelations {
  id: string
  reconciliacaoId: string
  codigoClientePdf: string
  nomeClientePdf: string
  valorBrutoPdf: number | Prisma.Decimal
  descontoPdf: number | Prisma.Decimal
  valorLiquidoPdf: number | Prisma.Decimal
  clienteId: string | null
  cliente: {
    id: string
    nome: string
    codigo: string | null
  } | null
  vendaId: string | null
  venda: {
    id: string
    total: number | Prisma.Decimal
    mes: number
    ano: number
  } | null
  valorSistema: number | Prisma.Decimal | null
  corresponde: boolean
  tipoDiscrepancia: TipoDiscrepancia | null
  diferencaValor: number | Prisma.Decimal | null
  resolvido: boolean
  notaResolucao: string | null
  createdAt: Date
}

// Full reconciliation with relations
export interface ReconciliacaoWithRelations {
  id: string
  mes: number
  ano: number
  nomeArquivo: string
  caminhoArquivo: string
  dataInicio: Date | null
  dataFim: Date | null
  totalBrutoPdf: number | Prisma.Decimal
  totalDescontosPdf: number | Prisma.Decimal
  totalLiquidoPdf: number | Prisma.Decimal
  totalSistema: number | Prisma.Decimal
  diferenca: number | Prisma.Decimal
  totalItens: number
  itensCorretos: number
  itensComProblema: number
  estado: EstadoReconciliacao
  notas: string | null
  dataUpload: Date
  dataRevisao: Date | null
  itens: ItemReconciliacaoWithRelations[]
  createdAt: Date
  updatedAt: Date
}

// API Request/Response types
export interface UploadReconciliacaoRequest {
  mes: number
  ano: number
}

export interface ReconciliacaoResponse {
  success: boolean
  reconciliacao?: ReconciliacaoWithRelations
  error?: string
}

export interface ReconciliacaoListResponse {
  success: boolean
  reconciliacoes?: ReconciliacaoWithRelations[]
  error?: string
}

export interface UpdateItemRequest {
  resolvido?: boolean
  notaResolucao?: string
}

export interface UpdateReconciliacaoRequest {
  estado?: EstadoReconciliacao
  notas?: string
}

// Labels for UI
export const ESTADO_RECONCILIACAO_LABELS: Record<EstadoReconciliacao, string> = {
  PENDENTE: "Pendente",
  EM_REVISAO: "Em Revisão",
  APROVADA: "Aprovada",
  COM_PROBLEMAS: "Com Problemas"
}

export const TIPO_DISCREPANCIA_LABELS: Record<TipoDiscrepancia, string> = {
  VALOR_DIFERENTE: "Valor diferente",
  CLIENTE_NAO_EXISTE: "Cliente não existe no sistema",
  VENDA_NAO_EXISTE: "Venda não registada",
  VENDA_EXTRA: "Venda extra no sistema"
}

export const ESTADO_RECONCILIACAO_COLORS: Record<EstadoReconciliacao, string> = {
  PENDENTE: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  EM_REVISAO: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  APROVADA: "bg-green-500/10 text-green-600 dark:text-green-400",
  COM_PROBLEMAS: "bg-red-500/10 text-red-600 dark:text-red-400"
}
