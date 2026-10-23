import { createStep } from "@mastra/core/workflows";
import { z } from "zod";
import type { Usage } from "@/agents/usage";
import { planNext } from "@/domain/planner";
import { applyQuickReply } from "./apply-quick-reply";
import { composeMessage } from "./compose";
import { mergeTurn } from "./merge-turn";
import { repeatedAsks } from "./skipped";
import { COPY } from "./templates/copy";
import type { TurnContext, TurnDeps } from "./turn-context";

/** Steps pass the whole context along; it is typed in code, so the schema does not re-validate it. */
const Context = z.custom<TurnContext>();
const io = { inputSchema: Context, outputSchema: Context };

/**
 * The guard reports no tokens. Estimate: its prompt is about 400 tokens plus the message at about
 * 4 characters per token; the verdict is about 150 output tokens. Counted as fast-model usage.
 */
export function guardUsage(model: string, message: string): Usage {
  return { model, inputTokens: Math.ceil(message.length / 4) + 400, outputTokens: 150 };
}

export function createTurnSteps(deps: TurnDeps) {
  const guard = createStep({
    id: "guard",
    ...io,
    execute: async ({ inputData: ctx, bail }) => {
      if (ctx.input.kind !== "message") return ctx;
      const usage = [...ctx.usage, guardUsage(deps.guardModel(), ctx.input.text)];
      const verdict = await deps.checkMessage(ctx.input.text);
      if (verdict.allowed) return { ...ctx, usage };
      const state = { ...ctx.state, quickReplies: [] };
      return bail({ ...ctx, usage, state, message: { text: COPY.blocked, questions: [], quickReplies: [] } });
    },
  });

  const quickReply = createStep({
    id: "quick-reply",
    ...io,
    execute: async ({ inputData: ctx }) => {
      if (ctx.input.kind !== "quickReply") return ctx;
      const { state, focus } = applyQuickReply(ctx.state, ctx.input.action);
      return { ...ctx, state, focus };
    },
  });

  /** The job title is picked in Home: only the extractor reads the message. */
  const understand = createStep({
    id: "understand",
    ...io,
    execute: async ({ inputData: ctx }) => {
      if (ctx.input.kind !== "message") return ctx;
      const extraction = await deps.extract({
        message: ctx.input.text,
        draft: ctx.state.draft,
        askedFields: ctx.state.planner.askedFields,
        lastAskFields: repeatedAsks(ctx.state.planner, ctx.state.draft),
      });
      return { ...ctx, extraction: extraction.output, usage: [...ctx.usage, ...extraction.usage] };
    },
  });

  const merge = createStep({ id: "merge", ...io, execute: async ({ inputData: ctx }) => mergeTurn(ctx) });

  const plan = createStep({
    id: "plan",
    ...io,
    execute: async ({ inputData: ctx }) => ({ ...ctx, plan: planNext(ctx.state.draft, ctx.state.planner) }),
  });

  const render = createStep({
    id: "render",
    ...io,
    execute: async ({ inputData: ctx }) => {
      const { draft, forcedWordings, sectionCache } = ctx.state;
      const result = await deps.render({ draft, forcedWordings }, sectionCache);
      const { posting, sheet, cache } = result.output;
      return { ...ctx, state: { ...ctx.state, posting, sheet, sectionCache: cache }, usage: [...ctx.usage, ...result.usage] };
    },
  });

  const compose = createStep({
    id: "compose",
    ...io,
    execute: async ({ inputData: ctx }) => {
      const nextPlan = ctx.plan ?? planNext(ctx.state.draft, ctx.state.planner);
      const { state, message } = composeMessage(ctx, nextPlan, deps.newReplyId);
      return { ...ctx, state, message };
    },
  });

  return { guard, quickReply, understand, merge, plan, render, compose };
}
