import { expectedLevel, type CatalogSkill, type JobTitle } from "@/domain/catalog";
import type { Draft, FieldValue } from "@/domain/draft";
import type { Seniority } from "@/domain/enums";
import { TITLE_PLACEHOLDER } from "./copy";
import type { InternalSheet } from "./contract";
import { fieldValue, jobTitleName, resolveJobTitle } from "./draft-values";

/** Case- and accent-insensitive name used to match a draft skill with a catalog skill. */
export function skillKey(name: string): string {
  return name.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/\s+/g, " ").trim();
}

type DraftSkill = FieldValue<"technicalSkills">[number];

function sheetSkill(skill: DraftSkill, jobTitle: JobTitle | null, seniority: Seniority | null): InternalSheet["skills"][number] {
  const base = { name: skill.name, required: skill.required, source: "draft" as const };
  // Out of catalog: no P levels (docs/schema-bozza.md).
  if (!jobTitle) return { ...base, type: null, criticality: null, expectedLevel: null };
  const match: CatalogSkill | undefined = jobTitle.skills.find((catalogSkill) => skillKey(catalogSkill.name) === skillKey(skill.name));
  if (!match) return { ...base, type: null, criticality: null, expectedLevel: skill.expectedLevel };
  return {
    ...base,
    type: match.type,
    criticality: match.criticality,
    expectedLevel: seniority ? expectedLevel(match, seniority) : skill.expectedLevel,
  };
}

/**
 * Catalog skills of the role the draft does not cite, with the P level for the seniority.
 * A skill the catalog does not expect at that seniority is left out. Not required: the user never asked for it.
 */
function catalogOnlySkills(drafted: DraftSkill[], jobTitle: JobTitle, seniority: Seniority | null): InternalSheet["skills"] {
  const cited = new Set(drafted.map((skill) => skillKey(skill.name)));
  return jobTitle.skills
    .filter((skill) => !cited.has(skillKey(skill.name)))
    .map((skill) => ({ skill, level: seniority ? expectedLevel(skill, seniority) : null }))
    .filter(({ level }) => seniority === null || level !== null)
    .map(({ skill, level }) => ({
      name: skill.name,
      type: skill.type,
      criticality: skill.criticality,
      expectedLevel: level,
      required: false,
      source: "catalog" as const,
    }));
}

/** The internal sheet: never published, for the hiring team only. */
export function buildSheet(draft: Draft): InternalSheet {
  const resolved = resolveJobTitle(draft);
  const jobTitle = resolved?.kind === "catalog" ? resolved.jobTitle : null;
  const seniority = fieldValue(draft, "seniority");
  const drafted = fieldValue(draft, "technicalSkills") ?? [];
  return {
    jobTitle: jobTitleName(resolved) ?? TITLE_PLACEHOLDER,
    seniority,
    inCatalog: jobTitle !== null,
    skills: [
      ...drafted.map((skill) => sheetSkill(skill, jobTitle, seniority)),
      ...(jobTitle ? catalogOnlySkills(drafted, jobTitle, seniority) : []),
    ],
    softSkills: fieldValue(draft, "softSkills") ?? [],
    prerequisites: (fieldValue(draft, "prerequisites") ?? []).map((prerequisite) => prerequisite.text),
    salary: fieldValue(draft, "salary"),
    managerNotes: fieldValue(draft, "managerNotes"),
    recommendedDimensions: jobTitle?.recommendedDimensions ?? [],
  };
}
