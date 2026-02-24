import type { Prisma } from "@prisma/client"

// Estados
export type EstadoReconciliacaoComissao = "PENDENTE" | "EM_REVISAO" | "APROVADA" | "COM_PROBLEMAS"
export type TipoDiscrepanciaComissao = 
  | "VALOR_DIFERENTE" 
  | "COMISSAO_DIFERENTE" 
  | "CLIENTE_NAO_EXISTE" 
  | "COBRANCA_NAO_EXISTE" 
  | "PARCELA_NAO_EXISTE"
  | "PAGAMENTO_EXTRA_SISTEMA"
  | "PAGAMENTO_EXTRA_PDF"

// Parsed data from PDF
export interface PdfComissaoLine {
  data: Date | null
  entidade: string        // Client code
  tipoDoc: string         // FA, ND, VEC
  serie: string           // 25OV, 25B2B, 26OV
  numero: string          // Invoice number
  prestacao: number       // Parcela number
  valorLiquido: number
  valorComissao: number
}

export interface ParsedComissoesPdf {
  dataInicio: Date | null
  dataFim: Date | null
  vendedor: string
  totalLiquido: number
  totalComissao: number
  linhas: PdfComissaoLine[]
}

// Item with relations
export interface ItemReconciliacaoComissaoWithRelations {
  id: string
  reconciliacaoId: string
  dataPagamentoPdf: Date | null
  codigoClientePdf: string
  nomeClientePdf: string | null
  tipoDocPdf: string | null
  seriePdf: string | null
  numeroPdf: string
  parcelaPdf: number
  valorLiquidoPdf: number | Prisma.Decimal
  valorComissaoPdf: number | Prisma.Decimal
  clienteId: string | null
  cliente: {
    id: string
    nome: string
    codigo: string | null
  } | null
  cobrancaId: string | null
  cobranca: {
    id: string
    fatura: string | null
    valor: number | Prisma.Decimal
    comissao: number | Prisma.Decimal | null
  } | null
  parcelaId: string | null
  parcela: {
    id: string
    numero: number
    valor: number | Prisma.Decimal
    dataPago: Date | null
  } | null
  valorSistema: number | Prisma.Decimal | null
  comissaoSistema: number | Prisma.Decimal | null
  corresponde: boolean
  tipoDiscrepancia: TipoDiscrepanciaComissao | null
  diferencaValor: number | Prisma.Decimal | null
  diferencaComissao: number | Prisma.Decimal | null
  resolvido: boolean
  notaResolucao: string | null
  editadoManualmente: boolean
  createdAt: Date
}

// Full reconciliation with relations
export interface ReconciliacaoComissoesWithRelations {
  id: string
  mes: number
  ano: number
  nomeArquivo: string
  caminhoArquivo: string
  dataInicio: Date | null
  dataFim: Date | null
  totalLiquidoPdf: number | Prisma.Decimal
  totalComissaoPdf: number | Prisma.Decimal
  totalSistema: number | Prisma.Decimal
  totalComissaoSistema: number | Prisma.Decimal
  diferenca: number | Prisma.Decimal
  diferencaComissao: number | Prisma.Decimal
  totalItens: number
  itensCorretos: number
  itensComProblema: number
  estado: EstadoReconciliacaoComissao
  notas: string | null
  dataUpload: Date
  dataRevisao: Date | null
  itens: ItemReconciliacaoComissaoWithRelations[]
  createdAt: Date
  updatedAt: Date
}

// API Request/Response types
export interface UploadComissoesRequest {
  mes: number
  ano: number
}

export interface ComissoesReconciliacaoResponse {
  success: boolean
  reconciliacao?: ReconciliacaoComissoesWithRelations
  error?: string
}

export interface ComissoesReconciliacaoListResponse {
  success: boolean
  reconciliacoes?: ReconciliacaoComissoesWithRelations[]
  error?: string
}

export interface UpdateItemComissaoRequest {
  resolvido?: boolean
  notaResolucao?: string
  valorLiquidoPdf?: number
  valorComissaoPdf?: number
  valorSistema?: number
  comissaoSistema?: number
}

export interface UpdateComissoesReconciliacaoRequest {
  estado?: EstadoReconciliacaoComissao
  notas?: string
}

// Labels for UI
export const ESTADO_COMISSAO_LABELS: Record<EstadoReconciliacaoComissao, string> = {
  PENDENTE: "Pendente",
  EM_REVISAO: "Em Revisão",
  APROVADA: "Aprovada",
  COM_PROBLEMAS: "Com Problemas"
}

export const TIPO_DISCREPANCIA_COMISSAO_LABELS: Record<TipoDiscrepanciaComissao, string> = {
  VALOR_DIFERENTE: "Valor diferente",
  COMISSAO_DIFERENTE: "Comissão diferente",
  CLIENTE_NAO_EXISTE: "Cliente não existe no sistema",
  COBRANCA_NAO_EXISTE: "Cobrança não registada",
  PARCELA_NAO_EXISTE: "Parcela não encontrada",
  PAGAMENTO_EXTRA_SISTEMA: "Pagamento extra no sistema",
  PAGAMENTO_EXTRA_PDF: "Pagamento extra no PDF"
}

export const ESTADO_COMISSAO_COLORS: Record<EstadoReconciliacaoComissao, string> = {
  PENDENTE: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  EM_REVISAO: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  APROVADA: "bg-green-500/10 text-green-600 dark:text-green-400",
  COM_PROBLEMAS: "bg-red-500/10 text-red-600 dark:text-red-400"
}
