import { and, asc, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { AgentMessage, type TranscriptEntry } from "@/api/contract";
import type { Usage } from "@/agents/usage";
import { Draft } from "@/domain/draft";
import { SessionState } from "@/workflow/state";
import type { Db } from "./client";
import { messages, sessions, usage as usageTable } from "./schema";

export type StoredSession = {
  id: string;
  version: number;
  /** Below `version`: the posting was not rendered for the last turn yet. */
  renderedVersion: number;
  state: SessionState;
  transcript: TranscriptEntry[];
};

/** Another turn on the same session was saved first. */
export class SessionBusyError extends Error {}

const UserContent = z.object({ text: z.string() });

function toTranscript(row: typeof messages.$inferSelect): TranscriptEntry {
  return row.role === "user"
    ? { role: "user", text: UserContent.parse(row.content).text }
    : { role: "agent", message: AgentMessage.parse(row.content) };
}

/** Written by a turn. */
function turnColumns(state: SessionState) {
  return {
    draft: state.draft,
    plannerState: state.planner,
    forcedWordings: state.forcedWordings,
    quickReplies: state.quickReplies,
  };
}

/** Written by a render only, so a turn saved meanwhile never overwrites a newer posting. */
function renderColumns(state: SessionState) {
  return { sectionCache: state.sectionCache, posting: state.posting, sheet: state.sheet };
}

export async function loadSession(db: Db, id: string): Promise<StoredSession | null> {
  const [row] = await db.select().from(sessions).where(eq(sessions.id, id));
  if (!row) return null;
  const state = SessionState.parse({
    draft: row.draft,
    planner: row.plannerState,
    forcedWordings: row.forcedWordings,
    sectionCache: row.sectionCache,
    posting: row.posting,
    sheet: row.sheet,
    quickReplies: row.quickReplies,
  });
  const rows = await db.select().from(messages).where(eq(messages.sessionId, id)).orderBy(asc(messages.id));
  return { id, version: row.version, renderedVersion: row.renderedVersion, state, transcript: rows.map(toTranscript) };
}

export type TurnRecord = {
  /** Null for a new session. */
  session: { id: string; version: number } | null;
  /** Browser that starts a new session; ignored for an existing one. */
  clientId: string | null;
  state: SessionState;
  userText: string;
  agentMessage: AgentMessage;
  usage: Usage[];
  /** The posting lags this turn (it changed what the renderer reads, or an earlier render is unsaved). */
  postingPending: boolean;
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
      const [created] = await tx
        .insert(sessions)
        .values({
          ...turnColumns(record.state),
          ...renderColumns(record.state),
          clientId: record.clientId,
          renderedVersion: record.postingPending ? 0 : 1,
        })
        .returning({ id: sessions.id });
      if (!created) throw new Error("Session insert returned no row");
      id = created.id;
    } else {
      const { id: sessionId, version } = record.session;
      const updated = await tx
        .update(sessions)
        .set({
          ...turnColumns(record.state),
          version: sql`${sessions.version} + 1`,
          renderedVersion: record.postingPending ? sessions.renderedVersion : sql`${sessions.version} + 1`,
          updatedAt: new Date(),
        })
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

export type RenderRecord = { id: string; version: number; state: SessionState; usage: Usage[] };

/**
 * Saves a posting rendered for `version`; false if a turn was saved meanwhile (its own render follows).
 * The tokens count either way.
 */
export async function saveRender(db: Db, record: RenderRecord): Promise<boolean> {
  return db.transaction(async (tx) => {
    const updated = await tx
      .update(sessions)
      .set({ ...renderColumns(record.state), renderedVersion: record.version })
      .where(and(eq(sessions.id, record.id), eq(sessions.version, record.version)))
      .returning({ id: sessions.id });
    if (record.usage.length > 0) await tx.insert(usageTable).values(usageRows(record.id, record.usage));
    return updated.length > 0;
  });
}

/** Tokens spent by a turn that could not be saved still count against the daily limit. */
export async function recordUsage(db: Db, sessionId: string | null, usage: Usage[]): Promise<void> {
  if (usage.length > 0) await db.insert(usageTable).values(usageRows(sessionId, usage));
}

export const SESSION_LIST_LIMIT = 20;

export type SessionListRow = { id: string; draft: Draft; updatedAt: Date };

/** The latest chats of one browser; only the draft is needed to summarise them. */
export async function listSessions(db: Db, clientId: string): Promise<SessionListRow[]> {
  const rows = await db
    .select({ id: sessions.id, draft: sessions.draft, updatedAt: sessions.updatedAt })
    .from(sessions)
    .where(eq(sessions.clientId, clientId))
    .orderBy(desc(sessions.updatedAt))
    .limit(SESSION_LIST_LIMIT);
  return rows.map((row) => ({ id: row.id, draft: Draft.parse(row.draft), updatedAt: row.updatedAt }));
}
