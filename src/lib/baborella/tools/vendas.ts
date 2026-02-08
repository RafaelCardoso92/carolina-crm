import { ActionCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { BaborellaTool, ToolContext, ToolResult } from "../types";

export const pesquisarVendas: BaborellaTool = {
  name: "pesquisar_vendas",
  category: ActionCategory.VENDAS,
  description: "Search sales by client, month/year. Returns sales matching the criteria.",
  descriptionPt: "Pesquisar vendas por cliente ou periodo",
  parameters: {
    clienteNome: {
      type: "string",
      description: "Client name to search for (partial match)",
      required: false,
    },
    mes: {
      type: "number",
      description: "Month (1-12)",
      required: false,
    },
    ano: {
      type: "number",
      description: "Year",
      required: false,
    },
    limit: {
      type: "number",
      description: "Maximum number of results to return (default 10)",
      required: false,
    },
  },
  requiresApproval: false,
  getActionDescription: (params) => {
    const parts: string[] = [];
    if (params.clienteNome) parts.push("cliente: " + params.clienteNome);
    if (params.mes || params.ano) parts.push("por periodo");
    return "Pesquisar vendas" + (parts.length ? " (" + parts.join(", ") + ")" : "");
  },
  execute: async (params, context: ToolContext): Promise<ToolResult> => {
    try {
      const { clienteNome, mes, ano, limit = 10 } = params as {
        clienteNome?: string;
        mes?: number;
        ano?: number;
        limit?: number;
      };

      const vendas = await prisma.venda.findMany({
        where: {
          cliente: {
            userId: context.userId,
            ...(clienteNome && {
              nome: { contains: clienteNome, mode: "insensitive" },
            }),
          },
          ...(mes && { mes }),
          ...(ano && { ano }),
        },
        include: {
          cliente: { select: { id: true, nome: true } },
          itens: {
            include: {
              produto: { select: { id: true, nome: true } },
            },
          },
        },
        orderBy: [{ ano: "desc" }, { mes: "desc" }],
        take: limit,
      });

      return {
        success: true,
        message: "Encontradas " + vendas.length + " vendas",
        data: vendas,
      };
    } catch (error) {
      return {
        success: false,
        message: "Erro ao pesquisar vendas",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
};

export const resumoVendas: BaborellaTool = {
  name: "resumo_vendas",
  category: ActionCategory.VENDAS,
  description: "Get sales summary including total sales and top products for a period.",
  descriptionPt: "Obter resumo de vendas por periodo",
  parameters: {
    periodo: {
      type: "string",
      description: "Period to analyze: mes, ano",
      required: false,
      enum: ["mes", "ano"],
    },
  },
  requiresApproval: false,
  getActionDescription: (params) => {
    return "Obter resumo de vendas para periodo: " + (params.periodo || "mes");
  },
  execute: async (params, context: ToolContext): Promise<ToolResult> => {
    try {
      const { periodo = "mes" } = params as { periodo?: string };

      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      const whereClause = periodo === "ano" 
        ? { ano: currentYear }
        : { mes: currentMonth, ano: currentYear };

      const vendas = await prisma.venda.findMany({
        where: {
          cliente: { userId: context.userId },
          ...whereClause,
        },
        include: {
          itens: {
            include: {
              produto: true,
            },
          },
        },
      });

      const totalVendas = vendas.length;
      const valorTotal = vendas.reduce((sum, v) => sum + Number(v.total), 0);
      const mediaVenda = totalVendas > 0 ? valorTotal / totalVendas : 0;

      const produtoCount: Record<string, { nome: string; quantidade: number; valor: number }> = {};
      vendas.forEach((v) => {
        v.itens.forEach((item) => {
          const key = item.produtoId;
          if (!produtoCount[key]) {
            produtoCount[key] = { nome: item.produto.nome, quantidade: 0, valor: 0 };
          }
          produtoCount[key].quantidade += Number(item.quantidade);
          produtoCount[key].valor += Number(item.precoUnit) * Number(item.quantidade);
        });
      });

      const topProdutos = Object.values(produtoCount)
        .sort((a, b) => b.valor - a.valor)
        .slice(0, 5);

      return {
        success: true,
        message: "Resumo de vendas: " + totalVendas + " vendas, " + valorTotal.toFixed(2) + " EUR total",
        data: {
          periodo: periodo === "ano" ? currentYear : currentMonth + "/" + currentYear,
          totalVendas,
          valorTotal,
          mediaVenda,
          topProdutos,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: "Erro ao obter resumo de vendas",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
};

export const registarVenda: BaborellaTool = {
  name: "registar_venda",
  category: ActionCategory.VENDAS,
  description: "Register a new sale for a client. Requires client name and total value.",
  descriptionPt: "Registar uma nova venda para um cliente",
  parameters: {
    clienteNome: {
      type: "string",
      description: "Client name (will search for matching client)",
      required: true,
    },
    valor: {
      type: "number",
      description: "Total sale value in EUR",
      required: true,
    },
    notas: {
      type: "string",
      description: "Notes for the sale",
      required: false,
    },
  },
  requiresApproval: true, // Requires approval before creating
  getActionDescription: (params) => {
    return "Registar venda de " + params.valor + " EUR para " + params.clienteNome;
  },
  execute: async (params, context: ToolContext): Promise<ToolResult> => {
    try {
      const { clienteNome, valor, notas } = params as {
        clienteNome: string;
        valor: number;
        notas?: string;
      };

      // Find the client
      const cliente = await prisma.cliente.findFirst({
        where: {
          userId: context.userId,
          nome: { contains: clienteNome, mode: "insensitive" },
        },
      });

      if (!cliente) {
        return {
          success: false,
          message: "Cliente  + clienteNome +  nao encontrado. Verifique o nome e tente novamente.",
        };
      }

      const now = new Date();
      const mes = now.getMonth() + 1;
      const ano = now.getFullYear();

      // Create the sale
      const venda = await prisma.venda.create({
        data: {
          clienteId: cliente.id,
          mes,
          ano,
          total: valor,
          notas: notas || "Venda registada via Baborella",
        },
        include: {
          cliente: { select: { nome: true } },
        },
      });

      return {
        success: true,
        message: "Venda de " + valor.toFixed(2) + " EUR registada com sucesso para " + cliente.nome,
        data: {
          id: venda.id,
          cliente: venda.cliente.nome,
          valor: venda.total,
          mes,
          ano,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: "Erro ao registar venda",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
};

export const vendasTools = [pesquisarVendas, resumoVendas, registarVenda];
