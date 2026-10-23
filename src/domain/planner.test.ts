import { describe, expect, it } from "vitest";
import { buildChecklist } from "./checklist";
import { emptyDraft } from "./draft";
import { REQUIRED_FIELD_IDS, type FieldId } from "./fields";
import { planNext } from "./planner";
import { completeDraft, withField, without } from "./testing";

const notOffered = { optionalOffered: false, skipped: [] };

describe("buildChecklist", () => {
  it("counts the 12 required fields", () => {
    expect(buildChecklist(emptyDraft())).toMatchObject({ doneCount: 0, totalCount: 12, complete: false });
    expect(buildChecklist(completeDraft())).toMatchObject({ doneCount: 12, complete: true });
    expect(REQUIRED_FIELD_IDS).toHaveLength(12);
  });

  it("counts proposed fields as done", () => {
    const draft = withField(completeDraft(), "seniority", "S2", "proposed", "inferred");
    expect(buildChecklist(draft).complete).toBe(true);
  });

  it("does not count a field with a blocking issue", () => {
    const draft = withField(completeDraft(), "sixMonthResults", ["Solo uno"]);
    expect(buildChecklist(draft)).toMatchObject({ doneCount: 11, complete: false });
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
    expect(planNext(draft, { optionalOffered: true, skipped: [] })).toEqual({ kind: "done" });
  });

  it("never asks a skipped field again; the diagnosis is never skipped", () => {
    const draft = without(completeDraft(), "companyName", "roleMission", "location");
    expect(planNext(draft, { optionalOffered: false, skipped: ["companyName"] })).toEqual({ kind: "required", fields: ["roleMission"] });
    const noRole = without(draft, "jobTitle");
    expect(planNext(noRole, { optionalOffered: false, skipped: ["jobTitle"] })).toEqual({ kind: "diagnosis" });
  });

  it("with only skipped fields left, offers the optional fields, then is done", () => {
    const draft = without(completeDraft(), "location", "contract");
    const skipped: FieldId[] = ["location", "contract"];
    expect(planNext(draft, { optionalOffered: false, skipped }).kind).toBe("optional");
    expect(planNext(draft, { optionalOffered: true, skipped })).toEqual({ kind: "done" });
    expect(buildChecklist(draft).complete).toBe(false);
  });
});
