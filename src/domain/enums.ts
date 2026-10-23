import { z } from "zod";

export const SENIORITIES = ["S1", "S2", "S3", "S4"] as const;
export const Seniority = z.enum(SENIORITIES);
export type Seniority = z.infer<typeof Seniority>;

export const EXPECTED_LEVELS = ["P1", "P2", "P3", "P4"] as const;
export const ExpectedLevel = z.enum(EXPECTED_LEVELS);
export type ExpectedLevel = z.infer<typeof ExpectedLevel>;

export const JOB_FAMILIES = ["Sales", "Customer", "Marketing", "Growth", "GTM"] as const;
export const JobFamily = z.enum(JOB_FAMILIES);
export type JobFamily = z.infer<typeof JobFamily>;

/** Skill types and criticality as spelled in data/catalog.json. */
export const SkillType = z.enum(["hard", "soft", "IA", "collaborazione"]);
export type SkillType = z.infer<typeof SkillType>;

export const Criticality = z.enum(["critica", "importante", "accessoria"]);
export type Criticality = z.infer<typeof Criticality>;

export const FieldStatus = z.enum(["missing", "proposed", "confirmed"]);
export type FieldStatus = z.infer<typeof FieldStatus>;

export const FieldSource = z.enum(["user", "inferred", "catalog"]);
export type FieldSource = z.infer<typeof FieldSource>;

export const HiringReason = z.enum(["new", "replacement", "insourcing"]);
export type HiringReason = z.infer<typeof HiringReason>;

export const WorkMode = z.enum(["onsite", "hybrid", "remote"]);
export type WorkMode = z.infer<typeof WorkMode>;

export const ContractType = z.enum(["permanent", "fixedTerm", "freelance", "internship"]);
export type ContractType = z.infer<typeof ContractType>;

export const PrerequisiteType = z.enum(["experience", "degree", "tool", "availability", "sector"]);
export type PrerequisiteType = z.infer<typeof PrerequisiteType>;

export const LanguageLevel = z.enum(["A1", "A2", "B1", "B2", "C1", "C2", "native"]);
export type LanguageLevel = z.infer<typeof LanguageLevel>;
