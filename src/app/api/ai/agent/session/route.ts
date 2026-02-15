import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getOrCreateSession,
  clearSession,
  getRecentSessions,
} from "@/lib/baborella/session";

// GET - Get or create session for current context
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const context = searchParams.get("context") || "dashboard";
    const entityType = searchParams.get("entityType") || undefined;
    const entityId = searchParams.get("entityId") || undefined;

    const sessionData = await getOrCreateSession(
      session.user.id,
      context,
      entityType,
      entityId
    );

    return NextResponse.json(sessionData);
  } catch (error) {
    console.error("[Session API Error]", error);
    return NextResponse.json(
      { error: "Erro ao obter sessao" },
      { status: 500 }
    );
  }
}

// DELETE - Clear session history
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId obrigatorio" },
        { status: 400 }
      );
    }

    await clearSession(sessionId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Session API Error]", error);
    return NextResponse.json(
      { error: "Erro ao limpar sessao" },
      { status: 500 }
    );
  }
}
