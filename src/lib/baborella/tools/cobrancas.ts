import { ActionCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { BaborellaTool, ToolContext, ToolResult } from "../types";

export const cobrancasPendentes: BaborellaTool = {
  name: "cobrancas_pendentes",
  category: ActionCategory.COBRANCAS,
  description: "List pending collections/invoices not yet paid.",
  descriptionPt: "Listar cobrancas pendentes",
  parameters: {
    clienteNome: {
      type: "string",
      description: "Filter by client name",
      required: false,
    },
    valorMinimo: {
      type: "number",
      description: "Minimum value filter",
      required: false,
    },
    limit: {
      type: "number",
      description: "Maximum results (default 10)",
      required: false,
    },
  },
  requiresApproval: false,
  getActionDescription: (params) => {
    const filters: string[] = [];
    if (params.clienteNome) filters.push("cliente: " + params.clienteNome);
    if (params.valorMinimo) filters.push("min: " + params.valorMinimo + " EUR");
    return "Cobrancas pendentes" + (filters.length ? " (" + filters.join(", ") + ")" : "");
  },
  execute: async (params, context: ToolContext): Promise<ToolResult> => {
    try {
      const { clienteNome, valorMinimo, limit = 10 } = params as {
        clienteNome?: string;
        valorMinimo?: number;
        limit?: number;
      };

      const cobrancas = await prisma.cobranca.findMany({
        where: {
          cliente: {
            userId: context.userId,
            ...(clienteNome && { nome: { contains: clienteNome, mode: "insensitive" } }),
          },
          pago: false,
          ...(valorMinimo && { valor: { gte: valorMinimo } }),
        },
        include: {
          cliente: { select: { id: true, nome: true, telefone: true } },
        },
        orderBy: { valor: "desc" },
        take: limit,
      });

      const totalPendente = cobrancas.reduce((sum, c) => sum + Number(c.valor), 0);

      return {
        success: true,
        message: cobrancas.length + " cobrancas pendentes, total: " + totalPendente.toFixed(2) + " EUR",
        data: { cobrancas, totalPendente },
      };
    } catch (error) {
      return {
        success: false,
        message: "Erro ao listar cobrancas",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
};

export const registarPagamento: BaborellaTool = {
  name: "registar_pagamento",
  category: ActionCategory.COBRANCAS,
  description: "Mark a collection as paid.",
  descriptionPt: "Registar pagamento de cobranca",
  parameters: {
    cobrancaId: {
      type: "string",
      description: "Collection ID to mark as paid",
      required: true,
    },
    notas: {
      type: "string",
      description: "Payment notes",
      required: false,
    },
  },
  requiresApproval: true,
  getActionDescription: () => "Registar pagamento",
  execute: async (params, context: ToolContext): Promise<ToolResult> => {
    try {
      const { cobrancaId, notas } = params as { cobrancaId: string; notas?: string };

      const existing = await prisma.cobranca.findFirst({
        where: {
          id: cobrancaId,
          cliente: { userId: context.userId },
        },
        include: { cliente: true },
      });

      if (!existing) {
        return {
          success: false,
          message: "Cobranca nao encontrada",
          error: "COLLECTION_NOT_FOUND",
        };
      }

      if (existing.pago) {
        return {
          success: false,
          message: "Cobranca ja esta paga",
          error: "ALREADY_PAID",
        };
      }

      const cobranca = await prisma.cobranca.update({
        where: { id: cobrancaId },
        data: {
          pago: true,
          dataPago: new Date(),
          notas: notas ? (existing.notas ? existing.notas + "\n" + notas : notas) : existing.notas,
        },
        include: { cliente: { select: { nome: true } } },
      });

      return {
        success: true,
        message: "Pagamento registado: " + Number(cobranca.valor).toFixed(2) + " EUR de " + cobranca.cliente.nome,
        data: cobranca,
      };
    } catch (error) {
      return {
        success: false,
        message: "Erro ao registar pagamento",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
};

export const resumoCobrancas: BaborellaTool = {
  name: "resumo_cobrancas",
  category: ActionCategory.COBRANCAS,
  description: "Get summary of collections: pending, paid this month, overdue.",
  descriptionPt: "Resumo de cobrancas",
  parameters: {},
  requiresApproval: false,
  getActionDescription: () => "Resumo de cobrancas",
  execute: async (params, context: ToolContext): Promise<ToolResult> => {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [pendentes, pagasMes, total] = await Promise.all([
        prisma.cobranca.aggregate({
          where: {
            cliente: { userId: context.userId },
            pago: false,
          },
          _sum: { valor: true },
          _count: true,
        }),
        prisma.cobranca.aggregate({
          where: {
            cliente: { userId: context.userId },
            pago: true,
            dataPago: { gte: startOfMonth },
          },
          _sum: { valor: true },
          _count: true,
        }),
        prisma.cobranca.aggregate({
          where: {
            cliente: { userId: context.userId },
          },
          _sum: { valor: true },
          _count: true,
        }),
      ]);

      const valorPendente = pendentes._sum?.valor ? Number(pendentes._sum.valor) : 0;
      const valorPagoMes = pagasMes._sum?.valor ? Number(pagasMes._sum.valor) : 0;

      return {
        success: true,
        message: "Pendente: " + valorPendente.toFixed(2) + " EUR (" + pendentes._count + "). Pago este mes: " + valorPagoMes.toFixed(2) + " EUR",
        data: {
          pendentes: { valor: valorPendente, quantidade: pendentes._count },
          pagasMes: { valor: valorPagoMes, quantidade: pagasMes._count },
          total: { valor: total._sum?.valor ? Number(total._sum.valor) : 0, quantidade: total._count },
        },
      };
    } catch (error) {
      return {
        success: false,
        message: "Erro ao obter resumo",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
};

export const cobrancasTools = [cobrancasPendentes, registarPagamento, resumoCobrancas];
