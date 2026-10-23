import type { ChatRequest, SessionView } from "@/api/contract";
import { isBudgetExhausted, startOfBudgetDay, totalsByKind, type ModelKind, type TokenTotals } from "@/budget/daily-limit";
import type { Db } from "@/db/client";
import { loadSession, recordUsage, saveTurn, SessionBusyError, type StoredSession } from "@/db/sessions-repo";
import { usageTotalsSince } from "@/db/usage-repo";
import { initialState } from "@/workflow/state";
import { runTurn, TurnFailedError, type TurnWorkflow } from "@/workflow/turn";
import type { TurnInput } from "@/workflow/turn-context";
import { ApiFailure } from "./api-errors";
import { toSessionView } from "./session-view";

export type ChatServiceDeps = {
  db: Db;
  workflow: TurnWorkflow;
  /** Model ids from env, to map usage rows to fast or writer. */
  models: () => Record<ModelKind, string>;
  limits: () => TokenTotals;
  now: () => Date;
};

const STALE_QUICK_REPLY = "Questa risposta rapida non è più valida: scrivi pure in chat.";

function turnInput(request: ChatRequest, stored: StoredSession | null): TurnInput {
  if (request.kind === "message") return { kind: "message", text: request.text };
  const reply = stored?.state.quickReplies.find((candidate) => candidate.id === request.replyId);
  if (!reply) throw new ApiFailure("invalidRequest", STALE_QUICK_REPLY);
  return { kind: "quickReply", label: reply.label, action: reply.action };
}

async function assertBudget(deps: ChatServiceDeps): Promise<void> {
  const rows = await usageTotalsSince(deps.db, startOfBudgetDay(deps.now()));
  if (isBudgetExhausted(totalsByKind(rows, deps.models()), deps.limits())) throw new ApiFailure("budgetExhausted");
}

/**
 * One chat turn: load, check the daily limit, run the workflow (LLM calls, no transaction), save.
 * `clientId` is the browser that starts a new session, so it shows up in that browser's list.
 */
export async function handleChat(request: ChatRequest, deps: ChatServiceDeps, clientId: string | null = null): Promise<SessionView> {
  const stored = request.sessionId ? await loadSession(deps.db, request.sessionId) : null;
  if (request.sessionId && !stored) throw new ApiFailure("sessionNotFound");
  const input = turnInput(request, stored);
  await assertBudget(deps);

  const outcome = await runTurn(deps.workflow, input, stored?.state ?? initialState()).catch(async (error: unknown) => {
    if (error instanceof TurnFailedError) await recordUsage(deps.db, stored?.id ?? null, error.usage);
    throw error;
  });
  const userText = input.kind === "message" ? input.text : input.label;
  const session = stored ? { id: stored.id, version: stored.version } : null;
  let sessionId: string;
  try {
    sessionId = await saveTurn(deps.db, { session, clientId, state: outcome.state, userText, agentMessage: outcome.message, usage: outcome.usage });
  } catch (error) {
    if (!(error instanceof SessionBusyError)) throw error;
    await recordUsage(deps.db, stored?.id ?? null, outcome.usage);
    throw new ApiFailure("sessionBusy");
  }
  const transcript = [
    ...(stored?.transcript ?? []),
    { role: "user" as const, text: userText },
    { role: "agent" as const, message: outcome.message },
  ];
  return toSessionView(sessionId, outcome.state, transcript);
}

export async function getSessionView(db: Db, id: string): Promise<SessionView> {
  const stored = await loadSession(db, id);
  if (!stored) throw new ApiFailure("sessionNotFound");
  return toSessionView(stored.id, stored.state, stored.transcript);
}
