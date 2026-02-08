import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  toolRegistry,
  buildSystemPrompt,
  executeToolDirectly,
  createPendingAction,
  ToolContext,
  PendingAction,
  toolToOpenAIFunction,
} from "@/lib/baborella";
import { buildEnhancedContext } from "@/lib/baborella/context";
import { getOrCreateSession, addMessageToSession, SessionMessage } from "@/lib/baborella/session";
import { checkTokens, getTokenBalance } from "@/lib/ai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ChatMessage {
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  tool_call_id?: string;
  tool_calls?: OpenAI.Chat.Completions.ChatCompletionMessageToolCall[];
}

interface ChainedActionResult {
  toolName: string;
  success: boolean;
  message: string;
  requiresApproval: boolean;
  actionId?: string;
}

async function trackTokenUsage(userId: string, tokensUsed: number): Promise<void> {
  await prisma.tokenBalance.upsert({
    where: { userId },
    create: {
      userId,
      tokensTotal: 0,
      tokensUsed: tokensUsed,
    },
    update: {
      tokensUsed: { increment: tokensUsed },
    },
  });

  await prisma.tokenUsage.create({
    data: {
      userId,
      feature: "baborella",
      inputTokens: tokensUsed,
      outputTokens: 0,
      totalTokens: tokensUsed,
      costEur: tokensUsed * 0.000001,
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { 
      message, 
      context = {},
    } = body as {
      message: string;
      context?: {
        page?: string;
        entityType?: string;
        entityId?: string;
      };
    };

    const tokenCheck = await checkTokens(session.user.id, 100);
    if (!tokenCheck.allowed) {
      return NextResponse.json(
        { error: "Tokens insuficientes", tokensRemaining: tokenCheck.remaining },
        { status: 402 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilizador nao encontrado" }, { status: 404 });
    }

    const persistentSession = await getOrCreateSession(
      session.user.id,
      context.page || "dashboard",
      context.entityType,
      context.entityId
    );

    const enhancedContext = await buildEnhancedContext(
      session.user.id,
      context.page || "dashboard",
      context.entityType,
      context.entityId
    );

    const contextualTools = toolRegistry.getContextualTools({
      page: context.page,
      entityType: context.entityType,
    });

    let entityContextStr = "";
    if (enhancedContext.entity) {
      entityContextStr = "\n\nContexto da entidade atual:\n" + 
        "Tipo: " + enhancedContext.entity.type + "\n" +
        "Nome: " + enhancedContext.entity.name + "\n" +
        "Resumo: " + enhancedContext.entity.summary + "\n" +
        "Detalhes: " + JSON.stringify(enhancedContext.entity.details, null, 2);
    }

    const systemPrompt = buildSystemPrompt({
      userName: user.name || user.email,
      currentPage: enhancedContext.pageTitle,
      entityType: enhancedContext.entity?.type,
      entityId: enhancedContext.entity?.id,
      entityName: enhancedContext.entity?.name,
      availableTools: contextualTools.map((t) => t.name + ": " + t.descriptionPt),
    }) + entityContextStr;

    // Build messages from history (excluding last 10 to avoid too much context)
    const historyMessages: ChatMessage[] = persistentSession.messages
      .slice(-10)
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

    // Build final messages: system + history + CURRENT user message
    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...historyMessages,
      { role: "user", content: message }, // Add current message!
    ];

    const openAITools = contextualTools.map(toolToOpenAIFunction);
    let totalTokensUsed = 0;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
      tools: openAITools.length > 0 ? openAITools : undefined,
      tool_choice: openAITools.length > 0 ? "auto" : undefined,
      temperature: 0.7,
      max_tokens: 1000,
      parallel_tool_calls: true,
    });

    totalTokensUsed += completion.usage?.total_tokens || 0;

    const assistantMessage = completion.choices[0].message;
    
    const toolContext: ToolContext = {
      userId: session.user.id,
      sessionId: persistentSession.id,
      currentPage: context.page,
      entityType: context.entityType,
      entityId: context.entityId,
      userData: {
        name: user.name || "",
        email: user.email,
        role: user.role,
      },
    };

    let finalResponse = assistantMessage.content || "";
    const pendingActions: PendingAction[] = [];
    const chainedResults: ChainedActionResult[] = [];

    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      const toolResults: { tool_call_id: string; content: string }[] = [];

      for (const toolCall of assistantMessage.tool_calls) {
        if (toolCall.type !== "function") continue;
        
        const toolName = toolCall.function.name;
        const tool = toolRegistry.get(toolName);
        
        if (!tool) {
          const errorResult: ChainedActionResult = {
            toolName,
            success: false,
            message: "Ferramenta nao encontrada",
            requiresApproval: false,
          };
          chainedResults.push(errorResult);
          toolResults.push({
            tool_call_id: toolCall.id,
            content: JSON.stringify({ error: "Tool " + toolName + " not found" }),
          });
          continue;
        }

        const params = JSON.parse(toolCall.function.arguments);

        if (enhancedContext.entity) {
          if (enhancedContext.entity.type === "cliente" && params.clienteId === undefined && tool.parameters.clienteId) {
            params.clienteId = enhancedContext.entity.id;
          }
          if (enhancedContext.entity.type === "prospecto" && params.prospectoId === undefined && tool.parameters.prospectoId) {
            params.prospectoId = enhancedContext.entity.id;
          }
        }

        if (tool.requiresApproval) {
          const pendingAction = await createPendingAction(toolName, params, toolContext);
          pendingActions.push(pendingAction);
          
          const actionResult: ChainedActionResult = {
            toolName,
            success: true,
            message: pendingAction.description,
            requiresApproval: true,
            actionId: pendingAction.id,
          };
          chainedResults.push(actionResult);
          
          toolResults.push({
            tool_call_id: toolCall.id,
            content: JSON.stringify({
              requiresApproval: true,
              actionId: pendingAction.id,
              description: pendingAction.description,
            }),
          });
        } else {
          const result = await executeToolDirectly(toolName, params, toolContext);
          
          const actionResult: ChainedActionResult = {
            toolName,
            success: result.result?.success || false,
            message: result.result?.message || "Executado",
            requiresApproval: false,
          };
          chainedResults.push(actionResult);
          
          toolResults.push({
            tool_call_id: toolCall.id,
            content: JSON.stringify(result.result),
          });
        }
      }

      if (toolResults.length > 0) {
        const followUpMessages = [
          ...messages,
          assistantMessage,
          ...toolResults.map((tr) => ({
            role: "tool" as const,
            tool_call_id: tr.tool_call_id,
            content: tr.content,
          })),
        ];

        const followUp = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: followUpMessages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
          temperature: 0.7,
          max_tokens: 500,
        });

        totalTokensUsed += followUp.usage?.total_tokens || 0;
        finalResponse = followUp.choices[0].message.content || "";
      }
    }

    // Save messages to session AFTER processing
    const userSessionMessage: SessionMessage = {
      role: "user",
      content: message,
      timestamp: new Date().toISOString(),
    };
    await addMessageToSession(persistentSession.id, userSessionMessage);

    const assistantSessionMessage: SessionMessage = {
      role: "assistant",
      content: finalResponse,
      timestamp: new Date().toISOString(),
    };
    await addMessageToSession(persistentSession.id, assistantSessionMessage);

    await trackTokenUsage(session.user.id, totalTokensUsed);
    const updatedBalance = await getTokenBalance(session.user.id);

    return NextResponse.json({
      message: finalResponse,
      sessionId: persistentSession.id,
      pendingActions: pendingActions.length > 0 ? pendingActions : undefined,
      chainedActions: chainedResults.length > 1 ? chainedResults : undefined,
      tokensUsed: totalTokensUsed,
      tokensRemaining: updatedBalance.remaining,
    });
  } catch (error) {
    console.error("[Agent API Error]", error);
    return NextResponse.json(
      { error: "Erro ao processar pedido" },
      { status: 500 }
    );
  }
}
