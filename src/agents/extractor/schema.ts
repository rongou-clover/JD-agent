import { z } from "zod";
import { FIELD_VALUE_SCHEMAS } from "@/domain/draft";
import type { Draft } from "@/domain/draft";
import { ForcedWording } from "@/render/contract";
import { DISCRIMINATION_CATEGORIES } from "@/domain/validation/discrimination";
import { FIELD_IDS, type FieldId } from "@/domain/fields";

export const PROMPT_VERSION = "extractor@5";

/** Job title and seniority belong to role-diagnosis, not to the extractor. */
export const EXTRACTED_FIELD_IDS = FIELD_IDS.filter(
  (id): id is Exclude<FieldId, "jobTitle" | "seniority"> => id !== "jobTitle" && id !== "seniority",
);
export type ExtractedFieldId = (typeof EXTRACTED_FIELD_IDS)[number];

export const MAX_INPUT_CHARS = 20_000;

export const Intent = z.enum(["answer", "forceWording", "completeAnyway", "other"]);
export type Intent = z.infer<typeof Intent>;

export const ExtractedSource = z.enum(["user", "inferred"]);

function update<T extends z.ZodType>(value: T) {
  return z.object({ value, source: ExtractedSource }).nullable();
}

const V = FIELD_VALUE_SCHEMAS;

const Updates = z.object({
  companyName: update(V.companyName),
  companyDescription: update(V.companyDescription),
  missionValues: update(V.missionValues),
  roleMission: update(V.roleMission),
  team: update(V.team),
  activities: update(V.activities),
  kpis: update(V.kpis),
  sixMonthResults: update(V.sixMonthResults),
  technicalSkills: update(V.technicalSkills),
  softSkills: update(V.softSkills),
  prerequisites: update(V.prerequisites),
  languages: update(V.languages),
  location: update(V.location),
  contract: update(V.contract),
  salary: update(V.salary),
  offer: update(V.offer),
  selectionProcess: update(V.selectionProcess),
  managerNotes: update(V.managerNotes),
}) satisfies z.ZodType<Record<ExtractedFieldId, unknown>>;

export const ExtractorOutput = z.object({
  intent: Intent,
  /** Fields found in the message; null when the message says nothing about them. */
  updates: Updates,
  /** Asked fields the user explicitly skipped or delegated ("non lo so", "salta", "decidi tu"); seniority included. */
  skipped: z.array(z.enum(FIELD_IDS)),
  /** Exact wording the user wants in one posting section. */
  forcedWording: ForcedWording.nullable(),
  /** Discriminatory requests found in the message; never stored in updates. */
  discriminationFlags: z.array(z.object({ category: z.enum(DISCRIMINATION_CATEGORIES), quote: z.string() })),
});
export type ExtractorOutput = z.infer<typeof ExtractorOutput>;

export const ExtractorInput = z.object({
  message: z.string().min(1).max(MAX_INPUT_CHARS),
  draft: z.custom<Draft>(),
  /** Fields asked in the previous agent message. */
  askedFields: z.array(z.enum(FIELD_IDS)),
  /** Asked fields the agent already asked twice in a row: not answered now, they count as skipped. */
  lastAskFields: z.array(z.enum(FIELD_IDS)),
});
export type ExtractorInput = z.infer<typeof ExtractorInput>;
