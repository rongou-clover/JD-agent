import { catalog, findJobTitle, type JobTitle } from "@/domain/catalog";
import type { Diagnosis } from "@/domain/diagnosis";
import { SENIORITIES, type Seniority } from "@/domain/enums";

/** Roles offered after "Scegli un altro ruolo". */
export const MAX_ROLE_CANDIDATES = 4;

export function seniorityLabel(seniority: Seniority): string {
  return catalog.seniority[seniority] ?? seniority;
}

function allowed(jobTitle: JobTitle): Seniority[] {
  return SENIORITIES.filter((seniority) => jobTitle.seniority.includes(seniority));
}

/** The next allowed seniority in the given direction, or null at the edge. */
export function shiftSeniority(jobTitle: JobTitle, current: Seniority, step: -1 | 1): Seniority | null {
  const levels = allowed(jobTitle);
  const index = levels.indexOf(current);
  if (index === -1) return null;
  return levels[index + step] ?? null;
}

/** The allowed seniority closest to the current one; ties go to the lower level. */
export function nearestSeniority(jobTitle: JobTitle, current: Seniority | null): Seniority {
  const levels = allowed(jobTitle);
  const [lowest] = levels;
  if (!lowest) throw new Error(`Job title ${jobTitle.id} has no seniority`);
  if (current === null) return lowest;
  const target = SENIORITIES.indexOf(current);
  const distance = (level: Seniority) => Math.abs(SENIORITIES.indexOf(level) - target);
  return levels.reduce((best, level) => (distance(level) < distance(best) ? level : best), lowest);
}

/** Other roles from the diagnosis first, then roles of the same family; never the excluded one. */
export function roleCandidates(diagnosis: Diagnosis | null, excludeId: string | null): JobTitle[] {
  if (diagnosis?.kind !== "catalog") return [];
  const main = findJobTitle(diagnosis.jobTitleId);
  const fromDiagnosis = diagnosis.otherRoles.map((role) => findJobTitle(role.jobTitleId));
  const sameFamily = catalog.jobTitles.filter((jobTitle) => jobTitle.family === main?.family);
  const unique = new Map<string, JobTitle>();
  for (const jobTitle of [main, ...fromDiagnosis, ...sameFamily]) {
    if (jobTitle && jobTitle.id !== excludeId && !unique.has(jobTitle.id)) unique.set(jobTitle.id, jobTitle);
  }
  return [...unique.values()].slice(0, MAX_ROLE_CANDIDATES);
}
