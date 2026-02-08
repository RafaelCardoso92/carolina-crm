import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  approveAndExecuteAction,
  rejectAction,
  getPendingActions,
} from "@/lib/baborella";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId") || undefined;

    const pendingActions = await getPendingActions(session.user.id, sessionId);

    return NextResponse.json({ actions: pendingActions });
  } catch (error) {
    console.error("[Agent Action GET Error]", error);
    return NextResponse.json(
      { error: "Erro ao obter acoes pendentes" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { actionId, approve } = body as {
      actionId: string;
      approve: boolean;
    };

    if (!actionId) {
      return NextResponse.json(
        { error: "actionId e obrigatorio" },
        { status: 400 }
      );
    }

    if (approve) {
      const result = await approveAndExecuteAction(actionId, session.user.id);
      return NextResponse.json({
        success: true,
        result: result.result,
        status: result.status,
      });
    } else {
      await rejectAction(actionId, session.user.id);
      return NextResponse.json({
        success: true,
        message: "Acao rejeitada",
      });
    }
  } catch (error) {
    console.error("[Agent Action POST Error]", error);
    const message = error instanceof Error ? error.message : "Erro ao processar acao";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
