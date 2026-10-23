import type { SessionView } from "@/api/contract";
import { loadSession, saveRender } from "@/db/sessions-repo";
import type { Render } from "@/render/contract";
import { renderInput } from "@/workflow/state";
import { ApiFailure } from "./api-errors";
import { assertBudget, type BudgetDeps } from "./budget-check";
import { getSessionView } from "./chat-service";
import { toSessionView } from "./session-view";

export type RenderServiceDeps = BudgetDeps & { render: Render };

/**
 * Renders the posting for the last saved turn, outside any transaction, then saves it.
 * Nothing to do if it is current; if a turn was saved meanwhile, the newer view is returned and its own render follows.
 */
export async function renderSession(id: string, deps: RenderServiceDeps): Promise<SessionView> {
  const stored = await loadSession(deps.db, id);
  if (!stored) throw new ApiFailure("sessionNotFound");
  if (stored.renderedVersion >= stored.version) return toSessionView(id, stored.state, stored.transcript, false);
  await assertBudget(deps);

  const result = await deps.render(renderInput(stored.state), stored.state.sectionCache);
  const { posting, sheet, cache } = result.output;
  const state = { ...stored.state, posting, sheet, sectionCache: cache };
  const saved = await saveRender(deps.db, { id, version: stored.version, state, usage: result.usage });
  return saved ? toSessionView(id, state, stored.transcript, false) : getSessionView(deps.db, id);
}
