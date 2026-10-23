import type { ChatRequest, SessionView } from "@/api/contract";
import type { Db } from "@/db/client";
import { loadSession, recordUsage, saveTurn, SessionBusyError, type StoredSession } from "@/db/sessions-repo";
import { initialState, needsRender, type SessionState } from "@/workflow/state";
import { runTurn, TurnFailedError, type TurnWorkflow } from "@/workflow/turn";
import type { TurnInput } from "@/workflow/turn-context";
import { ApiFailure } from "./api-errors";
import { assertBudget, type BudgetDeps } from "./budget-check";
import { toSessionView } from "./session-view";

export type ChatServiceDeps = BudgetDeps & { workflow: TurnWorkflow };

const STALE_QUICK_REPLY = "Questa risposta rapida non è più valida: scrivi pure in chat.";

function turnInput(request: ChatRequest, stored: StoredSession | null): TurnInput {
  if (request.kind !== "quickReply") return { kind: "message", text: request.text };
  const reply = stored?.state.quickReplies.find((candidate) => candidate.id === request.replyId);
  if (!reply) throw new ApiFailure("invalidRequest", STALE_QUICK_REPLY);
  return { kind: "quickReply", label: reply.label, action: reply.action };
}

/** The state the turn starts from: the stored one, or an empty one for a new session. */
function previousState(request: ChatRequest, stored: StoredSession | null): SessionState {
  if (request.kind === "start") return initialState();
  if (!stored) throw new ApiFailure("sessionNotFound");
  return stored.state;
}

/**
 * One chat turn: load, check the daily limit, run the workflow (LLM calls, no transaction), save.
 * The posting is rendered by a separate call (render-service.ts) so the reply comes first.
 * `clientId` is the browser that starts a new session, so it shows up in that browser's list.
 */
export async function handleChat(request: ChatRequest, deps: ChatServiceDeps, clientId: string | null = null): Promise<SessionView> {
  const stored = request.kind === "start" ? null : await loadSession(deps.db, request.sessionId);
  const previous = previousState(request, stored);
  const input = turnInput(request, stored);
  await assertBudget(deps);

  const outcome = await runTurn(deps.workflow, input, previous).catch(async (error: unknown) => {
    if (error instanceof TurnFailedError) await recordUsage(deps.db, stored?.id ?? null, error.usage);
    throw error;
  });
  const userText = input.kind === "message" ? input.text : input.label;
  // Still pending if an earlier render was not saved yet; a blocked message never asks for one.
  const changed = !outcome.blocked && needsRender(previous, outcome.state);
  const postingPending = changed || (stored !== null && stored.renderedVersion < stored.version);
  const session = stored ? { id: stored.id, version: stored.version } : null;
  let sessionId: string;
  try {
    sessionId = await saveTurn(deps.db, { session, clientId, state: outcome.state, userText, agentMessage: outcome.message, usage: outcome.usage, postingPending });
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
  return toSessionView(sessionId, outcome.state, transcript, postingPending);
}

export async function getSessionView(db: Db, id: string): Promise<SessionView> {
  const stored = await loadSession(db, id);
  if (!stored) throw new ApiFailure("sessionNotFound");
  return toSessionView(stored.id, stored.state, stored.transcript, stored.renderedVersion < stored.version);
}
