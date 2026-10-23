import { findJobTitle } from "@/domain/catalog";
import type { Diagnosis } from "@/domain/diagnosis";
import type { Draft } from "@/domain/draft";
import type { ContractType, HiringReason, Seniority, WorkMode } from "@/domain/enums";
import type { QuickReplyAction } from "./quick-reply-actions";
import { nearestSeniority, shiftSeniority } from "./roles";
import type { SessionState } from "./state";
import type { Focus } from "./turn-context";

/** Soft skills: at most 4 (docs/decisioni.md). */
const MAX_SOFT_SKILLS = 4;

type Result = { state: SessionState; focus: Focus };

const confirmed = <T>(value: T) => ({ value, source: "user" as const, status: "confirmed" as const });

function withDraft(state: SessionState, draft: Draft, focus: Focus = "plan"): Result {
  return { state: { ...state, draft }, focus };
}

function confirmRole(state: SessionState): Result {
  const { jobTitle, seniority } = state.draft;
  const draft: Draft = {
    ...state.draft,
    jobTitle: jobTitle.value === null ? jobTitle : { ...jobTitle, status: "confirmed" },
    seniority: seniority.value === null ? seniority : { ...seniority, status: "confirmed" },
  };
  return withDraft(state, draft);
}

function setSeniority(state: SessionState, seniority: Seniority, focus: Focus): Result {
  const diagnosis: Diagnosis | null =
    state.diagnosis?.kind === "catalog" ? { ...state.diagnosis, seniority } : state.diagnosis;
  const draft: Draft = { ...state.draft, seniority: { value: seniority, source: "user", status: "proposed" } };
  return { state: { ...state, draft, diagnosis }, focus };
}

function shift(state: SessionState, step: -1 | 1): Result {
  const value = state.draft.jobTitle.value;
  const current = state.draft.seniority.value;
  const jobTitle = value?.kind === "catalog" ? findJobTitle(value.id) : undefined;
  const next = jobTitle && current ? shiftSeniority(jobTitle, current, step) : null;
  return next ? setSeniority(state, next, "diagnosis") : { state, focus: "diagnosis" };
}

/** The picked role is confirmed; seniority moves to the closest level the role allows, still to confirm. */
function pickRole(state: SessionState, jobTitleId: string): Result {
  const jobTitle = findJobTitle(jobTitleId);
  if (!jobTitle) return { state, focus: "plan" };
  const seniority = nearestSeniority(jobTitle, state.draft.seniority.value);
  const previous = state.diagnosis?.kind === "catalog" ? state.diagnosis : null;
  const otherRoles = (previous?.otherRoles ?? []).filter((role) => role.jobTitleId !== jobTitleId);
  const diagnosis: Diagnosis = {
    kind: "catalog",
    jobTitleId,
    seniority,
    otherRoles,
    hybrid: (previous?.hybrid ?? false) && otherRoles.length > 0,
  };
  const draft: Draft = {
    ...state.draft,
    jobTitle: confirmed({ kind: "catalog" as const, id: jobTitleId }),
    seniority: { value: seniority, source: "catalog", status: "proposed" },
  };
  return { state: { ...state, draft, diagnosis }, focus: "diagnosis" };
}

/** The reason waits for the sentence that completes the role mission, unless that sentence is already there. */
function hiringReason(state: SessionState, reason: HiringReason): Result {
  const mission = state.draft.roleMission.value;
  if (mission) return withDraft(state, { ...state.draft, roleMission: confirmed({ ...mission, reason }) });
  return { state: { ...state, planner: { ...state.planner, pendingHiringReason: reason } }, focus: "plan" };
}

function workMode(state: SessionState, mode: WorkMode): Result {
  const current = state.draft.location.value;
  const location = {
    city: current?.city ?? null,
    mode,
    officeDays: mode === "hybrid" ? (current?.officeDays ?? null) : null,
    schedule: current?.schedule ?? null,
    travel: current?.travel ?? null,
  };
  return withDraft(state, { ...state.draft, location: confirmed(location) });
}

function contractType(state: SessionState, type: ContractType): Result {
  const current = state.draft.contract.value;
  const contract = {
    type,
    months: type === "fixedTerm" ? (current?.months ?? null) : null,
    ccnl: current?.ccnl ?? null,
    level: current?.level ?? null,
  };
  return withDraft(state, { ...state.draft, contract: confirmed(contract) });
}

function softSkill(state: SessionState, name: string): Result {
  const current = state.draft.softSkills.value ?? [];
  if (current.includes(name) || current.length >= MAX_SOFT_SKILLS) return { state, focus: "plan" };
  return withDraft(state, { ...state.draft, softSkills: confirmed([...current, name]) });
}

export function applyQuickReply(state: SessionState, action: QuickReplyAction): Result {
  switch (action.kind) {
    case "confirmRole":
      return confirmRole(state);
    case "seniorityDown":
      return shift(state, -1);
    case "seniorityUp":
      return shift(state, 1);
    case "chooseOtherRole":
      return withDraft(state, { ...state.draft, jobTitle: { value: null, source: null, status: "missing" } });
    case "pickRole":
      return pickRole(state, action.jobTitleId);
    case "pickSeniority":
      return withDraft(state, { ...state.draft, seniority: confirmed(action.seniority) });
    case "hiringReason":
      return hiringReason(state, action.reason);
    case "workMode":
      return workMode(state, action.mode);
    case "contractType":
      return contractType(state, action.type);
    case "softSkill":
      return softSkill(state, action.name);
  }
}
