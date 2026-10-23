import { describe, expect, it } from "vitest";
import { ExtractorLlmOutput, toExtractorOutput } from "./llm-output";

const base = { intent: "answer", updates: {}, skipped: [], discriminationFlags: [] };

describe("ExtractorLlmOutput", () => {
  it("drops a malformed field without failing the whole answer", () => {
    const parsed = ExtractorLlmOutput.parse({
      ...base,
      updates: {
        salary: { value: { min: null, max: 40000, inPosting: false }, source: "user" },
        companyDescription: { value: "SaaS B2B.", source: "user" },
      },
    });
    const output = toExtractorOutput(parsed);
    expect(output.updates.salary).toBeNull();
    expect(output.updates.companyDescription).toEqual({ value: "SaaS B2B.", source: "user" });
  });

  it("accepts a bare value as inferred and fills missing optionals with null", () => {
    const parsed = ExtractorLlmOutput.parse({
      ...base,
      updates: { kpis: ["Demo fissate"], team: { value: { reportsTo: "CEO", departments: [] }, source: "user" } },
    });
    const output = toExtractorOutput(parsed);
    expect(output.updates.kpis).toEqual({ value: ["Demo fissate"], source: "inferred" });
    expect(output.updates.team?.value).toEqual({ size: null, reportsTo: "CEO", departments: [] });
    expect(output.forcedWording).toBeNull();
  });
});
