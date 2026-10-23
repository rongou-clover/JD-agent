import { describe, expect, it } from "vitest";
import { FIELDS } from "@/domain/fields";
import { completeDraft, withField } from "@/domain/testing";
import { sectionHash } from "./cache";
import { PROSE_SECTION_IDS } from "./contract";
import { SECTION_SPECS, planSection } from "./sections";

describe("SECTION_SPECS", () => {
  it("only marks required draft fields as placeholder triggers, among the section's own fields", () => {
    for (const id of PROSE_SECTION_IDS) {
      const spec = SECTION_SPECS[id];
      for (const field of spec.required) {
        expect(FIELDS[field].required).toBe(true);
        expect(spec.fields).toContain(field);
      }
      expect(spec.bounds.minWords).toBeLessThan(spec.bounds.maxWords);
    }
  });
});

describe("planSection", () => {
  it("splits skills and languages between requirements and nice to have", () => {
    const draft = withField(completeDraft(), "languages", [
      { language: "Inglese", level: "C1", required: true },
      { language: "Spagnolo", level: "B2", required: false },
    ]);
    expect(planSection("requirements", draft, null)).toEqual({
      kind: "write",
      data: { technicalSkills: ["Montaggio video", "Campagne adv"], languages: ["Inglese C1"], seniority: "S2 Mid" },
    });
    expect(planSection("niceToHave", draft, null)).toEqual({
      kind: "write",
      data: { technicalSkills: ["Photoshop"], languages: ["Spagnolo B2"] },
    });
  });

  it("omits optional sections without data and puts a placeholder for missing required fields", () => {
    expect(planSection("offer", completeDraft(), null)).toEqual({ kind: "omit" });
    const draft = { ...completeDraft(), companyName: { value: null, source: null, status: "missing" as const } };
    expect(planSection("about", draft, null)).toEqual({ kind: "placeholder" });
  });

  it("gives the role section the job title as context", () => {
    const plan = planSection("role", completeDraft(), null);
    expect(plan.kind === "write" && plan.data.jobTitle).toBe("Content / Social Media Manager");
  });
});

describe("sectionHash", () => {
  const base = { section: "team" as const, heading: "Il team", data: { team: { size: 6 } }, forcedWording: null };

  it("is stable and changes with data, heading and forced wording", () => {
    expect(sectionHash(base)).toBe(sectionHash({ ...base }));
    expect(sectionHash({ ...base, data: { team: { size: 7 } } })).not.toBe(sectionHash(base));
    expect(sectionHash({ ...base, heading: "Altro" })).not.toBe(sectionHash(base));
    expect(sectionHash({ ...base, forcedWording: "Siamo in sei." })).not.toBe(sectionHash(base));
  });
});
