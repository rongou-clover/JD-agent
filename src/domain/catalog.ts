import { z } from "zod";
import rawCatalog from "../../data/catalog.json";
import { Criticality, ExpectedLevel, JobFamily, Seniority, SkillType } from "./enums";

const CatalogSkill = z.object({
  name: z.string(),
  type: SkillType,
  criticality: Criticality,
  /** Missing seniority = skill not expected at that level. */
  expected: z.partialRecord(Seniority, ExpectedLevel),
});

const JobTitle = z.object({
  id: z.string(),
  family: JobFamily,
  name: z.string(),
  aliases: z.array(z.string()),
  seniority: z.array(Seniority).min(1),
  recommendedDimensions: z.array(z.string()),
  skills: z.array(CatalogSkill),
});

export const Catalog = z.object({
  version: z.string(),
  status: z.string(),
  seniority: z.record(Seniority, z.string()),
  jobFamilies: z.array(JobFamily),
  jobTitles: z.array(JobTitle),
});

export type CatalogSkill = z.infer<typeof CatalogSkill>;
export type JobTitle = z.infer<typeof JobTitle>;
export type Catalog = z.infer<typeof Catalog>;

export const catalog: Catalog = Catalog.parse(rawCatalog);

export function findJobTitle(id: string): JobTitle | undefined {
  return catalog.jobTitles.find((jobTitle) => jobTitle.id === id);
}

export function isSeniorityAllowed(jobTitle: JobTitle, seniority: Seniority): boolean {
  return jobTitle.seniority.includes(seniority);
}

export function expectedLevel(skill: CatalogSkill, seniority: Seniority): ExpectedLevel | null {
  return skill.expected[seniority] ?? null;
}
