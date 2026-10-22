import { describe, expect, it } from "vitest";
import { findJobTitle } from "@/domain/catalog";
import { DIAGNOSIS_FIELD_IDS } from "@/domain/fields";
import { loadGoldenCases } from "./golden";

const cases = loadGoldenCases();

describe("golden dataset", () => {
  it("has 10 cases with unique ids", () => {
    expect(cases).toHaveLength(10);
    expect(new Set(cases.map((c) => c.id)).size).toBe(cases.length);
  });

  it.each(cases.map((c) => [c.id, c] as const))("%s is consistent with the catalog and schema", (_, c) => {
    const { diagnosis, fields, absent } = c.expected;
    const ids = diagnosis.kind === "single" ? [diagnosis.jobTitleId] : diagnosis.kind === "multiple" ? diagnosis.candidates : [];
    for (const id of ids) expect(findJobTitle(id), id).toBeDefined();

    if (diagnosis.kind !== "outOfCatalog") {
      const main = findJobTitle(ids[0] ?? "");
      for (const seniority of diagnosis.seniority) expect(main?.seniority).toContain(seniority);
    }

    const expectedFields = Object.keys(fields);
    for (const field of absent) expect(expectedFields).not.toContain(field);
    for (const field of DIAGNOSIS_FIELD_IDS) {
      expect(expectedFields).not.toContain(field);
      expect(absent).not.toContain(field);
    }
  });
});
