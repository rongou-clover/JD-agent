import type { z } from "zod";
import type { Diagnosis } from "@/domain/diagnosis";
import type { Draft } from "@/domain/draft";
import type { FieldId } from "@/domain/fields";
import { JUNIOR_ACTIVITIES_HEADING, LANGUAGE_LEVEL_LABELS, SECTION_HEADINGS, SENIORITY_LABELS } from "./copy";
import type { ProseSectionId } from "./contract";
import { fieldValue, isMissing, jobTitleName, resolveJobTitle } from "./draft-values";

export type ProseSection = z.infer<typeof ProseSectionId>;

/** Guard limits on one written section: total words and number of bullet points (0 = prose only). */
export type Bounds = { minWords: number; maxWords: number; maxBullets: number };

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
  role: { fields: ["roleMission"], required: ["roleMission"], context: ["jobTitle"], bounds: { minWords: 20, maxWords: 110, maxBullets: 0 } },
  team: { fields: ["team"], required: ["team"], context: [], bounds: { minWords: 12, maxWords: 80, maxBullets: 0 } },
  activities: {
    fields: ["activities", "kpis"],
    required: ["activities"],
    context: ["seniority"],
    bounds: { minWords: 30, maxWords: 200, maxBullets: 8 },
  },
  results: { fields: ["sixMonthResults"], required: ["sixMonthResults"], context: [], bounds: { minWords: 12, maxWords: 110, maxBullets: 5 } },
  requirements: {
    fields: ["technicalSkills", "prerequisites", "languages"],
    required: ["technicalSkills"],
    context: ["seniority"],
    bounds: { minWords: 20, maxWords: 160, maxBullets: 7 },
  },
  niceToHave: { fields: ["technicalSkills", "languages"], required: [], context: [], bounds: { minWords: 4, maxWords: 80, maxBullets: 4 } },
  howYouWork: { fields: ["softSkills"], required: ["softSkills"], context: [], bounds: { minWords: 15, maxWords: 110, maxBullets: 5 } },
  offer: { fields: ["offer"], required: [], context: [], bounds: { minWords: 8, maxWords: 150, maxBullets: 8 } },
  practicalInfo: { fields: ["location", "contract"], required: [], context: [], bounds: { minWords: 8, maxWords: 120, maxBullets: 8 } },
  selectionProcess: { fields: ["selectionProcess"], required: [], context: [], bounds: { minWords: 10, maxWords: 110, maxBullets: 5 } },
  about: {
    fields: ["companyName", "companyDescription"],
    required: ["companyName", "companyDescription"],
    context: [],
    bounds: { minWords: 15, maxWords: 110, maxBullets: 0 },
  },
  missionValues: { fields: ["missionValues"], required: [], context: [], bounds: { minWords: 6, maxWords: 90, maxBullets: 4 } },
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
