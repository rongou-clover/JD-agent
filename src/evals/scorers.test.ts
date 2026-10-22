import { describe, expect, it } from "vitest";
import { emptyDraft } from "@/domain/draft";
import { withField } from "@/domain/testing";
import type { GoldenCase } from "./golden";
import { scoreDiagnosis, scoreExtraction, scoreRedundantQuestions } from "./scorers";

const expected: GoldenCase["expected"] = {
  diagnosis: { kind: "single", jobTitleId: "sdr", seniority: ["S1"] },
  fields: {
    companyDescription: { present: true },
    team: { includes: { reportsTo: "head of sales", size: 5 } },
    activities: { minItems: 2 },
  },
  absent: ["salary"],
  mustNotContain: ["ragazza"],
};

describe("scoreDiagnosis", () => {
  it("passes on the right role and seniority", () => {
    expect(scoreDiagnosis(expected.diagnosis, { kind: "single", jobTitleId: "sdr", seniority: "S1" })).toEqual({
      score: 1,
      failures: [],
    });
  });

  it("fails on a wrong kind or seniority", () => {
    expect(scoreDiagnosis(expected.diagnosis, { kind: "outOfCatalog", title: "SDR" }).score).toBe(0);
    expect(scoreDiagnosis(expected.diagnosis, { kind: "single", jobTitleId: "sdr", seniority: "S2" }).score).toBe(0.5);
  });

  it("checks the main role first for multiple roles", () => {
    const result = scoreDiagnosis(
      { kind: "multiple", candidates: ["account-executive", "sdr"], seniority: ["S2"] },
      { kind: "multiple", candidates: ["sdr", "account-executive"], seniority: "S2" },
    );
    expect(result.failures).toEqual(["main role: got sdr"]);
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
  it("flags questions on fields the input covered", () => {
    expect(scoreRedundantQuestions(expected, { kind: "required", fields: ["team", "location"] })).toEqual({
      score: 0.5,
      failures: ["asked covered field team"],
    });
    expect(scoreRedundantQuestions(expected, { kind: "diagnosis" }).score).toBe(1);
  });
});
