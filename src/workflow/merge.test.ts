import { describe, expect, it } from "vitest";
import type { ExtractorOutput } from "@/agents/extractor/schema";
import { emptyDraft } from "@/domain/draft";
import { withField } from "@/domain/testing";
import { applyExtraction } from "./merge";

function extraction(updates: Partial<ExtractorOutput["updates"]>): ExtractorOutput {
  const none = Object.fromEntries(Object.keys(emptyDraft()).map((id) => [id, null]));
  return {
    intent: "answer",
    updates: { ...none, ...updates } as ExtractorOutput["updates"],
    skipped: [],
    forcedWording: null,
    discriminationFlags: [],
    closerJobTitleId: null,
  };
}

describe("applyExtraction", () => {
  it("confirms user values and proposes inferred ones", () => {
    const draft = applyExtraction(
      emptyDraft(),
      extraction({
        companyDescription: { value: "SaaS B2B.", source: "user" },
        kpis: { value: ["Demo fissate"], source: "inferred" },
      }),
    );
    expect(draft.companyDescription.status).toBe("confirmed");
    expect(draft.kpis.status).toBe("proposed");
  });

  it("never overwrites a confirmed value with an inferred one", () => {
    const start = withField(emptyDraft(), "companyDescription", "Agenzia di Padova.");
    const draft = applyExtraction(start, extraction({ companyDescription: { value: "Altro.", source: "inferred" } }));
    expect(draft.companyDescription.value).toBe("Agenzia di Padova.");
  });

  it("drops a value that fails the domain schema", () => {
    const draft = applyExtraction(emptyDraft(), extraction({ companyDescription: { value: "  ", source: "user" } }));
    expect(draft.companyDescription.status).toBe("missing");
  });
});
