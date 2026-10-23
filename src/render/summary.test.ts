import { describe, expect, it } from "vitest";
import { emptyDraft } from "@/domain/draft";
import { completeDraft, withField } from "@/domain/testing";
import { buildSummary, postingTitle } from "./summary";

const rows = (draft = completeDraft()) => Object.fromEntries(buildSummary(draft).map((row) => [row.label, row.value]));

describe("buildSummary", () => {
  it("shows the key facts of a complete draft", () => {
    expect(rows()).toEqual({
      Azienda: "Human Maple",
      Sede: "Milano",
      Modalità: "Ibrido, 3 giorni in ufficio",
      Contratto: "Tempo indeterminato",
      Seniority: "Mid",
      "Riporta a": "CEO",
    });
  });

  it("marks missing required values as placeholders and leaves out missing optional ones", () => {
    expect(rows(emptyDraft())).toEqual({
      Azienda: null,
      Sede: null,
      Modalità: null,
      Contratto: null,
      Seniority: null,
      "Riporta a": null,
    });
  });

  it("shows the salary only when it goes in the posting", () => {
    const hidden = withField(completeDraft(), "salary", { min: 55000, max: 65000, inPosting: false });
    expect(rows(hidden).RAL).toBeUndefined();
    const shown = withField(completeDraft(), "salary", { min: 40000, max: 48000, inPosting: true });
    expect(rows(shown).RAL).toBe("40.000–48.000 € lordi annui");
  });

  it("formats contract with CCNL, languages and remote work", () => {
    let draft = withField(completeDraft(), "contract", { type: "fixedTerm", months: 12, ccnl: "Commercio", level: "Quadro" });
    draft = withField(draft, "location", { city: null, mode: "remote", officeDays: null, schedule: null, travel: null });
    draft = withField(draft, "languages", [
      { language: "Inglese", level: "C1", required: true },
      { language: "Spagnolo", level: "native", required: false },
    ]);
    const summary = rows(draft);
    expect(summary.Contratto).toBe("Tempo determinato, 12 mesi · CCNL Commercio, livello Quadro");
    expect(summary.Sede).toBeUndefined();
    expect(summary.Modalità).toBe("Da remoto");
    expect(summary.Lingue).toBe("Inglese C1, Spagnolo madrelingua (preferenziale)");
  });
});

describe("postingTitle", () => {
  it("uses the catalog name, the out-of-catalog title or a placeholder", () => {
    expect(postingTitle(completeDraft(), null)).toBe("Content / Social Media Manager");
    const outOfCatalog = withField(emptyDraft(), "jobTitle", { kind: "outOfCatalog", title: "Sales Engineer" });
    expect(postingTitle(outOfCatalog, null)).toBe("Sales Engineer");
    expect(postingTitle(emptyDraft(), { kind: "catalog", jobTitleId: "sdr", seniority: "S1", otherRoles: [], hybrid: false })).toBe("SDR");
    expect(postingTitle(emptyDraft(), null)).toBe("Ruolo da definire");
  });
});
