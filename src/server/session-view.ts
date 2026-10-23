import type { SessionView, TranscriptEntry } from "@/api/contract";
import { buildChecklist } from "@/domain/checklist";
import { buildSheet } from "@/render/sheet";
import type { SessionState } from "@/workflow/state";

/** Sessions rendered before the sheet was stored get it rebuilt from the draft: plain code, no model call. */
function sheetOf(state: SessionState): SessionView["sheet"] {
  if (state.sheet) return state.sheet;
  return state.posting.sections.length > 0 ? buildSheet(state.draft, state.diagnosis) : null;
}

export function toSessionView(
  sessionId: string,
  state: SessionState,
  transcript: TranscriptEntry[],
  postingPending: boolean,
): SessionView {
  return { sessionId, transcript, checklist: buildChecklist(state.draft), posting: state.posting, sheet: sheetOf(state), postingPending };
}
