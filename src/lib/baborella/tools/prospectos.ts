import { ActionCategory, EstadoPipeline } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { BaborellaTool, ToolContext, ToolResult } from "../types";

export const pesquisarProspectos: BaborellaTool = {
  name: "pesquisar_prospectos",
  category: ActionCategory.PROSPECTOS,
  description: "Search prospects by name, city, or pipeline status.",
  descriptionPt: "Pesquisar prospectos",
  parameters: {
    nome: {
      type: "string",
      description: "Company name to search",
      required: false,
    },
    cidade: {
      type: "string",
      description: "City to filter by",
      required: false,
    },
    estado: {
      type: "string",
      description: "Pipeline status: NOVO, CONTACTADO, REUNIAO, PROPOSTA, NEGOCIACAO, GANHO, PERDIDO",
      required: false,
      enum: ["NOVO", "CONTACTADO", "REUNIAO", "PROPOSTA", "NEGOCIACAO", "GANHO", "PERDIDO"],
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
    if (params.nome) filters.push("nome: " + params.nome);
    if (params.cidade) filters.push("cidade: " + params.cidade);
    if (params.estado) filters.push("estado: " + params.estado);
    return "Pesquisar prospectos" + (filters.length ? " (" + filters.join(", ") + ")" : "");
  },
  execute: async (params, context: ToolContext): Promise<ToolResult> => {
    try {
      const { nome, cidade, estado, limit = 10 } = params as {
        nome?: string;
        cidade?: string;
        estado?: string;
        limit?: number;
      };

      const prospectos = await prisma.prospecto.findMany({
        where: {
          userId: context.userId,
          ativo: true,
          ...(nome && { nomeEmpresa: { contains: nome, mode: "insensitive" } }),
          ...(cidade && { cidade: { contains: cidade, mode: "insensitive" } }),
          ...(estado && { estado: estado as EstadoPipeline }),
        },
        select: {
          id: true,
          nomeEmpresa: true,
          tipoNegocio: true,
          nomeContacto: true,
          telefone: true,
          cidade: true,
          estado: true,
          dataUltimoContacto: true,
          proximaAccao: true,
        },
        orderBy: { updatedAt: "desc" },
        take: limit,
      });

      return {
        success: true,
        message: "Encontrados " + prospectos.length + " prospectos",
        data: prospectos,
      };
    } catch (error) {
      return {
        success: false,
        message: "Erro ao pesquisar prospectos",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
};

export const detalhesProspecto: BaborellaTool = {
  name: "detalhes_prospecto",
  category: ActionCategory.PROSPECTOS,
  description: "Get full details of a specific prospect.",
  descriptionPt: "Detalhes do prospecto",
  parameters: {
    prospectoId: {
      type: "string",
      description: "Prospect ID",
      required: true,
    },
  },
  requiresApproval: false,
  getActionDescription: () => "Obter detalhes do prospecto",
  execute: async (params, context: ToolContext): Promise<ToolResult> => {
    try {
      const { prospectoId } = params as { prospectoId: string };

      const prospecto = await prisma.prospecto.findFirst({
        where: { id: prospectoId, userId: context.userId },
        include: {
          comunicacoes: {
            take: 5,
            orderBy: { dataContacto: "desc" },
          },
          tarefas: {
            where: { estado: { not: "CONCLUIDA" } },
            take: 5,
          },
          orcamentos: {
            take: 3,
            orderBy: { createdAt: "desc" },
          },
        },
      });

      if (!prospecto) {
        return {
          success: false,
          message: "Prospecto não encontrado",
          error: "PROSPECT_NOT_FOUND",
        };
      }

      return {
        success: true,
        message: "Detalhes: " + prospecto.nomeEmpresa,
        data: prospecto,
      };
    } catch (error) {
      return {
        success: false,
        message: "Erro ao obter detalhes",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
};

export const atualizarEstadoProspecto: BaborellaTool = {
  name: "atualizar_estado_prospecto",
  category: ActionCategory.PROSPECTOS,
  description: "Update the pipeline status of a prospect.",
  descriptionPt: "Atualizar estado do prospecto no pipeline",
  parameters: {
    prospectoId: {
      type: "string",
      description: "Prospect ID",
      required: true,
    },
    estado: {
      type: "string",
      description: "New status: NOVO, CONTACTADO, REUNIAO, PROPOSTA, NEGOCIACAO, GANHO, PERDIDO",
      required: true,
      enum: ["NOVO", "CONTACTADO", "REUNIAO", "PROPOSTA", "NEGOCIACAO", "GANHO", "PERDIDO"],
    },
    notas: {
      type: "string",
      description: "Notes about the status change",
      required: false,
    },
  },
  requiresApproval: true,
  getActionDescription: (params) => "Atualizar prospecto para: " + params.estado,
  execute: async (params, context: ToolContext): Promise<ToolResult> => {
    try {
      const { prospectoId, estado, notas } = params as {
        prospectoId: string;
        estado: string;
        notas?: string;
      };

      const existing = await prisma.prospecto.findFirst({
        where: { id: prospectoId, userId: context.userId },
      });

      if (!existing) {
        return {
          success: false,
          message: "Prospecto não encontrado",
          error: "PROSPECT_NOT_FOUND",
        };
      }

      const prospecto = await prisma.prospecto.update({
        where: { id: prospectoId },
        data: {
          estado: estado as EstadoPipeline,
          dataUltimoContacto: new Date(),
          notas: notas ? (existing.notas ? existing.notas + "\n" + notas : notas) : existing.notas,
        },
      });

      return {
        success: true,
        message: prospecto.nomeEmpresa + " atualizado para " + estado,
        data: prospecto,
      };
    } catch (error) {
      return {
        success: false,
        message: "Erro ao atualizar prospecto",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
};

export const converterProspecto: BaborellaTool = {
  name: "converter_prospecto",
  category: ActionCategory.PROSPECTOS,
  description: "Convert a prospect to a client (creates client from prospect data).",
  descriptionPt: "Converter prospecto em cliente",
  parameters: {
    prospectoId: {
      type: "string",
      description: "Prospect ID to convert",
      required: true,
    },
  },
  requiresApproval: true,
  getActionDescription: () => "Converter prospecto em cliente",
  execute: async (params, context: ToolContext): Promise<ToolResult> => {
    try {
      const { prospectoId } = params as { prospectoId: string };

      const prospecto = await prisma.prospecto.findFirst({
        where: { id: prospectoId, userId: context.userId },
      });

      if (!prospecto) {
        return {
          success: false,
          message: "Prospecto não encontrado",
          error: "PROSPECT_NOT_FOUND",
        };
      }

      // Create client from prospect
      const cliente = await prisma.cliente.create({
        data: {
          userId: context.userId,
          nome: prospecto.nomeEmpresa,
          telefone: prospecto.telefone,
          email: prospecto.email,
          morada: prospecto.morada,
          cidade: prospecto.cidade,
          codigoPostal: prospecto.codigoPostal,
          latitude: prospecto.latitude,
          longitude: prospecto.longitude,
          notas: "Convertido de prospecto em " + new Date().toLocaleDateString("pt-PT") + (prospecto.notas ? "\n" + prospecto.notas : ""),
        },
      });

      // Mark prospect as won
      await prisma.prospecto.update({
        where: { id: prospectoId },
        data: {
          estado: EstadoPipeline.GANHO,
          ativo: false,
        },
      });

      return {
        success: true,
        message: "Prospecto " + prospecto.nomeEmpresa + " convertido em cliente",
        data: { cliente, prospecto },
      };
    } catch (error) {
      return {
        success: false,
        message: "Erro ao converter prospecto",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
};

export const prospectosTools = [pesquisarProspectos, detalhesProspecto, atualizarEstadoProspecto, converterProspecto];
