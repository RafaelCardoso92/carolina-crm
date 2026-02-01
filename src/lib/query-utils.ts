/**
 * Query utilities for optimized database access
 */

import { Prisma } from '@prisma/client'

/**
 * Minimal select for cliente lists (reduces payload by ~70%)
 */
export const clienteListSelect = {
  id: true,
  nome: true,
  codigo: true,
  telefone: true,
  email: true,
  cidade: true,
  ativo: true,
  ultimoContacto: true,
  userId: true,
} satisfies Prisma.ClienteSelect

/**
 * Full cliente select for detail views
 */
export const clienteDetailSelect = {
  id: true,
  nome: true,
  codigo: true,
  telefone: true,
  email: true,
  morada: true,
  cidade: true,
  codigoPostal: true,
  latitude: true,
  longitude: true,
  notas: true,
  ativo: true,
  ultimoContacto: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
  segmento: true,
  acordoParceria: true,
} satisfies Prisma.ClienteSelect

/**
 * Minimal select for prospecto lists
 */
export const prospectoListSelect = {
  id: true,
  nomeEmpresa: true,
  nomeContacto: true,
  telefone: true,
  email: true,
  cidade: true,
  estado: true,
  dataUltimoContacto: true,
  proximaAccao: true,
  dataProximaAccao: true,
  ativo: true,
  userId: true,
} satisfies Prisma.ProspectoSelect

/**
 * Full prospecto select for detail views
 */
export const prospectoDetailSelect = {
  id: true,
  nomeEmpresa: true,
  tipoNegocio: true,
  website: true,
  facebook: true,
  instagram: true,
  nomeContacto: true,
  cargoContacto: true,
  telefone: true,
  email: true,
  morada: true,
  cidade: true,
  codigoPostal: true,
  latitude: true,
  longitude: true,
  estado: true,
  dataUltimoContacto: true,
  proximaAccao: true,
  dataProximaAccao: true,
  notas: true,
  fonte: true,
  ativo: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ProspectoSelect

/**
 * Minimal select for vendas lists
 */
export const vendaListSelect = {
  id: true,
  total: true,
  mes: true,
  ano: true,
  createdAt: true,
  cliente: {
    select: {
      id: true,
      nome: true,
      codigo: true,
    }
  }
} satisfies Prisma.VendaSelect

/**
 * Minimal select for produto lists
 */
export const produtoListSelect = {
  id: true,
  nome: true,
  codigo: true,
  categoria: true,
  preco: true,
  ativo: true,
} satisfies Prisma.ProdutoSelect

/**
 * Minimal select for tarefa lists
 */
export const tarefaListSelect = {
  id: true,
  titulo: true,
  tipo: true,
  prioridade: true,
  estado: true,
  dataVencimento: true,
  clienteId: true,
  prospectoId: true,
  cliente: {
    select: { id: true, nome: true }
  },
  prospecto: {
    select: { id: true, nomeEmpresa: true }
  }
} satisfies Prisma.TarefaSelect

/**
 * Minimal select for cobranca lists
 */
export const cobrancaListSelect = {
  id: true,
  fatura: true,
  valor: true,
  dataEmissao: true,
  pago: true,
  numeroParcelas: true,
  cliente: {
    select: { id: true, nome: true }
  },
  parcelas: {
    select: {
      id: true,
      numero: true,
      valor: true,
      dataVencimento: true,
      pago: true,
      dataPago: true,
    },
    orderBy: { numero: 'asc' as const }
  }
} satisfies Prisma.CobrancaSelect

/**
 * Build search filter for text fields
 * Returns a generic object that can be spread into any Prisma where clause
 */
export function buildSearchFilter(
  search: string | null,
  fields: string[]
): { OR: Record<string, { contains: string; mode: 'insensitive' }>[] } | Record<string, never> {
  if (!search) return {}

  return {
    OR: fields.map(field => ({
      [field]: { contains: search, mode: 'insensitive' as const }
    }))
  }
}

/**
 * Build date range filter
 */
export function buildDateRangeFilter(
  field: string,
  startDate?: string | null,
  endDate?: string | null
): Record<string, { gte?: Date; lte?: Date }> | undefined {
  if (!startDate && !endDate) return undefined

  const filter: { gte?: Date; lte?: Date } = {}

  if (startDate) {
    filter.gte = new Date(startDate)
  }

  if (endDate) {
    filter.lte = new Date(endDate)
  }

  return { [field]: filter }
}
