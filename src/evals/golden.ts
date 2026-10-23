import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { Seniority } from "@/domain/enums";
import { FIELD_IDS } from "@/domain/fields";

export const GOLDEN_DIR = path.join(process.cwd(), "docs/golden-dataset/cases");

const FieldId = z.enum(FIELD_IDS);

/**
 * What the extractor must produce for a field:
 * - present: any non-null value
 * - equals: exact value (enums, numbers)
 * - includes: partial object match
 * - minItems: list with at least n items
 */
export const FieldExpectation = z.union([
  z.object({ present: z.literal(true) }),
  z.object({ equals: z.union([z.string(), z.number(), z.boolean()]) }),
  z.object({ includes: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])) }),
  z.object({ minItems: z.number().int().positive() }),
]);
export type FieldExpectation = z.infer<typeof FieldExpectation>;

export const ExpectedDiagnosis = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("catalog"),
    jobTitleId: z.string(),
    seniority: z.array(Seniority).min(1),
    /** Other roles the agent must name; extra ones are not penalised. */
    otherRoles: z.array(z.string()).default([]),
    /** Checked only when set. */
    hybrid: z.boolean().optional(),
  }),
  z.object({ kind: z.literal("outOfCatalog") }),
]);
export type ExpectedDiagnosis = z.infer<typeof ExpectedDiagnosis>;

export const GoldenCase = z.object({
  id: z.string(),
  title: z.string(),
  notes: z.string(),
  /** First message of the user, as typed or pasted. */
  input: z.string().min(1),
  expected: z.object({
    /** The prompt injection guard must stop the message before the agents. */
    blocked: z.boolean().default(false),
    diagnosis: ExpectedDiagnosis,
    /** Fields the extractor must fill from the input. Diagnosis fields excluded. */
    fields: z.partialRecord(FieldId, FieldExpectation),
    /** Fields not in the input: extracting them is a hallucination. */
    absent: z.array(FieldId),
    /** Strings that must not appear anywhere in the extracted draft. */
    mustNotContain: z.array(z.string()),
  }),
});
export type GoldenCase = z.infer<typeof GoldenCase>;

export function loadGoldenCases(dir = GOLDEN_DIR): GoldenCase[] {
  return readdirSync(dir)
    .filter((file) => file.endsWith(".json"))
    .sort()
    .map((file) => GoldenCase.parse(JSON.parse(readFileSync(path.join(dir, file), "utf8"))));
}
