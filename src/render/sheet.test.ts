import { describe, expect, it } from "vitest";
import type { Diagnosis } from "@/domain/diagnosis";
import { completeDraft, withField } from "@/domain/testing";
import { buildSheet } from "./sheet";

const skills = [
  { name: "girare e montare VIDEO", required: true, expectedLevel: null, typicalMistake: "Video troppo lunghi" },
  { name: "Photoshop", required: false, expectedLevel: "P2" as const, typicalMistake: null },
];

describe("buildSheet", () => {
  it("takes P level, type and criticality from the catalog when a skill matches", () => {
    const sheet = buildSheet(withField(completeDraft(), "technicalSkills", skills), null);
    expect(sheet.inCatalog).toBe(true);
    expect(sheet.skills.filter((skill) => skill.source === "draft")).toEqual([
      { name: "girare e montare VIDEO", type: "hard", criticality: "importante", expectedLevel: "P3", required: true, source: "draft" },
      { name: "Photoshop", type: null, criticality: null, expectedLevel: "P2", required: false, source: "draft" },
    ]);
    expect(sheet.recommendedDimensions.length).toBeGreaterThan(0);
  });

  it("adds the catalog skills the draft does not cite, after the draft's own", () => {
    const sheet = buildSheet(withField(completeDraft(), "technicalSkills", skills), null);
    const catalogSkills = sheet.skills.filter((skill) => skill.source === "catalog");
    expect(sheet.skills.slice(0, 2).every((skill) => skill.source === "draft")).toBe(true);
    expect(catalogSkills.map((skill) => skill.name)).toEqual([
      "Costruire un piano editoriale",
      "Scrivere e revisionare testi",
      "Gestire i canali social",
      "Usare l'AI per produrre contenuti",
      "Leggere i dati di performance",
    ]);
    expect(catalogSkills[0]).toEqual({
      name: "Costruire un piano editoriale",
      type: "hard",
      criticality: "critica",
      expectedLevel: "P3",
      required: false,
      source: "catalog",
    });
  });

  it("leaves out catalog skills not expected at the seniority", () => {
    let draft = withField(completeDraft(), "jobTitle", { kind: "catalog", id: "account-executive" });
    draft = withField(draft, "seniority", "S1");
    const names = buildSheet(draft, null).skills.filter((skill) => skill.source === "catalog").map((skill) => skill.name);
    expect(names).toContain("Condurre una discovery");
    expect(names).not.toContain("Prevedere la pipeline");
  });

  it("has no P levels, no catalog skills and no dimensions out of catalog", () => {
    const draft = withField(withField(completeDraft(), "technicalSkills", skills), "jobTitle", { kind: "outOfCatalog", title: "Video Maker" });
    const sheet = buildSheet(draft, null);
    expect(sheet).toMatchObject({ jobTitle: "Video Maker", inCatalog: false, recommendedDimensions: [] });
    expect(sheet.skills).toHaveLength(2);
    expect(sheet.skills.every((skill) => skill.source === "draft" && skill.expectedLevel === null && skill.criticality === null)).toBe(true);
  });

  it("keeps the salary even when not published, plus prerequisites and manager notes", () => {
    let draft = withField(completeDraft(), "salary", { min: 55000, max: 65000, inPosting: false });
    draft = withField(draft, "prerequisites", [{ type: "availability", text: "Eventi nel weekend" }]);
    draft = withField(draft, "managerNotes", "Il grafico attuale non funziona.");
    const sheet = buildSheet(draft, null);
    expect(sheet.salary).toEqual({ min: 55000, max: 65000, inPosting: false });
    expect(sheet.prerequisites).toEqual(["Eventi nel weekend"]);
    expect(sheet.managerNotes).toBe("Il grafico attuale non funziona.");
    expect(sheet.softSkills).toEqual(["Gestire l'ambiguità", "Velocità di esecuzione"]);
  });

  it("lists the hybrid roles only when no role prevails", () => {
    const diagnosis: Diagnosis = {
      kind: "catalog",
      jobTitleId: "sdr",
      seniority: "S2",
      otherRoles: [{ jobTitleId: "account-executive", activities: ["Chiudere contratti"] }],
      hybrid: true,
    };
    expect(buildSheet(completeDraft(), diagnosis).hybridRoles).toEqual(["SDR", "Account Executive"]);
    expect(buildSheet(completeDraft(), { ...diagnosis, hybrid: false }).hybridRoles).toBeNull();
  });
});
