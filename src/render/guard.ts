import { DISCRIMINATION_CHECK_ENABLED } from "@/domain/validation";
import { findDiscrimination } from "@/domain/validation/discrimination";
import { findSalaryMention } from "@/domain/validation/salary";
import type { PostingBlock } from "./contract";
import type { Bounds } from "./sections";

/** A block the writer can produce: placeholders are decided in code, never by the model. */
export type WrittenBlock = Exclude<PostingBlock, { kind: "placeholder" }>;

export const GUARD_CODES = [
  "forcedWordingMissing",
  "salary",
  "markup",
  "emoji",
  "discrimination",
  "bulletsNotAllowed",
  "tooManyBullets",
  "tooShort",
  "tooLong",
] as const;
export type GuardCode = (typeof GUARD_CODES)[number];
export type GuardFailure = { code: GuardCode; detail: string };

/** Square brackets, markdown headings, bold or code marks, HTML tags, a list marker opening a text. */
const MARKUP: RegExp[] = [/[[\]]/, /^#{1,6}\s|\s#{1,6}\s/, /\*\*|__|`/, /<\/?[a-z][^>]*>/i, /^(?:[-*•]|\d+[.)])\s/];
const EMOJI = /\p{Extended_Pictographic}/u;

const normalize = (text: string) => text.replace(/\s+/g, " ").trim();
export const countWords = (text: string) => normalize(text).split(" ").filter((word) => word.length > 0).length;

export function blockTexts(blocks: readonly PostingBlock[]): string[] {
  return blocks.flatMap((block) => {
    if (block.kind === "paragraph") return [block.text];
    if (block.kind === "bullets") return block.items;
    return [];
  });
}

function contentFailure(text: string): GuardFailure | null {
  const salary = findSalaryMention(text);
  if (salary) return { code: "salary", detail: salary };
  const markup = MARKUP.map((pattern) => pattern.exec(text)).find((found) => found !== null);
  if (markup) return { code: "markup", detail: markup[0] };
  const emoji = EMOJI.exec(text);
  if (emoji) return { code: "emoji", detail: emoji[0] };
  const discrimination = DISCRIMINATION_CHECK_ENABLED ? findDiscrimination(text)[0] : undefined;
  return discrimination ? { code: "discrimination", detail: discrimination.match } : null;
}

function shapeFailure(blocks: readonly WrittenBlock[], bounds: Bounds, words: number, forcedWords: number): GuardFailure | null {
  const bullets = blocks.flatMap((block) => (block.kind === "bullets" ? block.items : []));
  if (bounds.maxBullets === 0 && bullets.length > 0) return { code: "bulletsNotAllowed", detail: `${bullets.length} bullets` };
  if (bullets.length > bounds.maxBullets) return { code: "tooManyBullets", detail: `${bullets.length} > ${bounds.maxBullets}` };
  if (words < bounds.minWords) return { code: "tooShort", detail: `${words} < ${bounds.minWords} words` };
  // A forced wording is the user's text: it never counts against the length limit.
  const max = bounds.maxWords + forcedWords;
  return words > max ? { code: "tooLong", detail: `${words} > ${max} words` } : null;
}

/**
 * Checks one written section; null when it can be published.
 * The forced wording must appear verbatim and is exempt from the content checks: the user's text wins.
 */
export function checkSection(blocks: readonly WrittenBlock[], bounds: Bounds, forcedWording: string | null): GuardFailure | null {
  const texts = blockTexts(blocks).map(normalize);
  const forced = forcedWording ? normalize(forcedWording) : null;
  if (forced && !texts.join(" ").includes(forced)) return { code: "forcedWordingMissing", detail: forced };
  const content = texts
    .map((text) => (forced ? text.split(forced).join(" ") : text))
    .map(contentFailure)
    .find((failure) => failure !== null);
  if (content) return content;
  return shapeFailure(blocks, bounds, countWords(texts.join(" ")), forced ? countWords(forced) : 0);
}
