import { ActionCategory, EstadoTarefa } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { BaborellaTool, ToolContext, ToolResult } from "../types";

export const pesquisarClientes: BaborellaTool = {
  name: "pesquisar_clientes",
  category: ActionCategory.CLIENTES,
  description: "Search clients by name, city, or status. Returns matching clients with their details.",
  descriptionPt: "Pesquisar clientes por nome, cidade ou estado",
  parameters: {
    nome: {
      type: "string",
      description: "Client name to search for (partial match)",
      required: false,
    },
    cidade: {
      type: "string",
      description: "City to filter by",
      required: false,
    },
    ativo: {
      type: "boolean",
      description: "Filter by active status (true/false)",
      required: false,
    },
    limit: {
      type: "number",
      description: "Maximum results to return (default 10)",
      required: false,
    },
  },
  requiresApproval: false,
  getActionDescription: (params) => {
    const filters: string[] = [];
    if (params.nome) filters.push("nome: " + params.nome);
    if (params.cidade) filters.push("cidade: " + params.cidade);
    if (params.ativo !== undefined) filters.push(params.ativo ? "ativos" : "inativos");
    return "Pesquisar clientes" + (filters.length ? " (" + filters.join(", ") + ")" : "");
  },
  execute: async (params, context: ToolContext): Promise<ToolResult> => {
    try {
      const { nome, cidade, ativo, limit = 10 } = params as {
        nome?: string;
        cidade?: string;
        ativo?: boolean;
        limit?: number;
      };

      const clientes = await prisma.cliente.findMany({
        where: {
          userId: context.userId,
          ...(nome && { nome: { contains: nome, mode: "insensitive" } }),
          ...(cidade && { cidade: { contains: cidade, mode: "insensitive" } }),
          ...(ativo !== undefined && { ativo }),
        },
        select: {
          id: true,
          nome: true,
          telefone: true,
          email: true,
          cidade: true,
          ativo: true,
          ultimoContacto: true,
          _count: {
            select: { vendas: true },
          },
        },
        orderBy: { nome: "asc" },
        take: limit,
      });

      return {
        success: true,
        message: "Encontrados " + clientes.length + " clientes",
        data: clientes,
      };
    } catch (error) {
      return {
        success: false,
        message: "Erro ao pesquisar clientes",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
};

export const detalhesCliente: BaborellaTool = {
  name: "detalhes_cliente",
  category: ActionCategory.CLIENTES,
  description: "Get full details about a specific client including sales history and pending collections.",
  descriptionPt: "Obter detalhes completos de um cliente",
  parameters: {
    clienteId: {
      type: "string",
      description: "The ID of the client",
      required: true,
    },
  },
  requiresApproval: false,
  getActionDescription: () => "Obter detalhes do cliente",
  execute: async (params, context: ToolContext): Promise<ToolResult> => {
    try {
      const { clienteId } = params as { clienteId: string };

      const cliente = await prisma.cliente.findFirst({
        where: { id: clienteId, userId: context.userId },
        include: {
          vendas: {
            take: 5,
            orderBy: [{ ano: "desc" }, { mes: "desc" }],
            include: {
              itens: {
                include: { produto: { select: { nome: true } } },
              },
            },
          },
          cobrancas: {
            where: { pago: false },
            take: 5,
          },
          tarefas: {
            where: { estado: EstadoTarefa.PENDENTE },
            take: 5,
          },
        },
      });

      if (!cliente) {
        return {
          success: false,
          message: "Cliente nao encontrado",
          error: "CLIENT_NOT_FOUND",
        };
      }

      return {
        success: true,
        message: "Detalhes do cliente: " + cliente.nome,
        data: cliente,
      };
    } catch (error) {
      return {
        success: false,
        message: "Erro ao obter detalhes do cliente",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
};

export const criarCliente: BaborellaTool = {
  name: "criar_cliente",
  category: ActionCategory.CLIENTES,
  description: "Create a new client with contact information and location.",
  descriptionPt: "Criar um novo cliente",
  parameters: {
    nome: {
      type: "string",
      description: "Client name",
      required: true,
    },
    telefone: {
      type: "string",
      description: "Phone number",
      required: false,
    },
    email: {
      type: "string",
      description: "Email address",
      required: false,
    },
    morada: {
      type: "string",
      description: "Address",
      required: false,
    },
    cidade: {
      type: "string",
      description: "City",
      required: false,
    },
    codigoPostal: {
      type: "string",
      description: "Postal code",
      required: false,
    },
    notas: {
      type: "string",
      description: "Notes about the client",
      required: false,
    },
  },
  requiresApproval: true,
  getActionDescription: (params) => "Criar novo cliente: " + params.nome,
  execute: async (params, context: ToolContext): Promise<ToolResult> => {
    try {
      const { nome, telefone, email, morada, cidade, codigoPostal, notas } = params as {
        nome: string;
        telefone?: string;
        email?: string;
        morada?: string;
        cidade?: string;
        codigoPostal?: string;
        notas?: string;
      };

      const cliente = await prisma.cliente.create({
        data: {
          userId: context.userId,
          nome,
          telefone,
          email,
          morada,
          cidade,
          codigoPostal,
          notas,
        },
      });

      return {
        success: true,
        message: "Cliente " + nome + " criado com sucesso",
        data: cliente,
      };
    } catch (error) {
      return {
        success: false,
        message: "Erro ao criar cliente",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
};

export const atualizarCliente: BaborellaTool = {
  name: "atualizar_cliente",
  category: ActionCategory.CLIENTES,
  description: "Update client information like contact details, status, or notes.",
  descriptionPt: "Atualizar informacoes de um cliente",
  parameters: {
    clienteId: {
      type: "string",
      description: "The ID of the client to update",
      required: true,
    },
    nome: {
      type: "string",
      description: "New client name",
      required: false,
    },
    telefone: {
      type: "string",
      description: "New phone number",
      required: false,
    },
    email: {
      type: "string",
      description: "New email address",
      required: false,
    },
    cidade: {
      type: "string",
      description: "New city",
      required: false,
    },
    ativo: {
      type: "boolean",
      description: "Set active status",
      required: false,
    },
    notas: {
      type: "string",
      description: "New notes",
      required: false,
    },
  },
  requiresApproval: true,
  getActionDescription: (params) => {
    const updates: string[] = [];
    if (params.nome) updates.push("nome");
    if (params.telefone) updates.push("telefone");
    if (params.email) updates.push("email");
    if (params.cidade) updates.push("cidade");
    if (params.ativo !== undefined) updates.push("estado");
    if (params.notas) updates.push("notas");
    return "Atualizar cliente (" + (updates.join(", ") || "dados") + ")";
  },
  execute: async (params, context: ToolContext): Promise<ToolResult> => {
    try {
      const { clienteId, ...updateData } = params as {
        clienteId: string;
        nome?: string;
        telefone?: string;
        email?: string;
        cidade?: string;
        ativo?: boolean;
        notas?: string;
      };

      const existing = await prisma.cliente.findFirst({
        where: { id: clienteId, userId: context.userId },
      });

      if (!existing) {
        return {
          success: false,
          message: "Cliente nao encontrado",
          error: "CLIENT_NOT_FOUND",
        };
      }

      const cliente = await prisma.cliente.update({
        where: { id: clienteId },
        data: updateData,
      });

      return {
        success: true,
        message: "Cliente " + cliente.nome + " atualizado com sucesso",
        data: cliente,
      };
    } catch (error) {
      return {
        success: false,
        message: "Erro ao atualizar cliente",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
};

export const clientesTools = [pesquisarClientes, detalhesCliente, criarCliente, atualizarCliente];
