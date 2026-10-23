import type { Draft } from "../draft";
import { FIELD_IDS, type FieldId } from "../fields";
import { findDiscrimination } from "./discrimination";
import { collectStrings, type Issue } from "./issues";
import { ruleIssues } from "./rules";
import { findSalaryMention } from "./salary";

export type { Issue, IssueCode, IssueSeverity } from "./issues";

/** Off until the regex checker is reliable enough (docs/decisioni.md). */
export const DISCRIMINATION_CHECK_ENABLED = false;

export type ValidationOptions = { discriminationCheck: boolean };

const DEFAULT_OPTIONS: ValidationOptions = { discriminationCheck: DISCRIMINATION_CHECK_ENABLED };

function contentIssues(field: FieldId, value: unknown, options: ValidationOptions): Issue[] {
  return collectStrings(value).flatMap((text) => {
    const matches = options.discriminationCheck ? findDiscrimination(text) : [];
    const issues: Issue[] = matches.map(({ category, match }) => ({
      field,
      code: "discriminatoryContent",
      severity: "blocking",
      detail: `${category}: ${match}`,
    }));
    const salary = field === "salary" ? null : findSalaryMention(text);
    if (salary) issues.push({ field, code: "salaryInText", severity: "blocking", detail: salary });
    return issues;
  });
}

export function validateDraft(draft: Draft, options: ValidationOptions = DEFAULT_OPTIONS): Issue[] {
  const content = FIELD_IDS.flatMap((field) => contentIssues(field, draft[field].value, options));
  return [...content, ...ruleIssues(draft)];
}

export function blockingFields(issues: Issue[]): Set<FieldId> {
  return new Set(issues.filter((issue) => issue.severity === "blocking").map((issue) => issue.field));
}
