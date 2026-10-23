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
  const quickReply = createStep({
    id: "quick-reply",
    ...io,
    execute: async ({ inputData: ctx }) => {
      if (ctx.input.kind !== "quickReply") return ctx;
      const { state, focus } = applyQuickReply(ctx.state, ctx.input.action);
      return { ...ctx, state, focus };
    },
  });

  /**
   * Guard, extractor and diagnosis run in parallel, the diagnosis only while the job title is missing.
   * A blocked message gets the fixed reply; the tokens of the discarded extraction still count.
   */
  const understand = createStep({
    id: "understand",
    ...io,
    execute: async ({ inputData: ctx, bail }) => {
      if (ctx.input.kind !== "message") return ctx;
      const message = ctx.input.text;
      const diagnose = ctx.state.draft.jobTitle.status === "missing";
      const [verdict, extraction, diagnosis] = await Promise.all([
        deps.checkMessage(message),
        deps.extract({
          message,
          draft: ctx.state.draft,
          askedFields: ctx.state.planner.askedFields,
          lastAskFields: repeatedAsks(ctx.state.planner, ctx.state.draft),
        }),
        diagnose ? deps.diagnose({ message }) : null,
      ]);
      const usage = [...ctx.usage, guardUsage(deps.guardModel(), message), ...extraction.usage, ...(diagnosis?.usage ?? [])];
      if (!verdict.allowed) {
        const state = { ...ctx.state, quickReplies: [] };
        return bail({ ...ctx, usage, state, message: { text: COPY.blocked, questions: [], quickReplies: [] } });
      }
      return { ...ctx, extraction: extraction.output, diagnosis: diagnosis?.output ?? null, usage };
    },
  });

  const merge = createStep({ id: "merge", ...io, execute: async ({ inputData: ctx }) => mergeTurn(ctx) });

  const plan = createStep({
    id: "plan",
    ...io,
    execute: async ({ inputData: ctx }) => ({ ...ctx, plan: planNext(ctx.state.draft, ctx.state.planner) }),
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

  return { quickReply, understand, merge, plan, compose };
}
