import { findJobTitle, type JobTitle } from "@/domain/catalog";
import type { Draft } from "@/domain/draft";
import type { FieldId } from "@/domain/fields";

/** The field value when the field is proposed or confirmed; null when it is still missing. */
export function fieldValue<F extends FieldId>(draft: Draft, field: F): Draft[F]["value"] {
  const slot = draft[field];
  return slot.status === "missing" ? null : slot.value;
}

export function isMissing(draft: Draft, field: FieldId): boolean {
  return fieldValue(draft, field) === null;
}

export type ResolvedJobTitle = { kind: "catalog"; jobTitle: JobTitle } | { kind: "outOfCatalog"; title: string };

/** Job title from the draft; null when it names none. */
export function resolveJobTitle(draft: Draft): ResolvedJobTitle | null {
  const source = fieldValue(draft, "jobTitle");
  if (!source) return null;
  if (source.kind === "outOfCatalog") return source.title.trim() === "" ? null : { kind: "outOfCatalog", title: source.title };
  const jobTitle = findJobTitle(source.id);
  return jobTitle ? { kind: "catalog", jobTitle } : null;
}

export function jobTitleName(resolved: ResolvedJobTitle | null): string | null {
  if (!resolved) return null;
  return resolved.kind === "catalog" ? resolved.jobTitle.name : resolved.title;
}
