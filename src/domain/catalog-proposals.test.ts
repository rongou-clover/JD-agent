import { describe, expect, it } from "vitest";
import { findJobTitle, type JobTitle } from "./catalog";
import { completeTechnicalSkills, MAX_SOFT_SKILLS, proposeSoftSkills, proposeTechnicalSkills } from "./catalog-proposals";

function jobTitle(id: string): JobTitle {
  const found = findJobTitle(id);
  if (!found) throw new Error(`Missing job title ${id}`);
  return found;
}

describe("catalog proposals", () => {
  it("technical skills: critical and important hard skills with their P level, required only if critical", () => {
    expect(proposeTechnicalSkills(jobTitle("sdr"), "S1")).toEqual([
      { name: "Aprire una cold call", required: true, expectedLevel: "P2", typicalMistake: null },
      { name: "Qualificare un lead", required: true, expectedLevel: "P2", typicalMistake: null },
      { name: "Gestire le obiezioni", required: false, expectedLevel: "P1", typicalMistake: null },
      { name: "Scrivere email di prospecting", required: false, expectedLevel: "P2", typicalMistake: null },
    ]);
  });

  it("technical skills: only skills expected at the seniority; without a seniority, no P level", () => {
    expect(proposeTechnicalSkills(jobTitle("sales-manager"), "S4")).toEqual([]);
    expect(proposeTechnicalSkills(jobTitle("sales-manager"), "S3").map((skill) => skill.name)).toEqual([
      "Definire il processo di vendita",
      "Prevedere la pipeline",
      "Negoziare le condizioni",
      "Analizzare le metriche commerciali",
    ]);
    expect(proposeTechnicalSkills(jobTitle("sdr"), null).every((skill) => skill.expectedLevel === null)).toBe(true);
  });

  it("soft skills: the role's soft skills first, then recommended dimensions, at most four", () => {
    expect(proposeSoftSkills(jobTitle("sdr"), "S1")).toEqual([
      "Reggere il rifiuto",
      "Comprensione e comunicazione scritta",
      "Resilienza",
      "Organizzazione del tempo",
    ]);
    expect(proposeSoftSkills(jobTitle("customer-success-manager"), "S1").slice(0, 2)).toEqual([
      "Gestire la relazione con il cliente",
      "Gestire un'escalation",
    ]);
    for (const id of ["customer-success-manager", "account-executive", "partnership-manager"]) {
      expect(proposeSoftSkills(jobTitle(id), null).length).toBeLessThanOrEqual(MAX_SOFT_SKILLS);
    }
  });

  it("completing technical skills keeps the user's and adds catalog ones up to three", () => {
    const given = ["HubSpot", "qualificare un lead"].map((name) => ({ name, required: true, expectedLevel: null, typicalMistake: null }));
    expect(completeTechnicalSkills(given, jobTitle("sdr"), "S1").map((skill) => skill.name)).toEqual([
      "HubSpot",
      "qualificare un lead",
      "Aprire una cold call",
    ]);
    expect(completeTechnicalSkills([], jobTitle("sdr"), "S1")).toHaveLength(4);
  });
});
