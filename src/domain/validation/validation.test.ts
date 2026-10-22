import { describe, expect, it } from "vitest";
import { emptyDraft } from "../draft";
import { completeDraft, withField } from "../testing";
import { blockingFields, validateDraft } from ".";
import { countSentences } from "./rules";

const codes = (draft = completeDraft()) => validateDraft(draft).map((issue) => `${issue.field}:${issue.code}`);

describe("validateDraft", () => {
  it("accepts an empty draft and a complete one", () => {
    expect(validateDraft(emptyDraft())).toEqual([]);
    expect(validateDraft(completeDraft())).toEqual([]);
  });

  it("skips the discrimination check by default", () => {
    const draft = withField(completeDraft(), "softSkills", ["Ragazza solare"]);
    expect(codes(draft)).toEqual([]);
  });

  it("blocks discriminatory content in any field when the check is on", () => {
    const draft = withField(completeDraft(), "softSkills", ["Ragazza solare"]);
    const issues = validateDraft(draft, { discriminationCheck: true });
    expect(issues).toContainEqual(expect.objectContaining({ field: "softSkills", code: "discriminatoryContent" }));
    expect(blockingFields(issues).has("softSkills")).toBe(true);
  });

  it("blocks salary in free text but not in the salary field", () => {
    const inText = withField(completeDraft(), "offer", ["RAL 40.000 più bonus"]);
    expect(codes(inText)).toContain("offer:salaryInText");
    const inField = withField(completeDraft(), "salary", { min: 30000, max: 40000, inPosting: true });
    expect(codes(inField)).toEqual([]);
  });

  it("blocks too few items and warns on too many", () => {
    const few = withField(completeDraft(), "sixMonthResults", ["Un solo risultato"]);
    expect(validateDraft(few)).toContainEqual(expect.objectContaining({ code: "tooFewItems", severity: "blocking" }));
    const many = withField(completeDraft(), "softSkills", ["a", "b", "c", "d", "e"]);
    expect(validateDraft(many)).toContainEqual(expect.objectContaining({ code: "tooManyItems", severity: "warning" }));
  });

  it("accepts up to 4 soft skills", () => {
    expect(codes(withField(completeDraft(), "softSkills", ["a", "b", "c", "d"]))).toEqual([]);
  });

  it("requires 2 or 3 critical activities", () => {
    const none = withField(completeDraft(), "activities", [
      { text: "a", critical: false },
      { text: "b", critical: false },
      { text: "c", critical: true },
    ]);
    expect(codes(none)).toContain("activities:criticalActivitiesOutOfRange");
  });

  it("checks sentence counts", () => {
    expect(countSentences("Una frase. Due frasi! Tre?")).toBe(3);
    const long = withField(completeDraft(), "companyDescription", "Uno. Due. Tre. Quattro. Cinque.");
    expect(codes(long)).toContain("companyDescription:tooManySentences");
  });

  it("requires report line and team size", () => {
    const draft = withField(completeDraft(), "team", { size: null, reportsTo: "CEO", departments: [] });
    expect(validateDraft(draft)).toContainEqual(expect.objectContaining({ code: "incomplete", detail: "size" }));
  });

  it("requires city unless remote, and office days when hybrid", () => {
    const base = { city: null, schedule: null, travel: null };
    const remote = withField(completeDraft(), "location", { ...base, mode: "remote", officeDays: null });
    expect(codes(remote)).toEqual([]);
    const hybrid = withField(completeDraft(), "location", { ...base, city: "Roma", mode: "hybrid", officeDays: null });
    expect(validateDraft(hybrid)).toContainEqual(expect.objectContaining({ code: "incomplete", detail: "officeDays" }));
    const onsite = withField(completeDraft(), "location", { ...base, mode: "onsite", officeDays: null });
    expect(validateDraft(onsite)).toContainEqual(expect.objectContaining({ code: "incomplete", detail: "city" }));
  });

  it("requires months for a fixed-term contract", () => {
    const draft = withField(completeDraft(), "contract", { type: "fixedTerm", months: null, ccnl: null, level: null });
    expect(codes(draft)).toContain("contract:incomplete");
  });

  it("blocks an inverted salary range", () => {
    const draft = withField(completeDraft(), "salary", { min: 50000, max: 40000, inPosting: false });
    expect(codes(draft)).toContain("salary:salaryRangeInverted");
  });

  it("checks job title and seniority against the catalog", () => {
    expect(codes(withField(completeDraft(), "jobTitle", { kind: "catalog", id: "cto" }))).toContain(
      "jobTitle:unknownJobTitle",
    );
    const manager = withField(completeDraft(), "jobTitle", { kind: "catalog", id: "sales-manager" });
    expect(codes(withField(manager, "seniority", "S1"))).toContain("seniority:seniorityNotAllowed");
    expect(codes(withField(manager, "seniority", "S4"))).toEqual([]);
    expect(codes(withField(completeDraft(), "seniority", "S4"))).toContain("seniority:seniorityNotAllowed");
  });

  it("warns on expected levels for an out-of-catalog role", () => {
    const draft = withField(completeDraft(), "jobTitle", { kind: "outOfCatalog", title: "Office Manager" });
    expect(validateDraft(draft)).toContainEqual(
      expect.objectContaining({ code: "expectedLevelOutOfCatalog", severity: "warning" }),
    );
  });
});
