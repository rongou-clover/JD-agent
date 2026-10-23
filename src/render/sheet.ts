import { expectedLevel, findJobTitle, type CatalogSkill, type JobTitle } from "@/domain/catalog";
import type { Diagnosis } from "@/domain/diagnosis";
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
  const base = { name: skill.name, required: skill.required };
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

/** Names of all the roles mixed in a request where no role prevails, main role first. */
function hybridRoles(diagnosis: Diagnosis | null): string[] | null {
  if (diagnosis?.kind !== "catalog" || !diagnosis.hybrid) return null;
  return [diagnosis.jobTitleId, ...diagnosis.otherRoles.map((role) => role.jobTitleId)].map(
    (id) => findJobTitle(id)?.name ?? id,
  );
}

/** The internal sheet: never published, for the hiring team only. */
export function buildSheet(draft: Draft, diagnosis: Diagnosis | null): InternalSheet {
  const resolved = resolveJobTitle(draft, diagnosis);
  const jobTitle = resolved?.kind === "catalog" ? resolved.jobTitle : null;
  const seniority = fieldValue(draft, "seniority");
  return {
    jobTitle: jobTitleName(resolved) ?? TITLE_PLACEHOLDER,
    seniority,
    inCatalog: jobTitle !== null,
    hybridRoles: hybridRoles(diagnosis),
    skills: (fieldValue(draft, "technicalSkills") ?? []).map((skill) => sheetSkill(skill, jobTitle, seniority)),
    softSkills: fieldValue(draft, "softSkills") ?? [],
    prerequisites: (fieldValue(draft, "prerequisites") ?? []).map((prerequisite) => prerequisite.text),
    salary: fieldValue(draft, "salary"),
    managerNotes: fieldValue(draft, "managerNotes"),
    recommendedDimensions: jobTitle?.recommendedDimensions ?? [],
  };
}
