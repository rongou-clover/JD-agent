import { createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";
import type { SessionState } from "./state";
import { createTurnSteps } from "./steps";
import type { TurnContext, TurnDeps, TurnInput, TurnOutcome } from "./turn-context";

const Context = z.custom<TurnContext>();

/**
 * One workflow run per user message: it runs one turn and ends. No suspend/resume:
 * the conversation state lives in our tables and is passed in and out.
 */
export function createTurnWorkflow(deps: TurnDeps) {
  const steps = createTurnSteps(deps);
  return createWorkflow({ id: "jd-turn", inputSchema: Context, outputSchema: Context })
    .then(steps.guard)
    .then(steps.quickReply)
    .then(steps.understand)
    .then(steps.merge)
    .then(steps.plan)
    .then(steps.render)
    .then(steps.compose)
    .commit();
}

export type TurnWorkflow = ReturnType<typeof createTurnWorkflow>;

export class TurnFailedError extends Error {}

export async function runTurn(workflow: TurnWorkflow, input: TurnInput, state: SessionState): Promise<TurnOutcome> {
  const initial: TurnContext = {
    input,
    state,
    usage: [],
    notes: [],
    focus: "plan",
    extraction: null,
    diagnosis: null,
    plan: null,
    message: null,
  };
  const run = await workflow.createRun();
  const result = await run.start({ inputData: initial });
  if (result.status !== "success" || !result.result.message) {
    const cause = result.status === "failed" ? result.error : result.status;
    throw new TurnFailedError("Turn workflow did not complete", { cause });
  }
  return { state: result.result.state, message: result.result.message, usage: result.result.usage };
}
