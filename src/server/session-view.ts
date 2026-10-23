import type { SessionView, TranscriptEntry } from "@/api/contract";
import { buildChecklist } from "@/domain/checklist";
import type { SessionState } from "@/workflow/state";

export function toSessionView(sessionId: string, state: SessionState, transcript: TranscriptEntry[]): SessionView {
  return { sessionId, transcript, checklist: buildChecklist(state.draft), posting: state.posting };
}
