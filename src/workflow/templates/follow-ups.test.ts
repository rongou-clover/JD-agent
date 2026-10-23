import { describe, expect, it } from "vitest";
import { emptyDraft } from "@/domain/draft";
import { completeDraft, withField } from "@/domain/testing";
import { initialState } from "../state";
import { FOLLOW_UPS } from "./follow-ups";
import { requiredQuestions } from "./questions";

const planner = initialState().planner;
const skill = (name: string) => ({ name, required: true, expectedLevel: null, typicalMistake: null });

describe("follow-up questions on a partly filled field", () => {
  it("names what the user gave and how many more are needed", () => {
    const two = withField(completeDraft(), "technicalSkills", [skill("HubSpot"), skill("LinkedIn Sales Navigator")]);
    expect(requiredQuestions(["technicalSkills"], two, planner).questions).toEqual([
      "Ho **HubSpot** e **LinkedIn Sales Navigator**: me ne serve almeno un'altra.",
    ]);
    const one = withField(completeDraft(), "technicalSkills", [skill("HubSpot")]);
    expect(requiredQuestions(["technicalSkills"], one, planner).questions).toEqual(["Ho **HubSpot**: me ne servono almeno altre 2."]);
  });

  it("activities: more items, or which ones are critical", () => {
    const few = withField(completeDraft(), "activities", [{ text: "Fare cold call", critical: true }]);
    expect(requiredQuestions(["activities"], few, planner).questions).toEqual([
      `Ho **Fare cold call**: me ne servono almeno altre 2. ${FOLLOW_UPS.criticalActivities}`,
    ]);
    const noCritical = withField(completeDraft(), "activities", ["A", "B", "C"].map((text) => ({ text, critical: false })));
    expect(requiredQuestions(["activities"], noCritical, planner).questions).toEqual([FOLLOW_UPS.criticalActivities]);
  });

  it("team: only the missing part", () => {
    const noSize = withField(emptyDraft(), "team", { size: null, reportsTo: "CEO", departments: [] });
    expect(requiredQuestions(["team"], noSize, planner).questions).toEqual([FOLLOW_UPS.teamSize]);
    const empty = withField(emptyDraft(), "team", { size: null, reportsTo: null, departments: ["Sales"] });
    expect(requiredQuestions(["team"], empty, planner).questions).toEqual([FOLLOW_UPS.teamBoth]);
  });
});
