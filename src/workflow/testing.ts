import { EXTRACTED_FIELD_IDS, ExtractorOutput } from "@/agents/extractor/schema";
import type { Diagnosis } from "@/domain/diagnosis";
import type { Draft } from "@/domain/draft";
import type { FieldId } from "@/domain/fields";
import type { Render } from "@/render/contract";
import { initialState, type SessionState } from "./state";
import { createTurnWorkflow, runTurn } from "./turn";
import type { TurnDeps } from "./turn-context";

export const FAST = "test/fast";
export const WRITER = "test/writer";

type ExtractionPatch = Partial<Omit<ExtractorOutput, "updates">> & { updates?: Partial<ExtractorOutput["updates"]> };

/** Test helper: an extractor answer with the given fields, everything else empty. */
export function extraction(patch: ExtractionPatch = {}): ExtractorOutput {
  const empty = Object.fromEntries(EXTRACTED_FIELD_IDS.map((id) => [id, null]));
  return ExtractorOutput.parse({
    intent: "answer",
    skipped: [],
    forcedWording: null,
    discriminationFlags: [],
    ...patch,
    updates: { ...empty, ...patch.updates },
  });
}

/** Renders the title only, so tests can see which draft reached the renderer. */
export const fakeRender: Render = async (input, cache) => ({
  output: {
    posting: { title: input.draft.companyName.value ?? "JD", summary: [], sections: [] },
    sheet: {
      jobTitle: "",
      seniority: null,
      inCatalog: true,
      hybridRoles: null,
      skills: [],
      softSkills: [],
      prerequisites: [],
      salary: null,
      managerNotes: null,
      recommendedDimensions: [],
    },
    cache,
  },
  usage: [{ model: WRITER, inputTokens: 100, outputTokens: 50 }],
});

export type FakeOptions = {
  allowed?: boolean;
  extraction?: ExtractorOutput;
  diagnosis?: Diagnosis;
};

/** Fake agents and renderer; `calls` records which ones ran. */
export function fakeDeps(options: FakeOptions = {}) {
  const calls = { guard: 0, extract: 0, diagnose: 0, render: 0 };
  let replyId = 0;
  const deps: TurnDeps = {
    checkMessage: async () => {
      calls.guard++;
      return options.allowed === false ? { allowed: false, reason: "injection" } : { allowed: true };
    },
    extract: async () => {
      calls.extract++;
      return { output: options.extraction ?? extraction(), usage: [{ model: FAST, inputTokens: 10, outputTokens: 5 }] };
    },
    diagnose: async () => {
      calls.diagnose++;
      const output = options.diagnosis ?? { kind: "outOfCatalog", title: "" };
      return { output, usage: [{ model: FAST, inputTokens: 20, outputTokens: 8 }] };
    },
    render: async (input, cache) => {
      calls.render++;
      return fakeRender(input, cache);
    },
    guardModel: () => FAST,
    newReplyId: () => `r${++replyId}`,
  };
  return { deps, calls };
}

/** Test helper: a session with the given draft, as if the last agent message asked `askedFields`. */
export function session(draft: Draft, askedFields: FieldId[], planner: Partial<SessionState["planner"]> = {}): SessionState {
  const base = initialState();
  return { ...base, draft, planner: { ...base.planner, askedFields, ...planner } };
}

/** Test helper: one user message through the turn workflow, with the given extractor answer. */
export async function messageTurn(state: SessionState, found = extraction(), text = "Non lo so") {
  const { deps } = fakeDeps({ extraction: found });
  return runTurn(createTurnWorkflow(deps), { kind: "message", text }, state);
}
