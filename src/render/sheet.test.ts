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
    expect(sheet.skills).toEqual([
      { name: "girare e montare VIDEO", type: "hard", criticality: "importante", expectedLevel: "P3", required: true },
      { name: "Photoshop", type: null, criticality: null, expectedLevel: "P2", required: false },
    ]);
    expect(sheet.recommendedDimensions.length).toBeGreaterThan(0);
  });

  it("has no P levels and no dimensions out of catalog", () => {
    const draft = withField(withField(completeDraft(), "technicalSkills", skills), "jobTitle", { kind: "outOfCatalog", title: "Video Maker" });
    const sheet = buildSheet(draft, null);
    expect(sheet).toMatchObject({ jobTitle: "Video Maker", inCatalog: false, recommendedDimensions: [] });
    expect(sheet.skills.every((skill) => skill.expectedLevel === null && skill.criticality === null)).toBe(true);
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
