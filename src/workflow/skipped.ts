import { findJobTitle } from "@/domain/catalog";
import { completeTechnicalSkills, proposeSoftSkills } from "@/domain/catalog-proposals";
import type { Draft } from "@/domain/draft";
import { FIELDS, type FieldId } from "@/domain/fields";
import { missingRequiredFields } from "@/domain/planner";
import { nearestSeniority } from "./roles";
import type { PlannerMemory } from "./state";

export type SkipInput = {
  draft: Draft;
  /** The draft before this turn's message: the user's own partial value, before any proposal. */
  before: Draft;
  skipped: FieldId[];
  askedFields: FieldId[];
};

export type SkipOutcome = {
  draft: Draft;
  /** Skipped fields the agent filled itself; the message says so. */
  proposed: FieldId[];
  /** Skipped required fields the agent cannot derive: they stay missing and are not asked again. */
  leftOpen: FieldId[];
};

const proposal = <T>(value: T) => ({ value, source: "catalog" as const, status: "proposed" as const });

/** Required fields asked in both of the last two agent messages and still not done: they are not asked a third time. */
export function repeatedAsks(planner: PlannerMemory, draft: Draft): FieldId[] {
  const missing = missingRequiredFields(draft);
  return planner.askedFields.filter(
    (field) => field !== "jobTitle" && planner.previousAskedFields.includes(field) && missing.includes(field),
  );
}

/** The user's technical skills: those just stated, or else the ones the draft had before this message. */
function givenSkills(input: SkipInput, draft: Draft) {
  return draft.technicalSkills.source === "user" ? (draft.technicalSkills.value ?? []) : (input.before.technicalSkills.value ?? []);
}

/** Fields derived from the catalog in code when the role is in the catalog; with nothing to propose, the extractor's proposal stays. */
function withCatalogProposal(input: SkipInput, draft: Draft, field: FieldId): Draft {
  const value = draft.jobTitle.value;
  const jobTitle = value?.kind === "catalog" ? findJobTitle(value.id) : undefined;
  if (!jobTitle) return draft;
  const seniority = draft.seniority.value;
  switch (field) {
    case "technicalSkills": {
      const skills = completeTechnicalSkills(givenSkills(input, draft), jobTitle, seniority);
      return skills.length > 0 ? { ...draft, technicalSkills: proposal(skills) } : draft;
    }
    case "softSkills": {
      const skills = proposeSoftSkills(jobTitle, seniority);
      return skills.length > 0 ? { ...draft, softSkills: proposal(skills) } : draft;
    }
    case "seniority":
      return seniority === null ? { ...draft, seniority: proposal(nearestSeniority(jobTitle, null)) } : draft;
    default:
      return draft;
  }
}

/**
 * "Non lo so", "salta", "decidi tu" on asked fields (docs/decisioni.md): the agent proposes a value when it can
 * derive one (from the catalog here, from the extractor otherwise), completing what the user gave; a required
 * field it cannot derive stays missing. A value the user confirmed and completed is left alone; the job title is never skipped.
 */
export function applySkipped(input: SkipInput): SkipOutcome {
  const missingBefore = new Set(missingRequiredFields(input.draft));
  const fields = [...new Set(input.skipped)].filter(
    (field) =>
      field !== "jobTitle" &&
      input.askedFields.includes(field) &&
      (missingBefore.has(field) || input.draft[field].status !== "confirmed"),
  );
  const next = fields.reduce((draft, field) => withCatalogProposal(input, draft, field), input.draft);
  const missing = new Set(missingRequiredFields(next));
  return {
    draft: next,
    proposed: fields.filter((field) => next[field].status === "proposed" && next[field].value !== null && !missing.has(field)),
    leftOpen: fields.filter((field) => FIELDS[field].required && missing.has(field)),
  };
}
