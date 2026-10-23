import { z } from "zod";
import {
  ContractType,
  ExpectedLevel,
  FieldSource,
  FieldStatus,
  HiringReason,
  LanguageLevel,
  PrerequisiteType,
  Seniority,
  WorkMode,
} from "./enums";
import { FIELD_IDS, type FieldId } from "./fields";

const text = z.string().trim().min(1);

export const RoleMissionValue = z.object({ reason: HiringReason, text });

export const JobTitleValue = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("catalog"), id: text }),
  z.object({ kind: z.literal("outOfCatalog"), title: text }),
]);

export const TeamValue = z.object({
  size: z.number().int().positive().nullable(),
  reportsTo: z.string().trim().nullable(),
  departments: z.array(text),
});

export const ActivityValue = z.object({ text, critical: z.boolean() });

export const TechnicalSkillValue = z.object({
  name: text,
  required: z.boolean(),
  expectedLevel: ExpectedLevel.nullable(),
  /** Typical mistake of someone who lacks the skill; internal sheet only. */
  typicalMistake: z.string().trim().nullable(),
});

export const PrerequisiteValue = z.object({ type: PrerequisiteType, text });

export const LanguageValue = z.object({ language: text, level: LanguageLevel, required: z.boolean() });

export const LocationValue = z.object({
  city: z.string().trim().nullable(),
  mode: WorkMode,
  officeDays: z.number().int().min(1).max(5).nullable(),
  schedule: z.string().trim().nullable(),
  travel: z.string().trim().nullable(),
});

export const ContractValue = z.object({
  type: ContractType,
  months: z.number().int().positive().nullable(),
  ccnl: z.string().trim().nullable(),
  level: z.string().trim().nullable(),
});

export const SalaryValue = z.object({
  min: z.number().int().positive(),
  max: z.number().int().positive(),
  inPosting: z.boolean(),
});

export const SelectionStepValue = z.object({ step: text, timing: z.string().trim().nullable() });

export const FIELD_VALUE_SCHEMAS = {
  companyName: text,
  companyDescription: text,
  missionValues: text,
  roleMission: RoleMissionValue,
  jobTitle: JobTitleValue,
  seniority: Seniority,
  team: TeamValue,
  activities: z.array(ActivityValue),
  kpis: z.array(text),
  sixMonthResults: z.array(text),
  technicalSkills: z.array(TechnicalSkillValue),
  softSkills: z.array(text),
  prerequisites: z.array(PrerequisiteValue),
  languages: z.array(LanguageValue),
  location: LocationValue,
  contract: ContractValue,
  salary: SalaryValue,
  offer: z.array(text),
  selectionProcess: z.array(SelectionStepValue),
  managerNotes: text,
} satisfies Record<FieldId, z.ZodType>;

type ValueSchemas = typeof FIELD_VALUE_SCHEMAS;
export type FieldValue<F extends FieldId> = z.infer<ValueSchemas[F]>;

function slot<T extends z.ZodType>(value: T) {
  return z.object({ value: value.nullable(), source: FieldSource.nullable(), status: FieldStatus });
}

export const Draft = z.object({
  companyName: slot(FIELD_VALUE_SCHEMAS.companyName),
  companyDescription: slot(FIELD_VALUE_SCHEMAS.companyDescription),
  missionValues: slot(FIELD_VALUE_SCHEMAS.missionValues),
  roleMission: slot(FIELD_VALUE_SCHEMAS.roleMission),
  jobTitle: slot(FIELD_VALUE_SCHEMAS.jobTitle),
  seniority: slot(FIELD_VALUE_SCHEMAS.seniority),
  team: slot(FIELD_VALUE_SCHEMAS.team),
  activities: slot(FIELD_VALUE_SCHEMAS.activities),
  kpis: slot(FIELD_VALUE_SCHEMAS.kpis),
  sixMonthResults: slot(FIELD_VALUE_SCHEMAS.sixMonthResults),
  technicalSkills: slot(FIELD_VALUE_SCHEMAS.technicalSkills),
  softSkills: slot(FIELD_VALUE_SCHEMAS.softSkills),
  prerequisites: slot(FIELD_VALUE_SCHEMAS.prerequisites),
  languages: slot(FIELD_VALUE_SCHEMAS.languages),
  location: slot(FIELD_VALUE_SCHEMAS.location),
  contract: slot(FIELD_VALUE_SCHEMAS.contract),
  salary: slot(FIELD_VALUE_SCHEMAS.salary),
  offer: slot(FIELD_VALUE_SCHEMAS.offer),
  selectionProcess: slot(FIELD_VALUE_SCHEMAS.selectionProcess),
  managerNotes: slot(FIELD_VALUE_SCHEMAS.managerNotes),
}) satisfies z.ZodType<Record<FieldId, unknown>>;

export type Draft = z.infer<typeof Draft>;
export type FieldSlot<F extends FieldId> = Draft[F];

export function emptyDraft(): Draft {
  const missing = { value: null, source: null, status: FieldStatus.enum.missing };
  return Draft.parse(Object.fromEntries(FIELD_IDS.map((id) => [id, missing])));
}
