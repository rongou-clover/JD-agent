import { describe, expect, it } from "vitest";
import type { ExtractorOutput } from "@/agents/extractor/schema";
import { emptyDraft } from "@/domain/draft";
import { withField } from "@/domain/testing";
import { applyDiagnosis, applyExtraction } from "./merge";

function extraction(updates: Partial<ExtractorOutput["updates"]>): ExtractorOutput {
  const none = Object.fromEntries(Object.keys(emptyDraft()).map((id) => [id, null]));
  return {
    intent: "answer",
    updates: { ...none, ...updates } as ExtractorOutput["updates"],
    skipped: [],
    forcedWording: null,
    discriminationFlags: [],
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

describe("applyDiagnosis", () => {
  it("proposes the main role and seniority", () => {
    const draft = applyDiagnosis(emptyDraft(), {
      kind: "catalog",
      jobTitleId: "account-executive",
      seniority: "S2",
      otherRoles: [{ jobTitleId: "customer-success-manager", activities: ["Seguire i rinnovi"] }],
      hybrid: false,
    });
    expect(draft.jobTitle).toEqual({ value: { kind: "catalog", id: "account-executive" }, source: "catalog", status: "proposed" });
    expect(draft.seniority.value).toBe("S2");
  });

  it("marks an out-of-catalog role without seniority", () => {
    const draft = applyDiagnosis(emptyDraft(), { kind: "outOfCatalog", title: "Office Manager" });
    expect(draft.jobTitle.value).toEqual({ kind: "outOfCatalog", title: "Office Manager" });
    expect(draft.seniority.status).toBe("missing");
  });
});
