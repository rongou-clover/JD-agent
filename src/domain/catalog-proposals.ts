import { expectedLevel, type CatalogSkill, type JobTitle } from "./catalog";
import type { FieldValue } from "./draft";
import type { Criticality, Seniority } from "./enums";
import { LIST_BOUNDS } from "./validation/rules";

/** Soft skills: at most 4 (docs/decisioni.md). */
export const MAX_SOFT_SKILLS = 4;

/** Catalog criticalities a proposed technical skill must have. */
const PROPOSED_CRITICALITIES: readonly Criticality[] = ["critica", "importante"];

/** A skill exists at a seniority when the catalog gives it an expected level there; with no seniority, every skill counts. */
function existsAt(skill: CatalogSkill, seniority: Seniority | null): boolean {
  return seniority === null || expectedLevel(skill, seniority) !== null;
}

/** The role's critical and important hard skills at the seniority; only the critical ones are required. */
export function proposeTechnicalSkills(jobTitle: JobTitle, seniority: Seniority | null): FieldValue<"technicalSkills"> {
  return jobTitle.skills
    .filter((skill) => skill.type === "hard" && PROPOSED_CRITICALITIES.includes(skill.criticality) && existsAt(skill, seniority))
    .map((skill) => ({
      name: skill.name,
      required: skill.criticality === "critica",
      expectedLevel: seniority === null ? null : expectedLevel(skill, seniority),
      typicalMistake: null,
    }));
}

/** Keeps the skills the user gave and adds the catalog's until the minimum; with none given, all of the catalog's. */
export function completeTechnicalSkills(
  given: FieldValue<"technicalSkills">,
  jobTitle: JobTitle,
  seniority: Seniority | null,
): FieldValue<"technicalSkills"> {
  const fromCatalog = proposeTechnicalSkills(jobTitle, seniority);
  if (given.length === 0) return fromCatalog;
  const known = new Set(given.map((skill) => skill.name.toLowerCase()));
  const extra = fromCatalog.filter((skill) => !known.has(skill.name.toLowerCase()));
  return [...given, ...extra.slice(0, Math.max(LIST_BOUNDS.technicalSkills.min - given.length, 0))];
}

/** The role's soft skills at the seniority, then its recommended dimensions; at most four, no duplicates. */
export function proposeSoftSkills(jobTitle: JobTitle, seniority: Seniority | null): FieldValue<"softSkills"> {
  const soft = jobTitle.skills.filter((skill) => skill.type === "soft" && existsAt(skill, seniority)).map((skill) => skill.name);
  return [...new Set([...soft, ...jobTitle.recommendedDimensions])].slice(0, MAX_SOFT_SKILLS);
}
