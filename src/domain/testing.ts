import { emptyDraft, type Draft, type FieldValue } from "./draft";
import type { FieldSource, FieldStatus } from "./enums";
import type { FieldId } from "./fields";

/** Test helper: returns a copy of the draft with one field filled. */
export function withField<F extends FieldId>(
  draft: Draft,
  field: F,
  value: FieldValue<F>,
  status: FieldStatus = "confirmed",
  source: FieldSource = "user",
): Draft {
  return { ...draft, [field]: { value, status, source } };
}

/** Test helper: returns a copy of the draft with the given fields emptied. */
export function without(draft: Draft, ...fields: FieldId[]): Draft {
  const empty = emptyDraft();
  return fields.reduce((acc, field) => ({ ...acc, [field]: empty[field] }), draft);
}

/** A draft with all 11 required fields valid and confirmed. */
export function completeDraft(): Draft {
  let draft = emptyDraft();
  draft = withField(draft, "companyName", "Human Maple");
  draft = withField(draft, "companyDescription", "Startup di economia circolare: recuperiamo scarti per aziende e comuni.");
  draft = withField(draft, "roleMission", { reason: "new", text: "Deve far crescere i nostri canali social." });
  draft = withField(draft, "jobTitle", { kind: "catalog", id: "content-social-media-manager" });
  draft = withField(draft, "seniority", "S2");
  draft = withField(draft, "team", { size: 12, reportsTo: "CEO", departments: ["Marketing"] });
  draft = withField(draft, "activities", [
    { text: "Gestire il piano editoriale", critical: true },
    { text: "Girare e montare video", critical: true },
    { text: "Curare la grafica dei report", critical: false },
  ]);
  draft = withField(draft, "sixMonthResults", ["Piano editoriale attivo su 3 canali", "20 video pubblicati"]);
  draft = withField(draft, "technicalSkills", [
    { name: "Montaggio video", required: true, expectedLevel: "P3", typicalMistake: null },
    { name: "Campagne adv", required: true, expectedLevel: "P2", typicalMistake: null },
    { name: "Photoshop", required: false, expectedLevel: null, typicalMistake: null },
  ]);
  draft = withField(draft, "softSkills", ["Gestire l'ambiguità", "Velocità di esecuzione"]);
  draft = withField(draft, "location", { city: "Milano", mode: "hybrid", officeDays: 3, schedule: null, travel: null });
  draft = withField(draft, "contract", { type: "permanent", months: null, ccnl: null, level: null });
  return draft;
}
