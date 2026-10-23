import { describe, expect, it } from "vitest";
import type { Diagnosis } from "@/domain/diagnosis";
import { emptyDraft } from "@/domain/draft";
import { withField } from "@/domain/testing";
import type { ExpectedDiagnosis, GoldenCase } from "./golden";
import { scoreDiagnosis, scoreExtraction, scoreGuard, scoreRedundantQuestions } from "./scorers";

const expected: GoldenCase["expected"] = {
  blocked: false,
  diagnosis: { kind: "catalog", jobTitleId: "sdr", seniority: ["S1"], otherRoles: [] },
  fields: {
    companyDescription: { present: true },
    team: { includes: { reportsTo: "head of sales", size: 5 } },
    activities: { minItems: 2 },
  },
  absent: ["salary"],
  mustNotContain: ["ragazza"],
};

type CatalogDiagnosis = Extract<Diagnosis, { kind: "catalog" }>;
const sdr: CatalogDiagnosis = { kind: "catalog", jobTitleId: "sdr", seniority: "S1", otherRoles: [], hybrid: false };

describe("scoreDiagnosis", () => {
  it("passes on the right role and seniority", () => {
    expect(scoreDiagnosis(expected.diagnosis, sdr)).toEqual({ score: 1, failures: [] });
  });

  it("fails on a wrong kind or seniority", () => {
    expect(scoreDiagnosis(expected.diagnosis, { kind: "outOfCatalog", title: "SDR" }).score).toBe(0);
    expect(scoreDiagnosis(expected.diagnosis, { ...sdr, seniority: "S2" }).score).toBe(0.5);
  });

  it("requires the expected other roles but not extra ones", () => {
    const wanted: ExpectedDiagnosis = { kind: "catalog", jobTitleId: "account-executive", seniority: ["S2"], otherRoles: ["sdr"], hybrid: false };
    const actual: CatalogDiagnosis = { ...sdr, jobTitleId: "account-executive", seniority: "S2" };
    expect(scoreDiagnosis(wanted, actual).failures).toEqual(["other roles missing: sdr"]);
    const named = { ...actual, otherRoles: [{ jobTitleId: "sdr", activities: ["Prospecting"] }, { jobTitleId: "bdr", activities: ["Cold call"] }] };
    expect(scoreDiagnosis(wanted, named).score).toBe(1);
    expect(scoreDiagnosis(wanted, { ...named, hybrid: true }).failures).toEqual(["hybrid: expected false"]);
  });
});

describe("scoreExtraction", () => {
  it("scores each expectation, absence and forbidden string", () => {
    let draft = withField(emptyDraft(), "companyDescription", "SaaS di fatturazione.");
    draft = withField(draft, "team", { size: 5, reportsTo: "Head of Sales", departments: [] });
    draft = withField(draft, "activities", [{ text: "Cold call", critical: true }]);
    draft = withField(draft, "salary", { min: 1, max: 2, inPosting: false });
    draft = withField(draft, "softSkills", ["Ragazza solare"]);
    const result = scoreExtraction(expected, draft);
    expect(result.failures).toHaveLength(3);
    expect(result.score).toBeCloseTo(2 / 5);
  });
});

describe("scoreRedundantQuestions", () => {
  it("flags asking from scratch for a field the input covered", () => {
    const draft = emptyDraft();
    expect(scoreRedundantQuestions(expected, draft, { kind: "required", fields: ["team", "location"] })).toEqual({
      score: 0.5,
      failures: ["asked covered field team from scratch"],
    });
    expect(scoreRedundantQuestions(expected, draft, { kind: "diagnosis" }).score).toBe(1);
  });

  it("allows a follow-up on a partly filled field", () => {
    const draft = withField(emptyDraft(), "team", { size: null, reportsTo: "CEO", departments: [] });
    expect(scoreRedundantQuestions(expected, draft, { kind: "required", fields: ["team"] }).score).toBe(1);
  });
});

describe("scoreGuard", () => {
  it("passes when the guard blocks exactly the expected messages", () => {
    expect(scoreGuard(true, { allowed: false, reason: "injection" }).score).toBe(1);
    expect(scoreGuard(false, { allowed: true }).score).toBe(1);
    expect(scoreGuard(false, { allowed: false, reason: "injection" }).failures).toEqual(["expected allowed, got blocked: injection"]);
  });
});
