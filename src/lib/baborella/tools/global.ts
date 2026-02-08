import { ActionCategory, EstadoTarefa } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { BaborellaTool, ToolContext, ToolResult } from "../types";

export const navegarPara: BaborellaTool = {
  name: "navegar_para",
  category: ActionCategory.GLOBAL,
  description: "Navigate the user to a specific page in the application.",
  descriptionPt: "Navegar para uma pagina especifica",
  parameters: {
    pagina: {
      type: "string",
      description: "Page to navigate to",
      required: true,
      enum: [
        "dashboard",
        "vendas",
        "clientes",
        "prospectos",
        "cobrancas",
        "tarefas",
        "mapa",
        "rotas",
        "produtos",
        "despesas",
        "definicoes",
      ],
    },
  },
  requiresApproval: false,
  getActionDescription: (params) => "Navegar para: " + params.pagina,
  execute: async (params): Promise<ToolResult> => {
    const { pagina } = params as { pagina: string };
    
    return {
      success: true,
      message: "A navegar para " + pagina,
      data: { navigateTo: "/" + pagina },
    };
  },
};

export const meuResumo: BaborellaTool = {
  name: "meu_resumo",
  category: ActionCategory.GLOBAL,
  description: "Get a summary of the users current stats: sales this month, pending tasks, collections, etc.",
  descriptionPt: "Obter resumo das minhas estatisticas",
  parameters: {},
  requiresApproval: false,
  getActionDescription: () => "Obter resumo pessoal",
  execute: async (params, context: ToolContext): Promise<ToolResult> => {
    try {
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      const [
        vendasMes,
        clientesTotal,
        clientesAtivos,
        prospectosTotal,
        tarefasPendentes,
        cobrancasPendentes,
      ] = await Promise.all([
        prisma.venda.aggregate({
          where: {
            cliente: { userId: context.userId },
            mes: currentMonth,
            ano: currentYear,
          },
          _sum: { total: true },
          _count: true,
        }),
        prisma.cliente.count({
          where: { userId: context.userId },
        }),
        prisma.cliente.count({
          where: { userId: context.userId, ativo: true },
        }),
        prisma.prospecto.count({
          where: { userId: context.userId },
        }),
        prisma.tarefa.count({
          where: { userId: context.userId, estado: EstadoTarefa.PENDENTE },
        }),
        prisma.cobranca.aggregate({
          where: {
            cliente: { userId: context.userId },
            pago: false,
          },
          _sum: { valor: true },
          _count: true,
        }),
      ]);

      const vendasTotal = vendasMes._sum?.total ? Number(vendasMes._sum.total) : 0;
      const cobrancasTotal = cobrancasPendentes._sum?.valor ? Number(cobrancasPendentes._sum.valor) : 0;

      const resumo = {
        vendas: {
          mes: {
            total: vendasTotal,
            quantidade: vendasMes._count,
          },
        },
        clientes: {
          total: clientesTotal,
          ativos: clientesAtivos,
        },
        prospectos: prospectosTotal,
        tarefasPendentes,
        cobrancasPendentes: {
          total: cobrancasTotal,
          quantidade: cobrancasPendentes._count,
        },
      };

      return {
        success: true,
        message: "Este mes: " + vendasTotal.toFixed(2) + " EUR em " + vendasMes._count + " vendas. " + tarefasPendentes + " tarefas pendentes.",
        data: resumo,
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

export const ajuda: BaborellaTool = {
  name: "ajuda",
  category: ActionCategory.GLOBAL,
  description: "Show what actions Baborella can help with in the current context.",
  descriptionPt: "Mostrar ajuda sobre acoes disponiveis",
  parameters: {
    categoria: {
      type: "string",
      description: "Specific category to get help for",
      required: false,
      enum: ["vendas", "clientes", "prospectos", "cobrancas", "tarefas", "mapa", "rotas"],
    },
  },
  requiresApproval: false,
  getActionDescription: (params) => 
    params.categoria ? "Ajuda sobre: " + params.categoria : "Mostrar ajuda geral",
  execute: async (params): Promise<ToolResult> => {
    const { categoria } = params as { categoria?: string };

    const helpTopics: Record<string, string[]> = {
      vendas: [
        "Pesquisar vendas por periodo",
        "Ver resumo de vendas (mes/ano)",
        "Analisar produtos mais vendidos",
      ],
      clientes: [
        "Pesquisar clientes por nome ou cidade",
        "Ver detalhes de um cliente",
        "Criar novo cliente",
        "Atualizar informacoes de cliente",
      ],
      prospectos: [
        "Pesquisar prospectos no mapa",
        "Converter prospecto em cliente",
        "Adicionar notas a prospecto",
      ],
      cobrancas: [
        "Ver cobrancas pendentes",
        "Registar pagamento",
        "Analisar risco de cobranca",
      ],
      tarefas: [
        "Criar nova tarefa",
        "Ver tarefas pendentes",
        "Marcar tarefa como concluida",
      ],
      mapa: [
        "Pesquisar clientes/prospectos na area",
        "Ver clientes sem visita recente",
        "Calcular rota otimizada",
      ],
      rotas: [
        "Criar nova rota",
        "Guardar rota para uso futuro",
        "Otimizar rota existente",
      ],
    };

    if (categoria && helpTopics[categoria]) {
      return {
        success: true,
        message: "Posso ajudar com " + categoria + ":\n" + helpTopics[categoria].map(h => "- " + h).join("\n"),
        data: { categoria, acoes: helpTopics[categoria] },
      };
    }

    const allHelp = Object.entries(helpTopics)
      .map(([cat, items]) => cat.charAt(0).toUpperCase() + cat.slice(1) + ": " + items.slice(0, 2).join(", ") + "...")
      .join("\n");

    return {
      success: true,
      message: "Posso ajudar em varias areas:\n\n" + allHelp + "\n\nPergunta-me algo especifico ou pede ajuda <categoria> para mais detalhes.",
      data: helpTopics,
    };
  },
};

export const globalTools = [navegarPara, meuResumo, ajuda];
