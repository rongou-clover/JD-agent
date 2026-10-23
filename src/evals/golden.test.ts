import { describe, expect, it } from "vitest";
import { findJobTitle } from "@/domain/catalog";
import { loadGoldenCases } from "./golden";

const cases = loadGoldenCases();

describe("golden dataset", () => {
  it("has 11 cases with unique ids", () => {
    expect(cases).toHaveLength(11);
    expect(new Set(cases.map((c) => c.id)).size).toBe(cases.length);
  });

  it.each(cases.map((c) => [c.id, c] as const))("%s is consistent with the catalog and schema", (_, c) => {
    const { diagnosis, fields, absent } = c.expected;
    if (diagnosis.kind === "catalog") {
      for (const id of diagnosis.otherRoles) expect(findJobTitle(id), id).toBeDefined();
      const main = findJobTitle(diagnosis.jobTitleId);
      expect(main, diagnosis.jobTitleId).toBeDefined();
      for (const seniority of diagnosis.seniority) expect(main?.seniority).toContain(seniority);
    }

    const expectedFields = Object.keys(fields);
    for (const field of absent) expect(expectedFields).not.toContain(field);
    // Job title and seniority come from the diagnosis, never from the extractor.
    for (const field of ["jobTitle", "seniority"] as const) {
      expect(expectedFields).not.toContain(field);
      expect(absent).not.toContain(field);
    }
  });
});
