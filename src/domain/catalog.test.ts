import { describe, expect, it } from "vitest";
import { catalog, expectedLevel, findJobTitle, isSeniorityAllowed } from "./catalog";

describe("catalog", () => {
  it("has 15 GTM job titles with unique ids", () => {
    const ids = catalog.jobTitles.map((jobTitle) => jobTitle.id);
    expect(ids).toHaveLength(15);
    expect(new Set(ids).size).toBe(15);
  });

  it("allows S4 only for Manager titles", () => {
    for (const jobTitle of catalog.jobTitles) {
      if (jobTitle.seniority.includes("S4")) expect(jobTitle.name).toMatch(/Manager/);
    }
  });

  it("returns null when a skill has no expected level at a seniority", () => {
    const manager = findJobTitle("sales-manager");
    const skill = manager?.skills[0];
    expect(manager && isSeniorityAllowed(manager, "S4")).toBe(true);
    expect(skill && expectedLevel(skill, "S4")).toBeNull();
    expect(skill && expectedLevel(skill, "S3")).not.toBeNull();
  });
});
