import { findJobTitle } from "@/domain/catalog";
import type { Draft } from "@/domain/draft";
import { bold, type MessageParts } from "./format";

function jobTitleName(id: string): string {
  return findJobTitle(id)?.name ?? id;
}

/** The activities are all another catalog role's (docs/decisioni.md): the agent proposes to switch, the user decides. */
export function roleSwitchMessage(draft: Draft, suggestedId: string): MessageParts {
  const value = draft.jobTitle.value;
  const current = value?.kind === "catalog" ? jobTitleName(value.id) : null;
  const suggested = jobTitleName(suggestedId);
  const keep = current ? `Resto su ${current}` : "Resto così";
  const versus = current ? ` che un ${bold(current)}` : "";
  return {
    text: `Quello che descrivi sembra più un ${bold(suggested)}${versus}. Vuoi cambiare ruolo?`,
    questions: [],
    replies: [
      { label: `Passa a ${suggested}`, action: { kind: "pickRole", jobTitleId: suggestedId } },
      { label: keep, action: { kind: "keepRole", declinedId: suggestedId } },
    ],
  };
}
