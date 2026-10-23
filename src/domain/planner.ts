import { isFieldDone } from "./checklist";
import type { Draft } from "./draft";
import { FIELDS, REQUIRED_FIELD_IDS, type FieldId } from "./fields";
import { blockingFields, validateDraft } from "./validation";

/** Order of the single "anything else?" message, as in docs/domande.md. */
export const OPTIONAL_ASK_ORDER = [
  "salary",
  "offer",
  "languages",
  "prerequisites",
  "kpis",
  "selectionProcess",
  "missionValues",
  "managerNotes",
] as const satisfies readonly FieldId[];

export type PlannerState = {
  /** The optional fields have already been offered once. */
  optionalOffered: boolean;
  /** Required fields the user skipped and the agent could not derive: never asked again in the normal flow. */
  skipped: FieldId[];
};

export type Plan =
  | { kind: "diagnosis" }
  | { kind: "required"; fields: FieldId[] }
  | { kind: "optional"; fields: FieldId[] }
  | { kind: "done" };

export function missingRequiredFields(draft: Draft): FieldId[] {
  const blocked = blockingFields(validateDraft(draft));
  return REQUIRED_FIELD_IDS.filter((field) => !isFieldDone(draft, field, blocked)).sort(
    (a, b) => (FIELDS[a].priority ?? Infinity) - (FIELDS[b].priority ?? Infinity),
  );
}

export function planNext(draft: Draft, state: PlannerState): Plan {
  const missing = missingRequiredFields(draft);
  if (missing.includes("jobTitle")) return { kind: "diagnosis" };

  // One question per message: one to pick from the quick replies, or one to write.
  const next = missing.find((field) => !state.skipped.includes(field));
  if (next) return { kind: "required", fields: [next] };

  if (!state.optionalOffered) {
    const optional = OPTIONAL_ASK_ORDER.filter((field) => draft[field].status === "missing");
    if (optional.length > 0) return { kind: "optional", fields: optional };
  }
  return { kind: "done" };
}
