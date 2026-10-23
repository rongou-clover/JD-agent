import type { SessionSummary } from "@/api/contract";
import { findJobTitle } from "@/domain/catalog";
import { buildChecklist } from "@/domain/checklist";
import type { Draft } from "@/domain/draft";
import type { SessionListRow } from "@/db/sessions-repo";

function title(draft: Draft): string | null {
  const jobTitle = draft.jobTitle.value;
  if (jobTitle === null) return null;
  return jobTitle.kind === "catalog" ? (findJobTitle(jobTitle.id)?.name ?? null) : jobTitle.title;
}

export function toSessionSummary(row: SessionListRow): SessionSummary {
  const checklist = buildChecklist(row.draft);
  return {
    sessionId: row.id,
    title: title(row.draft),
    companyName: row.draft.companyName.value,
    updatedAt: row.updatedAt.toISOString(),
    doneCount: checklist.doneCount,
    totalCount: checklist.totalCount,
    complete: checklist.complete,
  };
}
