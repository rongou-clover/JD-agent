import { findJobTitle } from "@/domain/catalog";
import type { Diagnosis } from "@/domain/diagnosis";
import type { Seniority } from "@/domain/enums";
import type { ReplyOption } from "../quick-reply-actions";
import { roleCandidates, seniorityLabel, shiftSeniority } from "../roles";
import { COPY, ROLE_REPLIES } from "./copy";
import { bold, joinItalian, type MessageParts } from "./format";

type CatalogDiagnosis = Extract<Diagnosis, { kind: "catalog" }>;

function jobTitleName(id: string): string {
  return findJobTitle(id)?.name ?? id;
}

function roleReplies(jobTitleId: string, seniority: Seniority): ReplyOption[] {
  const jobTitle = findJobTitle(jobTitleId);
  const replies: ReplyOption[] = [{ label: ROLE_REPLIES.confirm, action: { kind: "confirmRole" } }];
  if (jobTitle && shiftSeniority(jobTitle, seniority, -1))
    replies.push({ label: ROLE_REPLIES.junior, action: { kind: "seniorityDown" } });
  if (jobTitle && shiftSeniority(jobTitle, seniority, 1))
    replies.push({ label: ROLE_REPLIES.senior, action: { kind: "seniorityUp" } });
  replies.push({ label: ROLE_REPLIES.other, action: { kind: "chooseOtherRole" } });
  return replies;
}

/** The role proposal (docs/domande.md, "Primo messaggio"): single role, role with others' activities, hybrid. */
export function diagnosisMessage(diagnosis: CatalogDiagnosis, seniority: Seniority): MessageParts {
  const main = jobTitleName(diagnosis.jobTitleId);
  const others = diagnosis.otherRoles.map((role) => jobTitleName(role.jobTitleId));
  const proposal = `Stai cercando un ${bold(main)}, livello ${bold(seniorityLabel(seniority))}.`;
  let text: string;
  if (diagnosis.hybrid) {
    text = `Stai descrivendo più ruoli in uno: ${[main, ...others].join(", ")}. Profili così sono difficili da trovare: ti consiglio ${bold(main)}, perché copre le attività più importanti. Va bene?`;
  } else if (others.length > 0) {
    text = `${proposal} Vedo anche attività da ${joinItalian(others.map(bold))}: le tengo come parte del ruolo. Va bene?`;
  } else {
    text = `${proposal} Va bene?`;
  }
  return { text, questions: [], replies: roleReplies(diagnosis.jobTitleId, seniority) };
}

/** After "Scegli un altro ruolo", or when no role could be diagnosed. */
export function chooseRoleMessage(diagnosis: Diagnosis | null, excludeId: string | null): MessageParts {
  const candidates = roleCandidates(diagnosis, excludeId);
  if (candidates.length === 0) return { text: COPY.describeRole, questions: [], replies: [] };
  const replies: ReplyOption[] = candidates.map((jobTitle) => ({
    label: jobTitle.name,
    action: { kind: "pickRole", jobTitleId: jobTitle.id },
  }));
  return { text: COPY.chooseRole, questions: [], replies };
}
