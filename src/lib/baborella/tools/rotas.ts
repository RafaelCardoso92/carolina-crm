import { ActionCategory, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { BaborellaTool, ToolContext, ToolResult } from "../types";

export const minhasRotas: BaborellaTool = {
  name: "minhas_rotas",
  category: ActionCategory.ROTAS,
  description: "List saved routes.",
  descriptionPt: "Listar rotas guardadas",
  parameters: {
    concluida: {
      type: "boolean",
      description: "Filter by completed status",
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
    if (params.concluida === true) return "Rotas concluidas";
    if (params.concluida === false) return "Rotas pendentes";
    return "Listar rotas";
  },
  execute: async (params, context: ToolContext): Promise<ToolResult> => {
    try {
      const { concluida, limit = 10 } = params as {
        concluida?: boolean;
        limit?: number;
      };

      const rotas = await prisma.rotaSalva.findMany({
        where: {
          userId: context.userId,
          ...(concluida !== undefined && { concluida }),
        },
        select: {
          id: true,
          nome: true,
          data: true,
          origemEndereco: true,
          distanciaTotal: true,
          duracaoTotal: true,
          concluida: true,
          custoTotal: true,
          locais: true,
        },
        orderBy: { data: "desc" },
        take: limit,
      });

      // Count stops in each route
      const rotasComParagens = rotas.map(r => {
        const locais = r.locais as unknown[];
        return {
          ...r,
          numParagens: Array.isArray(locais) ? locais.length : 0,
        };
      });

      return {
        success: true,
        message: rotas.length + " rotas encontradas",
        data: rotasComParagens,
      };
    } catch (error) {
      return {
        success: false,
        message: "Erro ao listar rotas",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
};

export const detalhesRota: BaborellaTool = {
  name: "detalhes_rota",
  category: ActionCategory.ROTAS,
  description: "Get full details of a saved route including all stops.",
  descriptionPt: "Detalhes de uma rota",
  parameters: {
    rotaId: {
      type: "string",
      description: "Route ID",
      required: true,
    },
  },
  requiresApproval: false,
  getActionDescription: () => "Ver detalhes da rota",
  execute: async (params, context: ToolContext): Promise<ToolResult> => {
    try {
      const { rotaId } = params as { rotaId: string };

      const rota = await prisma.rotaSalva.findFirst({
        where: { id: rotaId, userId: context.userId },
      });

      if (!rota) {
        return {
          success: false,
          message: "Rota não encontrada",
          error: "ROUTE_NOT_FOUND",
        };
      }

      return {
        success: true,
        message: "Rota: " + (rota.nome || "Sem nome") + " - " + rota.distanciaTotal,
        data: rota,
      };
    } catch (error) {
      return {
        success: false,
        message: "Erro ao obter rota",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
};

export const concluirRota: BaborellaTool = {
  name: "concluir_rota",
  category: ActionCategory.ROTAS,
  description: "Mark a route as completed.",
  descriptionPt: "Marcar rota como concluida",
  parameters: {
    rotaId: {
      type: "string",
      description: "Route ID",
      required: true,
    },
    custoReal: {
      type: "number",
      description: "Actual cost of the route (optional)",
      required: false,
    },
    notas: {
      type: "string",
      description: "Notes about the route completion",
      required: false,
    },
  },
  requiresApproval: true,
  getActionDescription: () => "Concluir rota",
  execute: async (params, context: ToolContext): Promise<ToolResult> => {
    try {
      const { rotaId, custoReal, notas } = params as {
        rotaId: string;
        custoReal?: number;
        notas?: string;
      };

      const existing = await prisma.rotaSalva.findFirst({
        where: { id: rotaId, userId: context.userId },
      });

      if (!existing) {
        return {
          success: false,
          message: "Rota não encontrada",
          error: "ROUTE_NOT_FOUND",
        };
      }

      const rota = await prisma.rotaSalva.update({
        where: { id: rotaId },
        data: {
          concluida: true,
          ...(custoReal && { custoReal }),
          ...(notas && { notasCustos: notas }),
        },
      });

      return {
        success: true,
        message: "Rota concluida: " + (rota.nome || rota.id),
        data: rota,
      };
    } catch (error) {
      return {
        success: false,
        message: "Erro ao concluir rota",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
};

export const sugerirRota: BaborellaTool = {
  name: "sugerir_rota",
  category: ActionCategory.ROTAS,
  description: "Suggest clients to visit in a city for creating a route.",
  descriptionPt: "Sugerir clientes para visitar numa cidade",
  parameters: {
    cidade: {
      type: "string",
      description: "City to find clients in",
      required: true,
    },
    priorizarSemContacto: {
      type: "boolean",
      description: "Prioritize clients without recent contact",
      required: false,
    },
    maxParagens: {
      type: "number",
      description: "Maximum number of stops (default 8)",
      required: false,
    },
  },
  requiresApproval: false,
  getActionDescription: (params) => "Sugerir rota para " + params.cidade,
  execute: async (params, context: ToolContext): Promise<ToolResult> => {
    try {
      const { cidade, priorizarSemContacto = true, maxParagens = 8 } = params as {
        cidade: string;
        priorizarSemContacto?: boolean;
        maxParagens?: number;
      };

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 30);

      const clientes = await prisma.cliente.findMany({
        where: {
          userId: context.userId,
          ativo: true,
          cidade: { contains: cidade, mode: "insensitive" },
          latitude: { not: null },
          longitude: { not: null },
        },
        select: {
          id: true,
          nome: true,
          morada: true,
          cidade: true,
          telefone: true,
          latitude: true,
          longitude: true,
          ultimoContacto: true,
        },
        orderBy: priorizarSemContacto 
          ? { ultimoContacto: "asc" }
          : { nome: "asc" },
        take: maxParagens,
      });

      if (clientes.length === 0) {
        return {
          success: false,
          message: "Nenhum cliente encontrado em " + cidade,
          error: "NO_CLIENTS_FOUND",
        };
      }

      const semContactoRecente = clientes.filter(c => 
        !c.ultimoContacto || c.ultimoContacto < cutoffDate
      ).length;

      return {
        success: true,
        message: clientes.length + " clientes sugeridos em " + cidade + " (" + semContactoRecente + " sem contacto recente)",
        data: {
          clientes,
          sugestao: "Navegue para /rotas para criar a rota com estes clientes",
        },
      };
    } catch (error) {
      return {
        success: false,
        message: "Erro ao sugerir rota",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
};

export const rotasTools = [minhasRotas, detalhesRota, concluirRota, sugerirRota];
