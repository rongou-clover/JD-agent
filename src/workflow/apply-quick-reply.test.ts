import type { Diagnosis } from "@/domain/diagnosis";
import { describe, expect, it } from "vitest";
import { completeDraft, withField } from "@/domain/testing";
import { applyQuickReply } from "./apply-quick-reply";
import { initialState, type SessionState } from "./state";

const sdrDiagnosis: Diagnosis = { kind: "catalog", jobTitleId: "sdr", seniority: "S1", otherRoles: [], hybrid: false };

function proposedSdr(): SessionState {
  const base = initialState();
  const draft = withField(withField(base.draft, "jobTitle", { kind: "catalog", id: "sdr" }, "proposed", "catalog"), "seniority", "S1", "proposed", "inferred");
  return { ...base, draft, diagnosis: sdrDiagnosis };
}

describe("applyQuickReply", () => {
  it("confirms role and seniority", () => {
    const { state, focus } = applyQuickReply(proposedSdr(), { kind: "confirmRole" });
    expect(state.draft.jobTitle.status).toBe("confirmed");
    expect(state.draft.seniority.status).toBe("confirmed");
    expect(focus).toBe("plan");
  });

  it("moves seniority within the allowed levels and proposes again", () => {
    const up = applyQuickReply(proposedSdr(), { kind: "seniorityUp" });
    expect(up.state.draft.seniority.value).toBe("S2");
    expect(up.focus).toBe("diagnosis");
    const down = applyQuickReply(proposedSdr(), { kind: "seniorityDown" });
    expect(down.state.draft.seniority.value).toBe("S1");
  });

  it("another role clears the job title; picking one confirms it at an allowed seniority", () => {
    const cleared = applyQuickReply(proposedSdr(), { kind: "chooseOtherRole" }).state;
    expect(cleared.draft.jobTitle.status).toBe("missing");
    const picked = applyQuickReply(cleared, { kind: "pickRole", jobTitleId: "sales-manager" });
    expect(picked.state.draft.jobTitle).toEqual({ value: { kind: "catalog", id: "sales-manager" }, source: "user", status: "confirmed" });
    expect(picked.state.draft.seniority.value).toBe("S3");
    expect(picked.state.diagnosis).toMatchObject({ kind: "catalog", jobTitleId: "sales-manager", seniority: "S3" });
    expect(picked.focus).toBe("diagnosis");
  });

  it("hiring reason waits for the mission sentence, or completes an existing one", () => {
    const pending = applyQuickReply(initialState(), { kind: "hiringReason", reason: "insourcing" }).state;
    expect(pending.planner.pendingHiringReason).toBe("insourcing");
    expect(pending.draft.roleMission.value).toBeNull();
    const withMission = { ...initialState(), draft: completeDraft() };
    const completed = applyQuickReply(withMission, { kind: "hiringReason", reason: "replacement" }).state;
    expect(completed.draft.roleMission.value?.reason).toBe("replacement");
  });

  it("work mode keeps the city and resets office days unless hybrid", () => {
    const state = { ...initialState(), draft: completeDraft() };
    const remote = applyQuickReply(state, { kind: "workMode", mode: "remote" }).state;
    expect(remote.draft.location.value).toEqual({ city: "Milano", mode: "remote", officeDays: null, schedule: null, travel: null });
    const fresh = applyQuickReply(initialState(), { kind: "workMode", mode: "hybrid" }).state;
    expect(fresh.draft.location).toMatchObject({ status: "confirmed", value: { city: null, mode: "hybrid", officeDays: null } });
  });

  it("contract type", () => {
    const { state } = applyQuickReply(initialState(), { kind: "contractType", type: "internship" });
    expect(state.draft.contract.value).toEqual({ type: "internship", months: null, ccnl: null, level: null });
  });

  it("soft skills are appended once, at most four", () => {
    let state = initialState();
    for (const name of ["A", "B", "B", "C", "D", "E"]) state = applyQuickReply(state, { kind: "softSkill", name }).state;
    expect(state.draft.softSkills.value).toEqual(["A", "B", "C", "D"]);
  });

  it("picks a seniority", () => {
    const { state } = applyQuickReply(initialState(), { kind: "pickSeniority", seniority: "S3" });
    expect(state.draft.seniority).toEqual({ value: "S3", source: "user", status: "confirmed" });
  });
});
