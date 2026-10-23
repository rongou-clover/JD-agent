import { describe, expect, it } from "vitest";
import type { FieldId } from "@/domain/fields";
import { completeDraft, withField } from "@/domain/testing";
import { COPY } from "./templates/copy";
import { extraction, messageTurn, session } from "./testing";

const skill = (name: string) => ({ name, required: true, expectedLevel: null, typicalMistake: null });
const sdr = () => withField(withField(completeDraft(), "jobTitle", { kind: "catalog", id: "sdr" }), "seniority", "S1");
const twoSkills = () => withField(sdr(), "technicalSkills", [skill("HubSpot"), skill("LinkedIn Sales Navigator")]);
const askedTwice = (fields: FieldId[]) => ({ previousAskedFields: fields });

describe("partly filled fields", () => {
  it("the re-ask says what is missing", async () => {
    const result = await messageTurn(session(twoSkills(), []), extraction(), "Ok");
    expect(result.message.questions).toEqual(["Ho **HubSpot** e **LinkedIn Sales Navigator**: me ne serve almeno un'altra."]);
  });

  it("'non lo so' completes the user's skills from the catalog instead of replacing them", async () => {
    const result = await messageTurn(session(twoSkills(), ["technicalSkills"]), extraction({ skipped: ["technicalSkills"] }));
    expect(result.state.draft.technicalSkills).toMatchObject({ source: "catalog", status: "proposed" });
    expect(result.state.draft.technicalSkills.value?.map((s) => s.name)).toEqual(["HubSpot", "LinkedIn Sales Navigator", "Aprire una cold call"]);
    expect(result.message.text.startsWith(COPY.proposedOnSkip("**Skill tecniche**"))).toBe(true);
  });

  it("'decidi tu': the extractor's completion replaces a confirmed partial value", async () => {
    const draft = withField(sdr(), "sixMonthResults", ["20 demo al mese"]);
    const completed = ["20 demo al mese", "Pipeline da 100k"];
    const found = extraction({ skipped: ["sixMonthResults"], updates: { sixMonthResults: { value: completed, source: "inferred" } } });
    const result = await messageTurn(session(draft, ["sixMonthResults"]), found, "Decidi tu");
    expect(result.state.draft.sixMonthResults).toEqual({ value: completed, source: "inferred", status: "proposed" });
  });
});

describe("a field is never asked a third time", () => {
  it("the second unanswered ask of a derivable field becomes a proposal", async () => {
    const state = session(twoSkills(), ["technicalSkills"], askedTwice(["technicalSkills"]));
    const result = await messageTurn(state, extraction(), "HubSpot e LinkedIn, te l'ho detto");
    expect(result.state.draft.technicalSkills.value).toHaveLength(3);
    expect(result.message.text).toContain(COPY.proposedOnSkip("**Skill tecniche**"));
    expect(result.state.planner.askedFields).not.toContain("technicalSkills");
  });

  it("a non-derivable one is left open and the agent moves on", async () => {
    const draft = withField(sdr(), "team", { size: null, reportsTo: "CEO", departments: [] });
    const result = await messageTurn(session(draft, ["team"], askedTwice(["team"])), extraction(), "Boh");
    expect(result.state.planner.skipped).toEqual(["team"]);
    expect(result.message.text).toContain(COPY.leftOpen("**Team e riporto**"));
  });

  it("the ask count follows the messages: asked once, then twice", async () => {
    const draft = withField(sdr(), "team", { size: null, reportsTo: "CEO", departments: [] });
    const first = await messageTurn(session(draft, []), extraction(), "Ok");
    expect(first.state.planner).toMatchObject({ askedFields: ["team"], previousAskedFields: [] });
    const second = await messageTurn(first.state, extraction(), "Ok");
    expect(second.state.planner).toMatchObject({ askedFields: ["team"], previousAskedFields: ["team"], skipped: [] });
    const third = await messageTurn(second.state, extraction(), "Ok");
    expect(third.state.planner.skipped).toEqual(["team"]);
    expect(third.state.planner.askedFields).not.toContain("team");
  });
});
