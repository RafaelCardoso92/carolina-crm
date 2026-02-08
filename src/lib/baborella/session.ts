import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export interface SessionMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface SessionData {
  id: string;
  messages: SessionMessage[];
  context: string;
  entityType?: string;
  entityId?: string;
  updatedAt: Date;
}

const SESSION_EXPIRY_DAYS = 7;

export async function getOrCreateSession(
  userId: string,
  context: string,
  entityType?: string,
  entityId?: string
): Promise<SessionData> {
  const existing = await prisma.baborellaSession.findFirst({
    where: {
      userId,
      context,
      entityType: entityType || null,
      entityId: entityId || null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { updatedAt: "desc" },
  });

  if (existing) {
    const messages = existing.messages as unknown as SessionMessage[] || [];
    return {
      id: existing.id,
      messages,
      context: existing.context,
      entityType: existing.entityType || undefined,
      entityId: existing.entityId || undefined,
      updatedAt: existing.updatedAt,
    };
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_EXPIRY_DAYS);

  const newSession = await prisma.baborellaSession.create({
    data: {
      userId,
      context,
      entityType,
      entityId,
      messages: [],
      expiresAt,
    },
  });

  return {
    id: newSession.id,
    messages: [],
    context: newSession.context,
    entityType: newSession.entityType || undefined,
    entityId: newSession.entityId || undefined,
    updatedAt: newSession.updatedAt,
  };
}

export async function addMessageToSession(
  sessionId: string,
  message: SessionMessage
): Promise<void> {
  const session = await prisma.baborellaSession.findUnique({
    where: { id: sessionId },
  });

  if (!session) return;

  const messages = (session.messages as unknown as SessionMessage[]) || [];
  messages.push(message);

  const trimmedMessages = messages.slice(-50);

  await prisma.baborellaSession.update({
    where: { id: sessionId },
    data: {
      messages: trimmedMessages as unknown as Prisma.InputJsonValue,
      updatedAt: new Date(),
    },
  });
}

export async function clearSession(sessionId: string): Promise<void> {
  await prisma.baborellaSession.update({
    where: { id: sessionId },
    data: {
      messages: [],
      updatedAt: new Date(),
    },
  });
}

export async function getRecentSessions(
  userId: string,
  limit: number = 5
): Promise<SessionData[]> {
  const sessions = await prisma.baborellaSession.findMany({
    where: {
      userId,
      expiresAt: { gt: new Date() },
    },
    orderBy: { updatedAt: "desc" },
    take: limit,
  });

  return sessions.map((s) => ({
    id: s.id,
    messages: (s.messages as unknown as SessionMessage[]) || [],
    context: s.context,
    entityType: s.entityType || undefined,
    entityId: s.entityId || undefined,
    updatedAt: s.updatedAt,
  }));
}

export async function cleanupExpiredSessions(): Promise<number> {
  const result = await prisma.baborellaSession.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  });
  return result.count;
}
