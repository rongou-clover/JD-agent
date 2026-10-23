import { EXTRACTED_FIELD_IDS, type ExtractorOutput } from "@/agents/extractor/schema";
import type { Diagnosis } from "@/domain/diagnosis";
import { Draft } from "@/domain/draft";

type Updates = ExtractorOutput["updates"];
type ExtractedField = keyof Updates;

function mergeField<F extends ExtractedField>(draft: Draft, field: F, update: NonNullable<Updates[F]>, skipped: boolean): Draft {
  if (update.source === "inferred" && draft[field].status === "confirmed" && !skipped) return draft;
  const status = update.source === "user" ? "confirmed" : "proposed";
  // The model output is untrusted: a value that fails the domain schema is dropped.
  const parsed = Draft.safeParse({ ...draft, [field]: { value: update.value, source: update.source, status } });
  return parsed.success ? parsed.data : draft;
}

/**
 * User-stated values are confirmed; inferred ones are proposed and never overwrite a confirmed value,
 * except on a field the user skipped: there the proposal completes what the user gave.
 */
export function applyExtraction(draft: Draft, extraction: ExtractorOutput): Draft {
  return EXTRACTED_FIELD_IDS.reduce((next, field) => {
    const update = extraction.updates[field];
    return update === null ? next : mergeField(next, field, update, extraction.skipped.includes(field));
  }, draft);
}

/** The diagnosis proposes job title and seniority; the user confirms them with a quick reply. */
export function applyDiagnosis(draft: Draft, diagnosis: Diagnosis): Draft {
  if (diagnosis.kind === "outOfCatalog") {
    return {
      ...draft,
      jobTitle: { value: { kind: "outOfCatalog", title: diagnosis.title }, source: "inferred", status: "proposed" },
    };
  }
  return {
    ...draft,
    jobTitle: { value: { kind: "catalog", id: diagnosis.jobTitleId }, source: "catalog", status: "proposed" },
    seniority: { value: diagnosis.seniority, source: "inferred", status: "proposed" },
  };
}
