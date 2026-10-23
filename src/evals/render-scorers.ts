import type { Usage } from "@/agents/usage";
import { buildChecklist } from "@/domain/checklist";
import type { Draft } from "@/domain/draft";
import type { FieldId } from "@/domain/fields";
import { findSalaryMention } from "@/domain/validation/salary";
import type { ForcedWording, Posting, PostingSection } from "@/render/contract";
import { SUMMARY_LABELS } from "@/render/copy";
import { isMissing } from "@/render/draft-values";
import { blockTexts, countWords } from "@/render/guard";
import { SECTION_SPECS, type ProseSection } from "@/render/sections";
import type { ScoreResult } from "./scorers";

/** Target length of a complete posting (docs/template-output.md). */
export const WORD_RANGE = { min: 500, max: 700 } as const;

/** Writer model prices in $ per million tokens (Sonnet 5.5, 2026-10-23). */
const PRICE = { input: 2, output: 10 } as const;

const score = (failures: string[]): ScoreResult => ({ score: failures.length === 0 ? 1 : 0, failures });

const sectionText = (section: PostingSection) => blockTexts(section.blocks).join(" ");

function salaryFigures(draft: Draft): string[] {
  const salary = draft.salary.value;
  if (!salary) return [];
  return [salary.min, salary.max].flatMap((n) => [String(n), n.toLocaleString("it-IT", { useGrouping: "always" }), `${n / 1000}k`]);
}

/** No salary mention in any section: salary figures live only in the summary box. */
export function scoreSalary(posting: Posting, draft: Draft): ScoreResult {
  const figures = salaryFigures(draft);
  return score(
    posting.sections.flatMap((section) => {
      const text = sectionText(section);
      const mention = findSalaryMention(text) ?? figures.find((figure) => text.includes(figure));
      return mention ? [`${section.id}: ${mention}`] : [];
    }),
  );
}

const SUMMARY_FIELDS: Record<string, FieldId> = {
  [SUMMARY_LABELS.company]: "companyName",
  [SUMMARY_LABELS.city]: "location",
  [SUMMARY_LABELS.mode]: "location",
  [SUMMARY_LABELS.contract]: "contract",
  [SUMMARY_LABELS.seniority]: "seniority",
  [SUMMARY_LABELS.reportsTo]: "team",
};

const isProse = (id: string): id is ProseSection => id in SECTION_SPECS;

/** A placeholder is allowed only where a required field is missing; anything else is a guard fallback. */
export function scorePlaceholders(posting: Posting, draft: Draft): ScoreResult {
  const sections = posting.sections.flatMap((section) => {
    if (!section.blocks.some((block) => block.kind === "placeholder")) return [];
    const required = isProse(section.id) ? SECTION_SPECS[section.id].required : [];
    return required.some((field) => isMissing(draft, field)) ? [] : [`section ${section.id}`];
  });
  const rows = posting.summary.flatMap((row) => {
    const field = SUMMARY_FIELDS[row.label];
    return row.value === null && !(field && isMissing(draft, field)) ? [`summary ${row.label}`] : [];
  });
  return score([...sections, ...rows]);
}

export function scoreForcedWordings(posting: Posting, forcedWordings: ForcedWording[]): ScoreResult {
  return score(
    forcedWordings.flatMap(({ section, text }) => {
      const found = posting.sections.find((s) => s.id === section);
      return found && sectionText(found).includes(text) ? [] : [`${section}: missing forced wording`];
    }),
  );
}

/** Words a candidate reads: summary values and section texts (headings excluded). */
export function postingWords(posting: Posting): number {
  const summary = posting.summary.map((row) => row.value ?? "").join(" ");
  return countWords([summary, ...posting.sections.map(sectionText)].join(" "));
}

/** Checked only when the checklist is complete. */
export function scoreLength(posting: Posting, draft: Draft): ScoreResult {
  if (!buildChecklist(draft).complete) return score([]);
  const words = postingWords(posting);
  return score(words < WORD_RANGE.min || words > WORD_RANGE.max ? [`${words} words`] : []);
}

export function costUsd(usage: Usage[]): number {
  return usage.reduce((sum, u) => sum + (u.inputTokens * PRICE.input + u.outputTokens * PRICE.output) / 1_000_000, 0);
}
