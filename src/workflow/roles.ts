import { catalog, type JobTitle } from "@/domain/catalog";
import { SENIORITIES, type Seniority } from "@/domain/enums";

export function seniorityLabel(seniority: Seniority): string {
  return catalog.seniority[seniority] ?? seniority;
}

function allowed(jobTitle: JobTitle): Seniority[] {
  return SENIORITIES.filter((seniority) => jobTitle.seniority.includes(seniority));
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
