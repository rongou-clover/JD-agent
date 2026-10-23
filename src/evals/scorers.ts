import type { GuardResult } from "@/agents/prompt-injection/guard";
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
  if (expected.kind !== "catalog" || actual.kind !== "catalog") return result(1, []);
  const failures: string[] = [];
  if (actual.jobTitleId !== expected.jobTitleId) failures.push(`main role: expected ${expected.jobTitleId}, got ${actual.jobTitleId}`);
  if (!expected.seniority.includes(actual.seniority)) failures.push(`seniority: got ${actual.seniority}`);
  const named = new Set(actual.otherRoles.map((role) => role.jobTitleId));
  const missing = expected.otherRoles.filter((id) => !named.has(id));
  if (missing.length > 0) failures.push(`other roles missing: ${missing.join(", ")}`);
  if (expected.hybrid !== undefined && actual.hybrid !== expected.hybrid) failures.push(`hybrid: expected ${expected.hybrid}`);
  const checks = 2 + (expected.otherRoles.length > 0 ? 1 : 0) + (expected.hybrid !== undefined ? 1 : 0);
  return result(checks, failures);
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

/**
 * The agent must never ask from scratch for a field the input already gave.
 * A follow-up on a partly filled field (e.g. which activities are critical) is fine.
 */
export function scoreRedundantQuestions(expected: GoldenCase["expected"], draft: Draft, plan: Plan): ScoreResult {
  if (plan.kind !== "required" && plan.kind !== "optional") return result(1, []);
  const covered = new Set(Object.keys(expected.fields));
  const redundant = plan.fields.filter((field) => covered.has(field) && draft[field].value === null);
  return result(plan.fields.length, redundant.map((field) => `asked covered field ${field} from scratch`));
}

export function scoreGuard(expectedBlocked: boolean, guard: GuardResult): ScoreResult {
  if (expectedBlocked === !guard.allowed) return result(1, []);
  return result(1, [guard.allowed ? "expected blocked, got allowed" : `expected allowed, got blocked: ${guard.reason}`]);
}
