import type { z } from "zod";
import type { Diagnosis } from "@/domain/diagnosis";
import type { Draft } from "@/domain/draft";
import type { FieldId } from "@/domain/fields";
import { JUNIOR_ACTIVITIES_HEADING, LANGUAGE_LEVEL_LABELS, SECTION_HEADINGS, SENIORITY_LABELS } from "./copy";
import type { ProseSectionId } from "./contract";
import { fieldValue, isMissing, jobTitleName, resolveJobTitle } from "./draft-values";

export type ProseSection = z.infer<typeof ProseSectionId>;

/**
 * Length of one written section: the guard enforces min/max words and bullet points (0 = prose only);
 * the target steers the writer so that a complete posting lands at 500–700 words.
 */
export type Bounds = { minWords: number; targetWords: number; maxWords: number; maxBullets: number };

const words = (minWords: number, targetWords: number, maxWords: number, maxBullets: number): Bounds => ({
  minWords,
  targetWords,
  maxWords,
  maxBullets,
});

/** Draft values that only shape the wording or heading of a section. */
type ContextField = "jobTitle" | "seniority";

type SectionSpec = {
  /** Draft fields the section is written from. */
  fields: readonly FieldId[];
  /** Missing → placeholder instead of the section. */
  required: readonly FieldId[];
  context: readonly ContextField[];
  bounds: Bounds;
};

/** What each prose section depends on (docs/template-output.md). A change here re-renders the section. */
export const SECTION_SPECS: Record<ProseSection, SectionSpec> = {
  role: { fields: ["roleMission"], required: ["roleMission"], context: ["jobTitle"], bounds: words(20, 60, 110, 0) },
  team: { fields: ["team"], required: ["team"], context: [], bounds: words(12, 40, 80, 0) },
  activities: { fields: ["activities", "kpis"], required: ["activities"], context: ["seniority"], bounds: words(30, 105, 200, 8) },
  results: { fields: ["sixMonthResults"], required: ["sixMonthResults"], context: [], bounds: words(12, 45, 110, 5) },
  requirements: {
    fields: ["technicalSkills", "prerequisites", "languages"],
    required: ["technicalSkills"],
    context: ["seniority"],
    bounds: words(20, 80, 160, 7),
  },
  niceToHave: { fields: ["technicalSkills", "languages"], required: [], context: [], bounds: words(4, 15, 80, 4) },
  howYouWork: { fields: ["softSkills"], required: ["softSkills"], context: [], bounds: words(15, 55, 110, 5) },
  offer: { fields: ["offer"], required: [], context: [], bounds: words(8, 60, 150, 8) },
  practicalInfo: { fields: ["location", "contract"], required: [], context: [], bounds: words(8, 45, 120, 8) },
  selectionProcess: { fields: ["selectionProcess"], required: [], context: [], bounds: words(10, 45, 110, 5) },
  about: { fields: ["companyName", "companyDescription"], required: ["companyName", "companyDescription"], context: [], bounds: words(15, 55, 110, 0) },
  missionValues: { fields: ["missionValues"], required: [], context: [], bounds: words(6, 35, 90, 4) },
};

export function sectionHeading(section: ProseSection, draft: Draft): string {
  if (section === "activities" && fieldValue(draft, "seniority") === "S1") return JUNIOR_ACTIVITIES_HEADING;
  return SECTION_HEADINGS[section];
}

/** Skills and languages are split between requirements (required) and nice to have (the rest). */
function wantsRequired(section: ProseSection): boolean {
  return section !== "niceToHave";
}

/** What the writer sees of a field: internal-only data (expected level, typical mistake) never leaves the draft. */
function fieldView(section: ProseSection, field: FieldId, draft: Draft): unknown {
  if (field === "technicalSkills") {
    const skills = fieldValue(draft, "technicalSkills") ?? [];
    return skills.filter((skill) => skill.required === wantsRequired(section)).map((skill) => skill.name);
  }
  if (field === "languages") {
    const languages = fieldValue(draft, "languages") ?? [];
    return languages
      .filter((language) => language.required === wantsRequired(section))
      .map((language) => `${language.language} ${LANGUAGE_LEVEL_LABELS[language.level]}`);
  }
  return fieldValue(draft, field);
}

const isEmpty = (value: unknown) => value === null || (Array.isArray(value) && value.length === 0);

function contextView(field: ContextField, draft: Draft, diagnosis: Diagnosis | null): string | null {
  if (field === "jobTitle") return jobTitleName(resolveJobTitle(draft, diagnosis));
  const seniority = fieldValue(draft, "seniority");
  return seniority ? `${seniority} ${SENIORITY_LABELS[seniority]}` : null;
}

export type SectionPlan =
  | { kind: "placeholder" }
  | { kind: "omit" }
  | { kind: "write"; data: Record<string, unknown> };

/** Placeholder when a required field is missing, omitted when there is nothing to say, else the writer's input. */
export function planSection(section: ProseSection, draft: Draft, diagnosis: Diagnosis | null): SectionPlan {
  const spec = SECTION_SPECS[section];
  if (spec.required.some((field) => isMissing(draft, field))) return { kind: "placeholder" };
  const fields = spec.fields.map((field) => [field, fieldView(section, field, draft)] as const);
  if (fields.every(([, value]) => isEmpty(value))) return { kind: "omit" };
  const context = spec.context.map((field) => [field, contextView(field, draft, diagnosis)] as const);
  return { kind: "write", data: Object.fromEntries([...fields, ...context].filter(([, value]) => !isEmpty(value))) };
}
