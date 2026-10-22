import type { Draft } from "./draft";
import { FIELDS, REQUIRED_FIELD_IDS, type FieldId } from "./fields";
import { blockingFields, validateDraft } from "./validation";

export type ChecklistItem = { field: FieldId; label: string; done: boolean };

export type Checklist = {
  items: ChecklistItem[];
  doneCount: number;
  totalCount: number;
  complete: boolean;
};

/** A field is done when it is proposed or confirmed and has no blocking issue. */
export function isFieldDone(draft: Draft, field: FieldId, blocked: Set<FieldId>): boolean {
  return draft[field].status !== "missing" && draft[field].value !== null && !blocked.has(field);
}

export function buildChecklist(draft: Draft): Checklist {
  const blocked = blockingFields(validateDraft(draft));
  const items = REQUIRED_FIELD_IDS.map((field) => ({
    field,
    label: FIELDS[field].label,
    done: isFieldDone(draft, field, blocked),
  }));
  const doneCount = items.filter((item) => item.done).length;
  return { items, doneCount, totalCount: items.length, complete: doneCount === items.length };
}
