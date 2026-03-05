import { prisma } from "@/lib/prisma";

export interface EntityContext {
  type: string;
  id: string;
  name: string;
  summary: string;
  details: Record<string, unknown>;
}

export interface QuickAction {
  label: string;
  prompt: string;
  icon?: string;
}

export interface EnhancedContext {
  page: string;
  pageTitle: string;
  entity?: EntityContext;
  quickActions: QuickAction[];
  contextSummary: string;
}

export async function getEntityContext(
  userId: string,
  entityType: string,
  entityId: string
): Promise<EntityContext | null> {
  try {
    if (entityType === "cliente") {
      const cliente = await prisma.cliente.findFirst({
        where: { id: entityId, userId },
        include: {
          vendas: {
            take: 5,
            orderBy: [{ ano: "desc" }, { mes: "desc" }],
          },
          cobrancas: {
            where: { pago: false },
            take: 3,
          },
          tarefas: {
            where: { estado: "PENDENTE" },
            take: 3,
          },
          _count: {
            select: { vendas: true, cobrancas: true },
          },
        },
      });

      if (!cliente) return null;

      const totalVendas = cliente.vendas.reduce((sum, v) => sum + Number(v.total), 0);
      const cobrancasPendentes = cliente.cobrancas.reduce((sum, c) => sum + Number(c.valor), 0);
      const statusText = cliente.ativo ? "ativo" : "inativo";

      return {
        type: "cliente",
        id: cliente.id,
        name: cliente.nome,
        summary: "Cliente " + statusText + " com " + cliente._count.vendas + " vendas (" + totalVendas.toFixed(2) + " EUR)" + (cobrancasPendentes > 0 ? ", " + cobrancasPendentes.toFixed(2) + " EUR pendentes" : ""),
        details: {
          telefone: cliente.telefone,
          email: cliente.email,
          cidade: cliente.cidade,
          ultimoContacto: cliente.ultimoContacto,
          totalVendas,
          cobrancasPendentes,
          tarefasPendentes: cliente.tarefas.length,
        },
      };
    }

    if (entityType === "prospecto") {
      const prospecto = await prisma.prospecto.findFirst({
        where: { id: entityId, userId },
        include: {
          comunicacoes: {
            take: 3,
            orderBy: { dataContacto: "desc" },
          },
          tarefas: {
            where: { estado: "PENDENTE" },
            take: 3,
          },
          _count: {
            select: { comunicacoes: true, orcamentos: true },
          },
        },
      });

      if (!prospecto) return null;

      return {
        type: "prospecto",
        id: prospecto.id,
        name: prospecto.nomeEmpresa,
        summary: "Prospecto " + prospecto.estado + (prospecto.tipoNegocio ? " (" + prospecto.tipoNegocio + ")" : "") + " com " + prospecto._count.comunicacoes + " contactos",
        details: {
          tipoNegocio: prospecto.tipoNegocio,
          estado: prospecto.estado,
          nomeContacto: prospecto.nomeContacto,
          telefone: prospecto.telefone,
          email: prospecto.email,
          cidade: prospecto.cidade,
          dataUltimoContacto: prospecto.dataUltimoContacto,
          proximaAccao: prospecto.proximaAccao,
          numContactos: prospecto._count.comunicacoes,
          tarefasPendentes: prospecto.tarefas.length,
        },
      };
    }

    return null;
  } catch (error) {
    console.error("[Context] Error fetching entity:", error);
    return null;
  }
}

export function getQuickActions(
  page: string,
  entity?: EntityContext
): QuickAction[] {
  const actions: QuickAction[] = [];

  if (entity) {
    if (entity.type === "cliente") {
      const details = entity.details as Record<string, unknown>;
      actions.push(
        { label: "Resumo vendas", prompt: "Mostra-me o resumo de vendas deste cliente", icon: "chart" },
        { label: "Criar tarefa", prompt: "Cria uma tarefa para este cliente", icon: "task" },
      );
      if ((details.cobrancasPendentes as number) > 0) {
        actions.push({ label: "Ver cobrancas", prompt: "Quais as cobrancas pendentes deste cliente?", icon: "money" });
      }
    } else if (entity.type === "prospecto") {
      const details = entity.details as Record<string, unknown>;
      actions.push(
        { label: "Atualizar estado", prompt: "Atualiza o estado deste prospecto", icon: "pipeline" },
        { label: "Criar tarefa", prompt: "Cria uma tarefa de follow-up para este prospecto", icon: "task" },
      );
      if (details.estado === "PROPOSTA" || details.estado === "NEGOCIACAO") {
        actions.push({ label: "Converter", prompt: "Converte este prospecto em cliente", icon: "convert" });
      }
    }
    return actions;
  }

  switch (page) {
    case "dashboard":
      actions.push(
        { label: "Meu resumo", prompt: "Qual o meu resumo de hoje?", icon: "summary" },
        { label: "Tarefas urgentes", prompt: "Quais as minhas tarefas urgentes?", icon: "task" },
        { label: "Cobrancas", prompt: "Mostra-me as cobrancas pendentes", icon: "money" },
      );
      break;
    case "vendas":
      actions.push(
        { label: "Resumo mes", prompt: "Qual o resumo de vendas deste mes?", icon: "chart" },
        { label: "Top produtos", prompt: "Quais os produtos mais vendidos?", icon: "product" },
      );
      break;
    case "clientes":
      actions.push(
        { label: "Sem contacto", prompt: "Quais clientes nao contacto ha mais de 30 dias?", icon: "alert" },
        { label: "Novo cliente", prompt: "Quero criar um novo cliente", icon: "add" },
      );
      break;
    case "prospectos":
      actions.push(
        { label: "Novos", prompt: "Mostra-me os prospectos novos", icon: "new" },
        { label: "Negociação", prompt: "Quais prospectos estao em negociacao?", icon: "deal" },
      );
      break;
    case "cobrancas":
      actions.push(
        { label: "Resumo", prompt: "Qual o resumo das cobrancas?", icon: "summary" },
        { label: "Altas", prompt: "Quais cobrancas pendentes acima de 500 EUR?", icon: "money" },
      );
      break;
    case "tarefas":
      actions.push(
        { label: "Urgentes", prompt: "Quais as tarefas urgentes?", icon: "alert" },
        { label: "Nova tarefa", prompt: "Quero criar uma nova tarefa", icon: "add" },
      );
      break;
    case "mapa":
      actions.push(
        { label: "Sem visita", prompt: "Quais clientes nao visito ha mais de 30 dias?", icon: "map" },
        { label: "Prospectos", prompt: "Mostra-me prospectos na minha zona", icon: "location" },
      );
      break;
    case "rotas":
      actions.push(
        { label: "Minhas rotas", prompt: "Mostra-me as minhas rotas", icon: "route" },
        { label: "Sugerir", prompt: "Sugere-me uma rota para hoje", icon: "suggest" },
      );
      break;
    default:
      actions.push(
        { label: "Ajuda", prompt: "O que podes fazer por mim?", icon: "help" },
        { label: "Resumo", prompt: "Qual o meu resumo?", icon: "summary" },
      );
  }

  return actions;
}

export async function buildEnhancedContext(
  userId: string,
  page: string,
  entityType?: string,
  entityId?: string
): Promise<EnhancedContext> {
  const pageTitle = getPageTitle(page);
  
  let entity: EntityContext | undefined;
  if (entityType && entityId) {
    const entityData = await getEntityContext(userId, entityType, entityId);
    if (entityData) {
      entity = entityData;
    }
  }

  const quickActions = getQuickActions(page, entity);
  
  let contextSummary = "Pagina atual: " + pageTitle;
  if (entity) {
    contextSummary += "\nFoco: " + entity.type + " " + entity.name + "\n" + entity.summary;
  }

  return {
    page,
    pageTitle,
    entity,
    quickActions,
    contextSummary,
  };
}

export async function buildGlobalCRMContext(userId: string): Promise<string> {
  try {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const currentQuarter = Math.ceil(currentMonth / 3);
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const startOfMonth = new Date(currentYear, now.getMonth(), 1);
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    const todayStart = new Date(currentYear, now.getMonth(), now.getDate());
    const todayEnd = new Date(currentYear, now.getMonth(), now.getDate() + 1);

    const [
      vendasMesAtual,
      vendasMesAnterior,
      vendasAnoAtual,
      objetivoMensal,
      objetivoTrimestral,
      objetivoAnual,
      clientesTotal,
      clientesAtivos,
      clientesSemContacto,
      prospectosAtivos,
      prospectosPorEstado,
      tarefasPendentes,
      tarefasUrgentes,
      tarefasVencidas,
      cobrancasPendentes,
      cobrancasPagasMes,
      rotasPendentes,
      visitasHoje,
    ] = await Promise.all([
      // Sales this month
      prisma.venda.aggregate({
        where: { cliente: { userId }, mes: currentMonth, ano: currentYear },
        _sum: { total: true },
        _count: true,
      }),
      // Sales previous month
      prisma.venda.aggregate({
        where: { cliente: { userId }, mes: prevMonth, ano: prevMonthYear },
        _sum: { total: true },
        _count: true,
      }),
      // Sales this year
      prisma.venda.aggregate({
        where: { cliente: { userId }, ano: currentYear },
        _sum: { total: true },
        _count: true,
      }),
      // Monthly target
      prisma.objetivoMensal.findUnique({
        where: { mes_ano: { mes: currentMonth, ano: currentYear } },
      }).catch(() => null),
      // Quarterly target
      prisma.objetivoTrimestral.findUnique({
        where: { trimestre_ano: { trimestre: currentQuarter, ano: currentYear } },
      }).catch(() => null),
      // Annual target
      prisma.objetivoAnual.findUnique({
        where: { ano: currentYear },
      }).catch(() => null),
      // Total clients
      prisma.cliente.count({ where: { userId } }),
      // Active clients
      prisma.cliente.count({ where: { userId, ativo: true } }),
      // Clients without contact 30+ days
      prisma.cliente.count({
        where: {
          userId,
          ativo: true,
          OR: [
            { ultimoContacto: { lt: thirtyDaysAgo } },
            { ultimoContacto: null },
          ],
        },
      }),
      // Active prospects
      prisma.prospecto.count({ where: { userId, ativo: true } }),
      // Prospects by pipeline stage
      prisma.prospecto.groupBy({
        by: ["estado"],
        where: { userId, ativo: true },
        _count: true,
      }),
      // Pending tasks
      prisma.tarefa.count({ where: { userId, estado: "PENDENTE" } }),
      // Urgent tasks
      prisma.tarefa.count({ where: { userId, estado: "PENDENTE", prioridade: "URGENTE" } }),
      // Overdue tasks
      prisma.tarefa.count({
        where: {
          userId,
          estado: { in: ["PENDENTE", "EM_PROGRESSO"] },
          dataVencimento: { lt: now },
        },
      }),
      // Pending collections
      prisma.cobranca.aggregate({
        where: { cliente: { userId }, pago: false },
        _sum: { valor: true },
        _count: true,
      }),
      // Paid this month
      prisma.cobranca.aggregate({
        where: { cliente: { userId }, pago: true, dataPago: { gte: startOfMonth } },
        _sum: { valor: true },
      }),
      // Pending routes
      prisma.rotaSalva.count({ where: { userId, concluida: false } }).catch(() => 0),
      // Visits today
      prisma.visita.count({
        where: {
          userId,
          dataAgendada: { gte: todayStart, lt: todayEnd },
          estado: "AGENDADA",
        },
      }).catch(() => 0),
    ]);

    const vendasMes = Number(vendasMesAtual._sum.total || 0);
    const vendasMesAnt = Number(vendasMesAnterior._sum.total || 0);
    const vendasAno = Number(vendasAnoAtual._sum.total || 0);
    const objMes = objetivoMensal ? Number(objetivoMensal.objetivo) : null;
    const objTri = objetivoTrimestral ? Number(objetivoTrimestral.objetivo) : null;
    const objAno = objetivoAnual ? Number(objetivoAnual.objetivo) : null;
    const cobPendVal = Number(cobrancasPendentes._sum.valor || 0);
    const cobPagasMesVal = Number(cobrancasPagasMes._sum.valor || 0);

    const fmt = (n: number) => n.toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const pipelineStr = prospectosPorEstado
      .map((p) => `${p.estado}: ${p._count}`)
      .join(", ") || "nenhum";

    const lines: string[] = [
      `=== CONTEXTO CRM (${now.toLocaleDateString("pt-PT")} ${now.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}) ===`,
      ``,
      `VENDAS:`,
      `- Este mes: ${fmt(vendasMes)} EUR (${vendasMesAtual._count} vendas)${objMes ? ` | Objetivo: ${fmt(objMes)} EUR [${Math.round((vendasMes / objMes) * 100)}%]` : ""}`,
      `- Mes anterior: ${fmt(vendasMesAnt)} EUR (${vendasMesAnterior._count} vendas)`,
      `- Este ano: ${fmt(vendasAno)} EUR (${vendasAnoAtual._count} vendas)${objAno ? ` | Objetivo: ${fmt(objAno)} EUR [${Math.round((vendasAno / objAno) * 100)}%]` : ""}`,
    ];

    if (objTri) {
      lines.push(`- Objetivo trimestral (Q${currentQuarter}): ${fmt(objTri)} EUR`);
    }

    lines.push(
      ``,
      `CLIENTES:`,
      `- Total: ${clientesTotal} (${clientesAtivos} ativos)`,
      `- Sem contacto ha 30+ dias: ${clientesSemContacto}`,
      ``,
      `PROSPECTOS: ${prospectosAtivos} ativos`,
      `- Pipeline: ${pipelineStr}`,
      ``,
      `TAREFAS:`,
      `- Pendentes: ${tarefasPendentes}${tarefasUrgentes > 0 ? ` (${tarefasUrgentes} URGENTES)` : ""}`,
      `- Vencidas: ${tarefasVencidas}`,
      ``,
      `COBRANCAS:`,
      `- Pendentes: ${fmt(cobPendVal)} EUR (${cobrancasPendentes._count} faturas)`,
      `- Pagas este mes: ${fmt(cobPagasMesVal)} EUR`,
    );

    if (rotasPendentes > 0) {
      lines.push(``, `ROTAS: ${rotasPendentes} pendentes`);
    }

    if (visitasHoje > 0) {
      lines.push(``, `VISITAS HOJE: ${visitasHoje}`);
    }

    return lines.join("\n");
  } catch (error) {
    console.error("[Context] Error building global CRM context:", error);
    return "Contexto CRM indisponivel";
  }
}

function getPageTitle(page: string): string {
  const titles: Record<string, string> = {
    dashboard: "Dashboard",
    vendas: "Vendas",
    clientes: "Clientes",
    prospectos: "Prospectos",
    cobrancas: "Cobrancas",
    tarefas: "Tarefas",
    mapa: "Mapa",
    rotas: "Rotas",
    produtos: "Produtos",
    despesas: "Despesas",
    definicoes: "Definicoes",
  };
  return titles[page] || page;
}
