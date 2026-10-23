import { findJobTitle } from "@/domain/catalog";
import { MAX_SOFT_SKILLS } from "@/domain/catalog-proposals";
import type { Draft } from "@/domain/draft";
import type { ContractType, HiringReason, WorkMode } from "@/domain/enums";
import type { QuickReplyAction } from "./quick-reply-actions";
import { shiftSeniority } from "./roles";
import type { SessionState } from "./state";
import type { Focus } from "./turn-context";

type Result = { state: SessionState; focus: Focus };

const confirmed = <T>(value: T) => ({ value, source: "user" as const, status: "confirmed" as const });

function withDraft(state: SessionState, draft: Draft, focus: Focus = "plan"): Result {
  return { state: { ...state, draft }, focus };
}

/** "Sì, va bene" under the role proposal: job title and seniority are confirmed. */
function confirmRole(state: SessionState): Result {
  const { jobTitle, seniority } = state.draft;
  return withDraft(state, {
    ...state.draft,
    jobTitle: jobTitle.value === null ? jobTitle : { ...jobTitle, status: "confirmed" },
    seniority: seniority.value === null ? seniority : { ...seniority, status: "confirmed" },
  });
}

/** One level down or up among the ones the role allows; the proposal is shown again. */
function shift(state: SessionState, step: -1 | 1): Result {
  const value = state.draft.jobTitle.value;
  const current = state.draft.seniority.value;
  const jobTitle = value?.kind === "catalog" ? findJobTitle(value.id) : undefined;
  const next = jobTitle && current ? shiftSeniority(jobTitle, current, step) : null;
  if (!next) return { state, focus: "diagnosis" };
  return withDraft(state, { ...state.draft, seniority: { value: next, source: "user", status: "proposed" } }, "diagnosis");
}

/** The picked or suggested role is confirmed; a seniority the new role does not allow is asked again. */
function pickRole(state: SessionState, jobTitleId: string): Result {
  const jobTitle = findJobTitle(jobTitleId);
  if (!jobTitle) return { state, focus: "plan" };
  const current = state.draft.seniority;
  const keepsSeniority = current.value !== null && jobTitle.seniority.includes(current.value);
  return withDraft(state, {
    ...state.draft,
    jobTitle: confirmed({ kind: "catalog" as const, id: jobTitleId }),
    seniority: keepsSeniority ? current : { value: null, source: null, status: "missing" },
  });
}

function keepRole(state: SessionState, declinedId: string): Result {
  const declinedRoles = [...new Set([...state.planner.declinedRoles, declinedId])];
  return { state: { ...state, planner: { ...state.planner, declinedRoles } }, focus: "plan" };
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
      return { state, focus: "chooseRole" };
    case "pickRole":
      return pickRole(state, action.jobTitleId);
    case "keepRole":
      return keepRole(state, action.declinedId);
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
