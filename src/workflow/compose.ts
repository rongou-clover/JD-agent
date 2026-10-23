import type { AgentMessage } from "@/api/contract";
import { FIELDS, type FieldId } from "@/domain/fields";
import { missingRequiredFields, type Plan } from "@/domain/planner";
import type { StoredQuickReply } from "./quick-reply-actions";
import type { SessionState } from "./state";
import { COPY } from "./templates/copy";
import { chooseRoleMessage, diagnosisMessage } from "./templates/diagnosis";
import { bold, joinItalian, type MessageParts } from "./templates/format";
import { optionalMessage } from "./templates/optional";
import { requiredQuestions } from "./templates/questions";
import type { TurnContext } from "./turn-context";

type Body = { parts: MessageParts; askedFields: FieldId[]; optionalOffered: boolean };

const body = (parts: MessageParts, askedFields: FieldId[] = [], optionalOffered = false): Body => ({
  parts,
  askedFields,
  optionalOffered,
});

function planBody(plan: Plan, state: SessionState, hasNotes: boolean): Body {
  switch (plan.kind) {
    case "diagnosis": {
      const rejected = state.diagnosis?.kind === "catalog" ? state.diagnosis.jobTitleId : null;
      return body(chooseRoleMessage(state.diagnosis, rejected), ["jobTitle"]);
    }
    case "required": {
      const { questions, replies } = requiredQuestions(plan.fields, state.draft, state.planner);
      const lead = hasNotes ? "" : questions.length > 1 ? COPY.updatedTwo : COPY.updatedOne;
      return body({ text: lead, questions, replies }, plan.fields);
    }
    case "optional":
      return body(optionalMessage(plan.fields), plan.fields, true);
    case "done":
      return body({ text: COPY.done, questions: [], replies: [] });
  }
}

function messageBody(ctx: TurnContext, plan: Plan): Body {
  const { state, focus } = ctx;
  const seniority = state.draft.seniority.value;
  if (focus === "diagnosis" && state.diagnosis?.kind === "catalog" && seniority !== null) {
    return body(diagnosisMessage(state.diagnosis, seniority), ["jobTitle", "seniority"]);
  }
  if (focus === "completeAnyway") {
    const missing = missingRequiredFields(state.draft);
    if (missing.length > 0) {
      const labels = joinItalian(missing.map((field) => bold(FIELDS[field].label)));
      return body({ text: COPY.completeAnyway(labels), questions: [], replies: [] });
    }
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
  const planner = {
    ...ctx.state.planner,
    askedFields,
    optionalOffered: ctx.state.planner.optionalOffered || optionalOffered,
  };
  return { state: { ...ctx.state, planner, quickReplies }, message };
}
