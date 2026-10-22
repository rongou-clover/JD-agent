import type { Diagnosis } from "@/domain/diagnosis";
import type { Draft } from "@/domain/draft";
import { FIELD_IDS, type FieldId } from "@/domain/fields";
import type { Plan } from "@/domain/planner";
import { collectStrings } from "@/domain/validation/issues";
import type { ExpectedDiagnosis, FieldExpectation, GoldenCase } from "./golden";

export type ScoreResult = { score: number; failures: string[] };

function result(checks: number, failures: string[]): ScoreResult {
  return { score: checks === 0 ? 1 : (checks - failures.length) / checks, failures };
}

export function scoreDiagnosis(expected: ExpectedDiagnosis, actual: Diagnosis): ScoreResult {
  if (expected.kind !== actual.kind) return result(1, [`kind: expected ${expected.kind}, got ${actual.kind}`]);
  const failures: string[] = [];
  if (expected.kind === "single" && actual.kind === "single") {
    if (actual.jobTitleId !== expected.jobTitleId) failures.push(`jobTitle: expected ${expected.jobTitleId}, got ${actual.jobTitleId}`);
    if (!expected.seniority.includes(actual.seniority)) failures.push(`seniority: got ${actual.seniority}`);
    return result(2, failures);
  }
  if (expected.kind === "multiple" && actual.kind === "multiple") {
    if (actual.candidates[0] !== expected.candidates[0]) failures.push(`main role: got ${actual.candidates[0]}`);
    const missing = expected.candidates.filter((id) => !actual.candidates.includes(id));
    if (missing.length > 0) failures.push(`candidates missing: ${missing.join(", ")}`);
    if (!expected.seniority.includes(actual.seniority)) failures.push(`seniority: got ${actual.seniority}`);
    return result(3, failures);
  }
  return result(1, []);
}

function matches(expectation: FieldExpectation, value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if ("present" in expectation) return true;
  if ("equals" in expectation) return value === expectation.equals;
  if ("minItems" in expectation) return Array.isArray(value) && value.length >= expectation.minItems;
  if (typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return Object.entries(expectation.includes).every(([key, wanted]) => {
    const got = record[key];
    return typeof wanted === "string" && typeof got === "string"
      ? got.toLowerCase().includes(wanted.toLowerCase())
      : got === wanted;
  });
}

export function scoreExtraction(expected: GoldenCase["expected"], draft: Draft): ScoreResult {
  const failures: string[] = [];
  const fieldEntries = Object.entries(expected.fields) as [FieldId, FieldExpectation][];
  for (const [field, expectation] of fieldEntries) {
    if (!matches(expectation, draft[field].value)) failures.push(`${field}: expected ${JSON.stringify(expectation)}`);
  }
  for (const field of expected.absent) {
    if (draft[field].value !== null) failures.push(`${field}: should be absent`);
  }
  const allText = FIELD_IDS.flatMap((field) => collectStrings(draft[field].value)).join("\n").toLowerCase();
  for (const forbidden of expected.mustNotContain) {
    if (allText.includes(forbidden.toLowerCase())) failures.push(`contains "${forbidden}"`);
  }
  return result(fieldEntries.length + expected.absent.length + expected.mustNotContain.length, failures);
}

/** The agent must never ask for a field the input already covered. */
export function scoreRedundantQuestions(expected: GoldenCase["expected"], plan: Plan): ScoreResult {
  if (plan.kind !== "required" && plan.kind !== "optional") return result(1, []);
  const covered = new Set(Object.keys(expected.fields));
  const redundant = plan.fields.filter((field) => covered.has(field));
  return result(plan.fields.length, redundant.map((field) => `asked covered field ${field}`));
}
