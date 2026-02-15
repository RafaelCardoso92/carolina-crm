import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { buildEnhancedContext } from "@/lib/baborella/context";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = searchParams.get("page") || "dashboard";
    const entityType = searchParams.get("entityType") || undefined;
    const entityId = searchParams.get("entityId") || undefined;

    const context = await buildEnhancedContext(
      session.user.id,
      page,
      entityType,
      entityId
    );

    return NextResponse.json(context);
  } catch (error) {
    console.error("[Context API Error]", error);
    return NextResponse.json(
      { error: "Erro ao obter contexto" },
      { status: 500 }
    );
  }
}
