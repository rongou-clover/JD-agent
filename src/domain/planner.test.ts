import { describe, expect, it } from "vitest";
import { buildChecklist } from "./checklist";
import { emptyDraft, type Draft } from "./draft";
import { REQUIRED_FIELD_IDS, type FieldId } from "./fields";
import { planNext } from "./planner";
import { completeDraft, withField } from "./testing";

const notOffered = { optionalOffered: false };

function without(draft: Draft, ...fields: FieldId[]): Draft {
  const empty = emptyDraft();
  return fields.reduce((acc, field) => ({ ...acc, [field]: empty[field] }), draft);
}

describe("buildChecklist", () => {
  it("counts the 11 required fields", () => {
    expect(buildChecklist(emptyDraft())).toMatchObject({ doneCount: 0, totalCount: 11, complete: false });
    expect(buildChecklist(completeDraft())).toMatchObject({ doneCount: 11, complete: true });
    expect(REQUIRED_FIELD_IDS).toHaveLength(11);
  });

  it("counts proposed fields as done", () => {
    const draft = withField(completeDraft(), "seniority", "S2", "proposed", "inferred");
    expect(buildChecklist(draft).complete).toBe(true);
  });

  it("does not count a field with a blocking issue", () => {
    const draft = withField(completeDraft(), "sixMonthResults", ["Solo uno"]);
    expect(buildChecklist(draft)).toMatchObject({ doneCount: 10, complete: false });
  });
});

describe("planNext", () => {
  it("starts with the diagnosis", () => {
    expect(planNext(emptyDraft(), notOffered)).toEqual({ kind: "diagnosis" });
  });

  it("asks the highest priority field first, paired with a close one", () => {
    const draft = without(completeDraft(), "companyDescription", "roleMission", "contract");
    expect(planNext(draft, notOffered)).toEqual({ kind: "required", fields: ["companyDescription", "roleMission"] });
  });

  it("never pairs fields whose priorities are far apart", () => {
    const draft = without(completeDraft(), "companyDescription", "location");
    expect(planNext(draft, notOffered)).toEqual({ kind: "required", fields: ["companyDescription"] });
  });

  it("asks at most two questions", () => {
    const draft = without(completeDraft(), "seniority", "activities", "team", "sixMonthResults");
    const plan = planNext(draft, notOffered);
    expect(plan).toEqual({ kind: "required", fields: ["seniority", "activities"] });
  });

  it("never asks a field already covered", () => {
    const draft = without(completeDraft(), "location", "contract");
    const plan = planNext(draft, notOffered);
    expect(plan.kind === "required" && plan.fields).toEqual(["location", "contract"]);
  });

  it("re-asks a field with a blocking issue", () => {
    const draft = withField(completeDraft(), "sixMonthResults", ["Solo uno"]);
    expect(planNext(draft, notOffered)).toEqual({ kind: "required", fields: ["sixMonthResults"] });
  });

  it("offers the missing optional fields once, in one message", () => {
    const draft = withField(completeDraft(), "salary", { min: 30000, max: 35000, inPosting: false });
    const plan = planNext(draft, notOffered);
    expect(plan).toEqual({
      kind: "optional",
      fields: ["offer", "languages", "prerequisites", "kpis", "selectionProcess", "missionValues", "managerNotes"],
    });
    expect(planNext(draft, { optionalOffered: true })).toEqual({ kind: "done" });
  });
});
