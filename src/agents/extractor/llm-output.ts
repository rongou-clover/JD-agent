import { z } from "zod";
import {
  ContractType,
  ExpectedLevel,
  HiringReason,
  LanguageLevel,
  PrerequisiteType,
  WorkMode,
} from "@/domain/enums";
import { FIELD_IDS } from "@/domain/fields";
import { ProseSectionId } from "@/render/contract";
import { DISCRIMINATION_CATEGORIES } from "@/domain/validation/discrimination";
import { ExtractedSource, Intent, type ExtractorOutput } from "./schema";

/**
 * Schema sent to the model. It exceeds Anthropic's native structured output limits
 * (16 union-typed, 24 optional parameters), so it is injected in the prompt instead.
 * It is deliberately lenient: absent values may be null or missing and there are no length or
 * range constraints, so one odd field never voids the whole answer. The domain schemas
 * validate each field when merging.
 */
/** A bare value without the {value, source} wrapper is accepted as inferred; a malformed field is dropped. */
const wrapBare = (raw: unknown) =>
  raw === null || raw === undefined || (typeof raw === "object" && !Array.isArray(raw) && "value" in raw)
    ? raw
    : { value: raw, source: "inferred" };

const withSource = <T extends z.ZodType>(value: T) =>
  z.preprocess(wrapBare, z.object({ value, source: ExtractedSource.catch("inferred") }).nullish()).catch(null);

const Team = z.object({ size: z.number().int().nullish(), reportsTo: z.string().nullish(), departments: z.array(z.string()) });
const Skill = z.object({
  name: z.string(),
  required: z.boolean(),
  expectedLevel: ExpectedLevel.nullish(),
  typicalMistake: z.string().nullish(),
});
const Location = z.object({
  city: z.string().nullish(),
  mode: WorkMode,
  officeDays: z.number().int().nullish(),
  schedule: z.string().nullish(),
  travel: z.string().nullish(),
});
const Contract = z.object({
  type: ContractType,
  months: z.number().int().nullish(),
  ccnl: z.string().nullish(),
  level: z.string().nullish(),
});

export const ExtractorLlmOutput = z.object({
  intent: Intent,
  updates: z.object({
    companyName: withSource(z.string()),
    companyDescription: withSource(z.string()),
    missionValues: withSource(z.string()),
    roleMission: withSource(z.object({ reason: HiringReason, text: z.string() })),
    team: withSource(Team),
    activities: withSource(z.array(z.object({ text: z.string(), critical: z.boolean() }))),
    kpis: withSource(z.array(z.string())),
    sixMonthResults: withSource(z.array(z.string())),
    technicalSkills: withSource(z.array(Skill)),
    softSkills: withSource(z.array(z.string())),
    prerequisites: withSource(z.array(z.object({ type: PrerequisiteType, text: z.string() }))),
    languages: withSource(z.array(z.object({ language: z.string(), level: LanguageLevel, required: z.boolean() }))),
    location: withSource(Location),
    contract: withSource(Contract),
    salary: withSource(z.object({ min: z.number().int(), max: z.number().int(), inPosting: z.boolean() })),
    offer: withSource(z.array(z.string())),
    selectionProcess: withSource(z.array(z.object({ step: z.string(), timing: z.string().nullish() }))),
    managerNotes: withSource(z.string()),
  }),
  skipped: z.array(z.enum(FIELD_IDS)),
  forcedWording: z.object({ section: ProseSectionId, text: z.string() }).nullish().catch(null),
  discriminationFlags: z.array(z.object({ category: z.enum(DISCRIMINATION_CATEGORIES), quote: z.string() })),
  closerJobTitleId: z.string().nullish().catch(null),
});
export type ExtractorLlmOutput = z.infer<typeof ExtractorLlmOutput>;

type Source = z.infer<typeof ExtractedSource>;

function convert<T, V>(update: { value: T; source: Source } | null | undefined, map: (value: T) => V) {
  return update ? { value: map(update.value), source: update.source } : null;
}

const same = <T>(value: T) => value;

/** Model output → extractor contract: optional properties become nulls. */
export function toExtractorOutput(llm: ExtractorLlmOutput): ExtractorOutput {
  const u = llm.updates;
  return {
    intent: llm.intent,
    skipped: llm.skipped,
    forcedWording: llm.forcedWording ?? null,
    discriminationFlags: llm.discriminationFlags,
    closerJobTitleId: llm.closerJobTitleId ?? null,
    updates: {
      companyName: convert(u.companyName, same),
      companyDescription: convert(u.companyDescription, same),
      missionValues: convert(u.missionValues, same),
      roleMission: convert(u.roleMission, same),
      team: convert(u.team, (t) => ({ size: t.size ?? null, reportsTo: t.reportsTo ?? null, departments: t.departments })),
      activities: convert(u.activities, same),
      kpis: convert(u.kpis, same),
      sixMonthResults: convert(u.sixMonthResults, same),
      technicalSkills: convert(u.technicalSkills, (skills) =>
        skills.map((s) => ({ ...s, expectedLevel: s.expectedLevel ?? null, typicalMistake: s.typicalMistake ?? null })),
      ),
      softSkills: convert(u.softSkills, same),
      prerequisites: convert(u.prerequisites, same),
      languages: convert(u.languages, same),
      location: convert(u.location, (l) => ({
        city: l.city ?? null,
        mode: l.mode,
        officeDays: l.officeDays ?? null,
        schedule: l.schedule ?? null,
        travel: l.travel ?? null,
      })),
      contract: convert(u.contract, (c) => ({ type: c.type, months: c.months ?? null, ccnl: c.ccnl ?? null, level: c.level ?? null })),
      salary: convert(u.salary, same),
      offer: convert(u.offer, same),
      selectionProcess: convert(u.selectionProcess, (steps) => steps.map((s) => ({ step: s.step, timing: s.timing ?? null }))),
      managerNotes: convert(u.managerNotes, same),
    },
  };
}
