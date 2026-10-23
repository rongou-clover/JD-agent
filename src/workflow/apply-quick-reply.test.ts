import { describe, expect, it } from "vitest";
import { completeDraft, withField } from "@/domain/testing";
import { applyQuickReply } from "./apply-quick-reply";
import { initialState, type SessionState } from "./state";

function sdrAt(seniority: "S1" | "S2"): SessionState {
  const base = initialState();
  const draft = withField(withField(base.draft, "jobTitle", { kind: "catalog", id: "sdr" }), "seniority", seniority);
  return { ...base, draft };
}

describe("applyQuickReply", () => {
  it("switching role confirms it and keeps a seniority the new role allows", () => {
    const { state, focus } = applyQuickReply(sdrAt("S2"), { kind: "pickRole", jobTitleId: "account-executive" });
    expect(state.draft.jobTitle).toEqual({ value: { kind: "catalog", id: "account-executive" }, source: "user", status: "confirmed" });
    expect(state.draft.seniority.value).toBe("S2");
    expect(focus).toBe("plan");
  });

  it("switching role clears a seniority the new role does not allow", () => {
    const { state } = applyQuickReply(sdrAt("S1"), { kind: "pickRole", jobTitleId: "sales-manager" });
    expect(state.draft.seniority).toEqual({ value: null, source: null, status: "missing" });
  });

  it("keeping the role remembers the declined one", () => {
    const { state, focus } = applyQuickReply(sdrAt("S1"), { kind: "keepRole", declinedId: "account-executive" });
    expect(state.draft.jobTitle.value).toEqual({ kind: "catalog", id: "sdr" });
    expect(state.planner.declinedRoles).toEqual(["account-executive"]);
    expect(focus).toBe("plan");
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
