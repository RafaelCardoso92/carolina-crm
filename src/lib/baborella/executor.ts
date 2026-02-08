import { ActionStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { toolRegistry } from "./registry";
import { ToolContext, ToolResult, PendingAction } from "./types";

export interface ExecutionResult {
  actionId: string;
  status: ActionStatus;
  result?: ToolResult;
  requiresApproval: boolean;
}

export async function createPendingAction(
  toolName: string,
  parameters: Record<string, unknown>,
  context: ToolContext
): Promise<PendingAction> {
  const tool = toolRegistry.get(toolName);
  
  if (!tool) {
    throw new Error("Tool " + toolName + " not found");
  }

  const action = await prisma.baborellaAction.create({
    data: {
      userId: context.userId,
      sessionId: context.sessionId,
      toolName,
      category: tool.category,
      parameters: parameters as Prisma.InputJsonValue,
      description: tool.getActionDescription(parameters),
      status: ActionStatus.PENDING,
      requiresApproval: tool.requiresApproval,
    },
  });

  return {
    id: action.id,
    toolName: action.toolName,
    description: action.description,
    parameters: parameters,
  };
}

export async function executeToolDirectly(
  toolName: string,
  parameters: Record<string, unknown>,
  context: ToolContext
): Promise<ExecutionResult> {
  const tool = toolRegistry.get(toolName);
  
  if (!tool) {
    throw new Error("Tool " + toolName + " not found");
  }

  const action = await prisma.baborellaAction.create({
    data: {
      userId: context.userId,
      sessionId: context.sessionId,
      toolName,
      category: tool.category,
      parameters: parameters as Prisma.InputJsonValue,
      description: tool.getActionDescription(parameters),
      status: ActionStatus.EXECUTING,
      requiresApproval: false,
    },
  });

  try {
    const result = await tool.execute(parameters, context);

    await prisma.baborellaAction.update({
      where: { id: action.id },
      data: {
        status: result.success ? ActionStatus.COMPLETED : ActionStatus.FAILED,
        result: result as unknown as Prisma.InputJsonValue,
        error: result.error,
        executedAt: new Date(),
      },
    });

    return {
      actionId: action.id,
      status: result.success ? ActionStatus.COMPLETED : ActionStatus.FAILED,
      result,
      requiresApproval: false,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    await prisma.baborellaAction.update({
      where: { id: action.id },
      data: {
        status: ActionStatus.FAILED,
        error: errorMessage,
        executedAt: new Date(),
      },
    });

    return {
      actionId: action.id,
      status: ActionStatus.FAILED,
      result: {
        success: false,
        message: "Erro ao executar acao",
        error: errorMessage,
      },
      requiresApproval: false,
    };
  }
}

export async function approveAndExecuteAction(
  actionId: string,
  userId: string
): Promise<ExecutionResult> {
  const action = await prisma.baborellaAction.findFirst({
    where: {
      id: actionId,
      userId,
      status: ActionStatus.PENDING,
    },
  });

  if (!action) {
    throw new Error("Action not found or already processed");
  }

  const tool = toolRegistry.get(action.toolName);
  
  if (!tool) {
    await prisma.baborellaAction.update({
      where: { id: actionId },
      data: {
        status: ActionStatus.FAILED,
        error: "Tool " + action.toolName + " not found",
      },
    });
    throw new Error("Tool " + action.toolName + " not found");
  }

  await prisma.baborellaAction.update({
    where: { id: actionId },
    data: {
      status: ActionStatus.EXECUTING,
      approvedAt: new Date(),
    },
  });

  const context: ToolContext = {
    userId: action.userId,
    sessionId: action.sessionId,
  };

  try {
    const result = await tool.execute(action.parameters as Record<string, unknown>, context);

    await prisma.baborellaAction.update({
      where: { id: actionId },
      data: {
        status: result.success ? ActionStatus.COMPLETED : ActionStatus.FAILED,
        result: result as unknown as Prisma.InputJsonValue,
        error: result.error,
        executedAt: new Date(),
      },
    });

    return {
      actionId,
      status: result.success ? ActionStatus.COMPLETED : ActionStatus.FAILED,
      result,
      requiresApproval: true,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    await prisma.baborellaAction.update({
      where: { id: actionId },
      data: {
        status: ActionStatus.FAILED,
        error: errorMessage,
        executedAt: new Date(),
      },
    });

    return {
      actionId,
      status: ActionStatus.FAILED,
      result: {
        success: false,
        message: "Erro ao executar acao",
        error: errorMessage,
      },
      requiresApproval: true,
    };
  }
}

export async function rejectAction(
  actionId: string,
  userId: string
): Promise<void> {
  await prisma.baborellaAction.updateMany({
    where: {
      id: actionId,
      userId,
      status: ActionStatus.PENDING,
    },
    data: {
      status: ActionStatus.REJECTED,
    },
  });
}

export async function getPendingActions(
  userId: string,
  sessionId?: string
): Promise<PendingAction[]> {
  const actions = await prisma.baborellaAction.findMany({
    where: {
      userId,
      status: ActionStatus.PENDING,
      ...(sessionId && { sessionId }),
    },
    orderBy: { createdAt: "asc" },
  });

  return actions.map((a) => ({
    id: a.id,
    toolName: a.toolName,
    description: a.description,
    parameters: a.parameters as Record<string, unknown>,
  }));
}
