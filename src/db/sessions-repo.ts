import { and, asc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { AgentMessage, type TranscriptEntry } from "@/api/contract";
import type { Usage } from "@/agents/usage";
import { SessionState } from "@/workflow/state";
import type { Db } from "./client";
import { messages, sessions, usage as usageTable } from "./schema";

export type StoredSession = { id: string; version: number; state: SessionState; transcript: TranscriptEntry[] };

/** Another turn on the same session was saved first. */
export class SessionBusyError extends Error {}

const UserContent = z.object({ text: z.string() });

function toTranscript(row: typeof messages.$inferSelect): TranscriptEntry {
  return row.role === "user"
    ? { role: "user", text: UserContent.parse(row.content).text }
    : { role: "agent", message: AgentMessage.parse(row.content) };
}

function stateColumns(state: SessionState) {
  return {
    draft: state.draft,
    diagnosis: state.diagnosis,
    plannerState: state.planner,
    forcedWordings: state.forcedWordings,
    sectionCache: state.sectionCache,
    posting: state.posting,
    quickReplies: state.quickReplies,
  };
}

export async function loadSession(db: Db, id: string): Promise<StoredSession | null> {
  const [row] = await db.select().from(sessions).where(eq(sessions.id, id));
  if (!row) return null;
  const state = SessionState.parse({
    draft: row.draft,
    diagnosis: row.diagnosis,
    planner: row.plannerState,
    forcedWordings: row.forcedWordings,
    sectionCache: row.sectionCache,
    posting: row.posting,
    quickReplies: row.quickReplies,
  });
  const rows = await db.select().from(messages).where(eq(messages.sessionId, id)).orderBy(asc(messages.id));
  return { id, version: row.version, state, transcript: rows.map(toTranscript) };
}

export type TurnRecord = {
  /** Null for a new session. */
  session: { id: string; version: number } | null;
  state: SessionState;
  userText: string;
  agentMessage: AgentMessage;
  usage: Usage[];
};

function usageRows(sessionId: string | null, usage: Usage[]) {
  return usage.map((entry) => ({
    sessionId,
    model: entry.model,
    inputTokens: entry.inputTokens,
    outputTokens: entry.outputTokens,
  }));
}

/** One short transaction, after every LLM call: state, both messages and usage. Returns the session id. */
export async function saveTurn(db: Db, record: TurnRecord): Promise<string> {
  return db.transaction(async (tx) => {
    let id: string;
    if (record.session === null) {
      const [created] = await tx.insert(sessions).values(stateColumns(record.state)).returning({ id: sessions.id });
      if (!created) throw new Error("Session insert returned no row");
      id = created.id;
    } else {
      const { id: sessionId, version } = record.session;
      const updated = await tx
        .update(sessions)
        .set({ ...stateColumns(record.state), version: sql`${sessions.version} + 1`, updatedAt: new Date() })
        .where(and(eq(sessions.id, sessionId), eq(sessions.version, version)))
        .returning({ id: sessions.id });
      if (updated.length === 0) throw new SessionBusyError(`Session ${sessionId} changed during the turn`);
      id = sessionId;
    }
    await tx.insert(messages).values([
      { sessionId: id, role: "user", content: { text: record.userText } },
      { sessionId: id, role: "agent", content: record.agentMessage },
    ]);
    if (record.usage.length > 0) await tx.insert(usageTable).values(usageRows(id, record.usage));
    return id;
  });
}

/** Tokens spent by a turn that could not be saved still count against the daily limit. */
export async function recordUsage(db: Db, sessionId: string | null, usage: Usage[]): Promise<void> {
  if (usage.length > 0) await db.insert(usageTable).values(usageRows(sessionId, usage));
}
