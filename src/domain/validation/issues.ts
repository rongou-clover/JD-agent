import type { FieldId } from "../fields";

export const ISSUE_CODES = [
  "discriminatoryContent",
  "salaryInText",
  "tooFewItems",
  "tooManyItems",
  "tooFewSentences",
  "tooManySentences",
  "criticalActivitiesOutOfRange",
  "incomplete",
  "unknownJobTitle",
  "seniorityNotAllowed",
  "expectedLevelOutOfCatalog",
  "salaryRangeInverted",
] as const;

export type IssueCode = (typeof ISSUE_CODES)[number];

/** blocking: the field does not count as done. warning: renderer must fix it, field still counts. */
export type IssueSeverity = "blocking" | "warning";

export type Issue = {
  field: FieldId;
  code: IssueCode;
  severity: IssueSeverity;
  /** The offending text or the missing part, for the agent's reply. */
  detail?: string;
};

/** Every string inside a field value, at any depth. */
export function collectStrings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(collectStrings);
  if (value !== null && typeof value === "object") return Object.values(value).flatMap(collectStrings);
  return [];
}
