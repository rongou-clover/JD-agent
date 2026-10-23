import type { Draft } from "@/domain/draft";
import type { FieldId } from "@/domain/fields";
import { validateDraft, type Issue } from "@/domain/validation";
import { LIST_BOUNDS } from "@/domain/validation/rules";
import { bold, joinItalian } from "./format";

/** List fields the planner can find partly filled: what they hold, and how to ask for more of it. */
const LISTS = {
  activities: {
    items: (draft: Draft) => (draft.activities.value ?? []).map((activity) => activity.text),
    more: (n: number) => (n === 1 ? "me ne serve almeno un'altra" : `me ne servono almeno altre ${n}`),
  },
  sixMonthResults: {
    items: (draft: Draft) => draft.sixMonthResults.value ?? [],
    more: (n: number) =>
      `${n === 1 ? "me ne serve almeno un altro" : `me ne servono almeno altri ${n}`}, meglio se misurabile: un numero, un progetto chiuso, un risultato`,
  },
  technicalSkills: {
    items: (draft: Draft) => (draft.technicalSkills.value ?? []).map((skill) => skill.name),
    more: (n: number) => (n === 1 ? "me ne serve almeno un'altra" : `me ne servono almeno altre ${n}`),
  },
} as const;

type ListField = keyof typeof LISTS;

const isList = (field: FieldId): field is ListField => field in LISTS;

export const FOLLOW_UPS = {
  criticalActivities: "Quali 2 o 3 di queste attività sono le più critiche?",
  teamSize: "Quante persone ci sono nel team?",
  teamReportsTo: "A chi riporta?",
  teamBoth: "Quante persone ci sono nel team e a chi riporta?",
} as const;

function moreItems(field: ListField, draft: Draft): string {
  const items = LISTS[field].items(draft);
  const missing = Math.max(LIST_BOUNDS[field].min - items.length, 1);
  return `Ho ${joinItalian(items.map(bold))}: ${LISTS[field].more(missing)}.`;
}

function teamFollowUp(issues: Issue[]): string {
  const parts = new Set(issues.map((issue) => issue.detail));
  if (parts.has("size") && parts.has("reportsTo")) return FOLLOW_UPS.teamBoth;
  return parts.has("size") ? FOLLOW_UPS.teamSize : FOLLOW_UPS.teamReportsTo;
}

/**
 * A field partly filled but still blocked: the question says what is missing instead of repeating the first one.
 * Null when the field has no blocking rule issue this module knows (location and contract have their own).
 */
export function followUpQuestion(field: FieldId, draft: Draft): string | null {
  const issues = validateDraft(draft).filter((issue) => issue.field === field && issue.severity === "blocking");
  const codes = new Set(issues.map((issue) => issue.code));
  if (field === "team" && codes.has("incomplete")) return teamFollowUp(issues);
  const critical = codes.has("criticalActivitiesOutOfRange") ? FOLLOW_UPS.criticalActivities : null;
  if (isList(field) && codes.has("tooFewItems")) return [moreItems(field, draft), critical].filter(Boolean).join(" ");
  return critical;
}
