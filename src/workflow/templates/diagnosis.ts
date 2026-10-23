import { findJobTitle } from "@/domain/catalog";
import type { Seniority } from "@/domain/enums";
import type { ReplyOption } from "../quick-reply-actions";
import { roleCandidates, seniorityLabel, shiftSeniority } from "../roles";
import { COPY, ROLE_REPLIES } from "./copy";
import { bold, type MessageParts } from "./format";

function roleReplies(jobTitleId: string, seniority: Seniority): ReplyOption[] {
  const jobTitle = findJobTitle(jobTitleId);
  const replies: ReplyOption[] = [{ label: ROLE_REPLIES.confirm, action: { kind: "confirmRole" } }];
  if (jobTitle && shiftSeniority(jobTitle, seniority, -1)) replies.push({ label: ROLE_REPLIES.junior, action: { kind: "seniorityDown" } });
  if (jobTitle && shiftSeniority(jobTitle, seniority, 1)) replies.push({ label: ROLE_REPLIES.senior, action: { kind: "seniorityUp" } });
  replies.push({ label: ROLE_REPLIES.other, action: { kind: "chooseOtherRole" } });
  return replies;
}

/** The role read from the first message (docs/domande.md, "Primo messaggio"); activities of other roles stay in the JD. */
export function diagnosisMessage(jobTitleId: string, seniority: Seniority): MessageParts {
  const name = findJobTitle(jobTitleId)?.name ?? jobTitleId;
  const text = `Stai cercando un ${bold(name)}, livello ${bold(seniorityLabel(seniority))}. Va bene?`;
  return { text, questions: [], replies: roleReplies(jobTitleId, seniority) };
}

/** After "Scegli un altro ruolo" (roles of the same family), or when no role could be read from the message. */
export function chooseRoleMessage(excludeId: string | null): MessageParts {
  const candidates = excludeId ? roleCandidates(excludeId) : [];
  if (candidates.length === 0) return { text: COPY.describeRole, questions: [], replies: [] };
  const replies: ReplyOption[] = candidates.map((jobTitle) => ({ label: jobTitle.name, action: { kind: "pickRole", jobTitleId: jobTitle.id } }));
  return { text: COPY.chooseRole, questions: [], replies };
}
