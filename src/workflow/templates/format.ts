import type { ReplyOption } from "../quick-reply-actions";

/** An agent message before quick replies get their ids. */
export type MessageParts = { text: string; questions: string[]; replies: ReplyOption[] };

export function bold(text: string): string {
  return `**${text}**`;
}

/** "A", "A e B", "A, B e C". */
export function joinItalian(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} e ${items.at(-1)}`;
}
