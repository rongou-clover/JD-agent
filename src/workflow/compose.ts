import type { AgentMessage } from "@/api/contract";
import type { FieldId } from "@/domain/fields";
import { missingRequiredFields, type Plan } from "@/domain/planner";
import type { StoredQuickReply } from "./quick-reply-actions";
import type { SessionState } from "./state";
import { COPY } from "./templates/copy";
import { fieldLabels, type MessageParts } from "./templates/format";
import { optionalMessage } from "./templates/optional";
import { requiredQuestions } from "./templates/questions";
import { roleSwitchMessage } from "./templates/role-switch";
import type { TurnContext } from "./turn-context";

type Body = { parts: MessageParts; askedFields: FieldId[]; optionalOffered: boolean };

const body = (parts: MessageParts, askedFields: FieldId[] = [], optionalOffered = false): Body => ({
  parts,
  askedFields,
  optionalOffered,
});

/** Optional and done plans come only when the missing required fields were all skipped: the message lists them. */
function planBody(plan: Plan, state: SessionState, hasNotes: boolean): Body {
  const missing = missingRequiredFields(state.draft);
  switch (plan.kind) {
    case "required": {
      const { questions, replies } = requiredQuestions(plan.fields, state.draft, state.planner);
      const lead = hasNotes ? "" : COPY.updatedOne;
      return body({ text: lead, questions, replies }, plan.fields);
    }
    case "optional": {
      const parts = optionalMessage(plan.fields);
      const text = missing.length > 0 ? `${COPY.stillMissing(fieldLabels(missing))}\n\n${parts.text}` : parts.text;
      return body({ ...parts, text }, plan.fields, true);
    }
    case "done": {
      const text = missing.length > 0 ? COPY.doneWithMissing(fieldLabels(missing)) : COPY.done;
      return body({ text, questions: [], replies: [] });
    }
  }
}

function messageBody(ctx: TurnContext, plan: Plan): Body {
  const { state, focus } = ctx;
  if (focus === "roleSwitch" && ctx.suggestedRole) return body(roleSwitchMessage(state.draft, ctx.suggestedRole));
  if (focus === "completeAnyway") {
    const missing = missingRequiredFields(state.draft);
    if (missing.length > 0) return body({ text: COPY.completeAnyway(fieldLabels(missing)), questions: [], replies: [] });
  }
  return planBody(plan, state, ctx.notes.length > 0);
}

/** Builds the agent message from templates and stores what it asked and its quick replies on the session. */
export function composeMessage(
  ctx: TurnContext,
  plan: Plan,
  newReplyId: () => string,
): { state: SessionState; message: AgentMessage } {
  const { parts, askedFields, optionalOffered } = messageBody(ctx, plan);
  const quickReplies: StoredQuickReply[] = parts.replies.map((reply) => ({ id: newReplyId(), ...reply }));
  const message: AgentMessage = {
    text: [...ctx.notes, parts.text].filter((line) => line.length > 0).join("\n\n"),
    questions: parts.questions,
    quickReplies: quickReplies.map(({ id, label }) => ({ id, label })),
  };
  const missing = missingRequiredFields(ctx.state.draft);
  const planner = {
    ...ctx.state.planner,
    askedFields,
    previousAskedFields: ctx.state.planner.askedFields,
    optionalOffered: ctx.state.planner.optionalOffered || optionalOffered,
    // A skipped field the user filled later leaves the list.
    skipped: ctx.state.planner.skipped.filter((field) => missing.includes(field)),
  };
  return { state: { ...ctx.state, planner, quickReplies }, message };
}
