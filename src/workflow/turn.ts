import { createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";
import type { Usage } from "@/agents/usage";
import type { SessionState } from "./state";
import { createTurnSteps } from "./steps";
import type { TurnContext, TurnDeps, TurnInput, TurnOutcome } from "./turn-context";

const Context = z.custom<TurnContext>();

/**
 * One workflow run per user message: it runs one turn and ends. No suspend/resume:
 * the conversation state lives in our tables and is passed in and out.
 * The posting is rendered afterwards (src/server/render-service.ts), so the reply does not wait for it.
 */
export function createTurnWorkflow(deps: TurnDeps) {
  const steps = createTurnSteps(deps);
  return createWorkflow({ id: "jd-turn", inputSchema: Context, outputSchema: Context })
    .then(steps.quickReply)
    .then(steps.understand)
    .then(steps.merge)
    .then(steps.plan)
    .then(steps.compose)
    .commit();
}

export type TurnWorkflow = ReturnType<typeof createTurnWorkflow>;

/** Carries the usage of the steps that completed, so tokens spent before the failure still count. */
export class TurnFailedError extends Error {
  constructor(
    readonly usage: Usage[],
    options: { cause: unknown },
  ) {
    super("Turn workflow did not complete", options);
  }
}

/** Usage accumulates through the context, so the longest list among completed steps is the total so far. */
function completedUsage(steps: Record<string, { status: string; output?: unknown }>): Usage[] {
  return Object.values(steps)
    .flatMap((step) => (step.status === "success" ? [(step.output as TurnContext | undefined)?.usage ?? []] : []))
    .reduce<Usage[]>((longest, usage) => (usage.length > longest.length ? usage : longest), []);
}

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
    throw new TurnFailedError(completedUsage(result.steps), { cause });
  }
  return { state: result.result.state, message: result.result.message, usage: result.result.usage };
}
