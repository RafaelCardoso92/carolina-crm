import { ActionCategory, EstadoTarefa, PrioridadeTarefa } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { BaborellaTool, ToolContext, ToolResult } from "../types";

export const listarTarefas: BaborellaTool = {
  name: "listar_tarefas",
  category: ActionCategory.TAREFAS,
  description: "List tasks filtered by status, priority, or due date.",
  descriptionPt: "Listar tarefas por estado, prioridade ou data",
  parameters: {
    estado: {
      type: "string",
      description: "Filter by status: PENDENTE, EM_PROGRESSO, CONCLUIDA, CANCELADA",
      required: false,
      enum: ["PENDENTE", "EM_PROGRESSO", "CONCLUIDA", "CANCELADA"],
    },
    prioridade: {
      type: "string",
      description: "Filter by priority: BAIXA, MEDIA, ALTA, URGENTE",
      required: false,
      enum: ["BAIXA", "MEDIA", "ALTA", "URGENTE"],
    },
    vencimentoProximo: {
      type: "boolean",
      description: "Show only tasks due in next 7 days",
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
    if (params.estado) filters.push("estado: " + params.estado);
    if (params.prioridade) filters.push("prioridade: " + params.prioridade);
    if (params.vencimentoProximo) filters.push("proximas a vencer");
    return "Listar tarefas" + (filters.length ? " (" + filters.join(", ") + ")" : "");
  },
  execute: async (params, context: ToolContext): Promise<ToolResult> => {
    try {
      const { estado, prioridade, vencimentoProximo, limit = 10 } = params as {
        estado?: string;
        prioridade?: string;
        vencimentoProximo?: boolean;
        limit?: number;
      };

      const now = new Date();
      const nextWeek = new Date(now);
      nextWeek.setDate(nextWeek.getDate() + 7);

      const tarefas = await prisma.tarefa.findMany({
        where: {
          userId: context.userId,
          ...(estado && { estado: estado as EstadoTarefa }),
          ...(prioridade && { prioridade: prioridade as PrioridadeTarefa }),
          ...(vencimentoProximo && {
            dataVencimento: { lte: nextWeek, gte: now },
            estado: { not: EstadoTarefa.CONCLUIDA },
          }),
        },
        include: {
          cliente: { select: { id: true, nome: true } },
          prospecto: { select: { id: true, nomeEmpresa: true } },
        },
        orderBy: [
          { prioridade: "desc" },
          { dataVencimento: "asc" },
        ],
        take: limit,
      });

      const urgentes = tarefas.filter(t => t.prioridade === PrioridadeTarefa.URGENTE).length;
      
      return {
        success: true,
        message: "Encontradas " + tarefas.length + " tarefas" + (urgentes > 0 ? " (" + urgentes + " urgentes)" : ""),
        data: tarefas,
      };
    } catch (error) {
      return {
        success: false,
        message: "Erro ao listar tarefas",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
};

export const criarTarefa: BaborellaTool = {
  name: "criar_tarefa",
  category: ActionCategory.TAREFAS,
  description: "Create a new task with title, description, priority, and optional due date.",
  descriptionPt: "Criar uma nova tarefa",
  parameters: {
    titulo: {
      type: "string",
      description: "Task title",
      required: true,
    },
    descricao: {
      type: "string",
      description: "Task description",
      required: false,
    },
    prioridade: {
      type: "string",
      description: "Priority: BAIXA, MEDIA, ALTA, URGENTE",
      required: false,
      enum: ["BAIXA", "MEDIA", "ALTA", "URGENTE"],
    },
    dataVencimento: {
      type: "string",
      description: "Due date in ISO format",
      required: false,
    },
    clienteId: {
      type: "string",
      description: "Client ID to associate task with",
      required: false,
    },
    prospectoId: {
      type: "string",
      description: "Prospect ID to associate task with",
      required: false,
    },
  },
  requiresApproval: true,
  getActionDescription: (params) => "Criar tarefa: " + params.titulo,
  execute: async (params, context: ToolContext): Promise<ToolResult> => {
    try {
      const { titulo, descricao, prioridade, dataVencimento, clienteId, prospectoId } = params as {
        titulo: string;
        descricao?: string;
        prioridade?: string;
        dataVencimento?: string;
        clienteId?: string;
        prospectoId?: string;
      };

      const tarefa = await prisma.tarefa.create({
        data: {
          userId: context.userId,
          titulo,
          descricao,
          prioridade: (prioridade as PrioridadeTarefa) || PrioridadeTarefa.MEDIA,
          dataVencimento: dataVencimento ? new Date(dataVencimento) : undefined,
          clienteId,
          prospectoId,
        },
        include: {
          cliente: { select: { nome: true } },
          prospecto: { select: { nomeEmpresa: true } },
        },
      });

      return {
        success: true,
        message: "Tarefa criada: " + titulo,
        data: tarefa,
      };
    } catch (error) {
      return {
        success: false,
        message: "Erro ao criar tarefa",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
};

export const concluirTarefa: BaborellaTool = {
  name: "concluir_tarefa",
  category: ActionCategory.TAREFAS,
  description: "Mark a task as completed.",
  descriptionPt: "Marcar tarefa como concluida",
  parameters: {
    tarefaId: {
      type: "string",
      description: "Task ID to complete",
      required: true,
    },
  },
  requiresApproval: true,
  getActionDescription: () => "Concluir tarefa",
  execute: async (params, context: ToolContext): Promise<ToolResult> => {
    try {
      const { tarefaId } = params as { tarefaId: string };

      const existing = await prisma.tarefa.findFirst({
        where: { id: tarefaId, userId: context.userId },
      });

      if (!existing) {
        return {
          success: false,
          message: "Tarefa nao encontrada",
          error: "TASK_NOT_FOUND",
        };
      }

      const tarefa = await prisma.tarefa.update({
        where: { id: tarefaId },
        data: {
          estado: EstadoTarefa.CONCLUIDA,
          dataConclusao: new Date(),
        },
      });

      return {
        success: true,
        message: "Tarefa concluida: " + tarefa.titulo,
        data: tarefa,
      };
    } catch (error) {
      return {
        success: false,
        message: "Erro ao concluir tarefa",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
};

export const tarefasTools = [listarTarefas, criarTarefa, concluirTarefa];
