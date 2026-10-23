import type { SessionView } from "@/api/contract";

/** The view returned by the request that started a session, so the chat page shows it without loading it again. */
const primed = new Map<string, SessionView>();

export function primeSession(view: SessionView): void {
  primed.set(view.sessionId, view);
}

export function takePrimedSession(sessionId: string): SessionView | null {
  const view = primed.get(sessionId) ?? null;
  primed.delete(sessionId);
  return view;
}
