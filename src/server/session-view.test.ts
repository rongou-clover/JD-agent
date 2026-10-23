import { describe, expect, it } from "vitest";
import { SessionView } from "@/api/contract";
import type { InternalSheet } from "@/render/contract";
import { initialState } from "@/workflow/state";
import { toSessionView } from "./session-view";

const SESSION_ID = "11111111-1111-4111-8111-111111111111";

const sheet: InternalSheet = {
  jobTitle: "Account Executive",
  seniority: "S2",
  inCatalog: true,
  hybridRoles: null,
  skills: [{ name: "Negoziare", type: "hard", criticality: "critica", expectedLevel: "P3", required: true, source: "draft" }],
  softSkills: ["Iniziativa"],
  prerequisites: [],
  salary: { min: 40000, max: 48000, inPosting: false },
  managerNotes: null,
  recommendedDimensions: [],
};

describe("toSessionView", () => {
  it("has a null sheet before the first render", () => {
    const view = toSessionView(SESSION_ID, initialState(), [], false);
    expect(view.sheet).toBeNull();
    expect(() => SessionView.parse(view)).not.toThrow();
  });

  it("includes the rendered sheet", () => {
    const view = toSessionView(SESSION_ID, { ...initialState(), sheet }, [], false);
    expect(view.sheet).toEqual(sheet);
    expect(() => SessionView.parse(view)).not.toThrow();
  });

  it("rebuilds the sheet of a session rendered before sheets were stored", () => {
    const posting = { title: "SDR", summary: [], sections: [{ id: "role" as const, heading: "Il ruolo", blocks: [{ kind: "placeholder" as const }] }] };
    const view = toSessionView(SESSION_ID, { ...initialState(), posting }, [], false);
    expect(view.sheet).not.toBeNull();
    expect(() => SessionView.parse(view)).not.toThrow();
  });
});
