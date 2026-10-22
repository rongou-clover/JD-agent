import { findJobTitle, isSeniorityAllowed } from "../catalog";
import type { Draft } from "../draft";
import type { FieldId } from "../fields";
import type { Issue } from "./issues";

type Bounds = { min: number; max: number | null };

/** List sizes from docs/schema-bozza.md: fewer than min blocks, more than max warns. */
const LIST_BOUNDS = {
  activities: { min: 3, max: 8 },
  kpis: { min: 0, max: 5 },
  sixMonthResults: { min: 2, max: 3 },
  technicalSkills: { min: 3, max: null },
  softSkills: { min: 1, max: 4 },
  prerequisites: { min: 0, max: 5 },
} as const satisfies Partial<Record<FieldId, Bounds>>;

const SENTENCE_BOUNDS = {
  companyDescription: { min: 1, max: 4 },
  missionValues: { min: 1, max: 3 },
} as const satisfies Partial<Record<FieldId, Bounds>>;

const ROLE_MISSION_SENTENCES: Bounds = { min: 1, max: 2 };
const CRITICAL_ACTIVITIES = { min: 2, max: 3 } as const;

export function countSentences(text: string): number {
  return text.split(/[.!?]+(?:\s|$)/).filter((part) => part.trim().length > 0).length;
}

function checkCount(field: FieldId, count: number, bounds: Bounds, unit: "items" | "sentences"): Issue[] {
  const tooFew = unit === "items" ? "tooFewItems" : "tooFewSentences";
  const tooMany = unit === "items" ? "tooManyItems" : "tooManySentences";
  if (count < bounds.min) return [{ field, code: tooFew, severity: "blocking", detail: `${count}/${bounds.min}` }];
  if (bounds.max !== null && count > bounds.max)
    return [{ field, code: tooMany, severity: "warning", detail: `${count}/${bounds.max}` }];
  return [];
}

function incomplete(field: FieldId, detail: string): Issue {
  return { field, code: "incomplete", severity: "blocking", detail };
}

function listIssues(draft: Draft): Issue[] {
  return (Object.keys(LIST_BOUNDS) as (keyof typeof LIST_BOUNDS)[]).flatMap((field) => {
    const value = draft[field].value;
    return value === null ? [] : checkCount(field, value.length, LIST_BOUNDS[field], "items");
  });
}

function textIssues(draft: Draft): Issue[] {
  const issues = (Object.keys(SENTENCE_BOUNDS) as (keyof typeof SENTENCE_BOUNDS)[]).flatMap((field) => {
    const value = draft[field].value;
    return value === null ? [] : checkCount(field, countSentences(value), SENTENCE_BOUNDS[field], "sentences");
  });
  const roleMission = draft.roleMission.value;
  if (roleMission) {
    issues.push(...checkCount("roleMission", countSentences(roleMission.text), ROLE_MISSION_SENTENCES, "sentences"));
  }
  return issues;
}

function activityIssues(draft: Draft): Issue[] {
  const activities = draft.activities.value;
  if (activities === null) return [];
  const critical = activities.filter((activity) => activity.critical).length;
  if (critical >= CRITICAL_ACTIVITIES.min && critical <= CRITICAL_ACTIVITIES.max) return [];
  const severity = critical < CRITICAL_ACTIVITIES.min ? "blocking" : "warning";
  return [{ field: "activities", code: "criticalActivitiesOutOfRange", severity, detail: String(critical) }];
}

function coverageIssues(draft: Draft): Issue[] {
  const issues: Issue[] = [];
  const team = draft.team.value;
  if (team && !team.reportsTo) issues.push(incomplete("team", "reportsTo"));
  if (team && team.size === null) issues.push(incomplete("team", "size"));

  const location = draft.location.value;
  if (location && location.mode !== "remote" && !location.city) issues.push(incomplete("location", "city"));
  if (location && location.mode === "hybrid" && location.officeDays === null)
    issues.push(incomplete("location", "officeDays"));

  const contract = draft.contract.value;
  if (contract && contract.type === "fixedTerm" && contract.months === null)
    issues.push(incomplete("contract", "months"));

  const salary = draft.salary.value;
  if (salary && salary.min > salary.max) issues.push({ field: "salary", code: "salaryRangeInverted", severity: "blocking" });
  return issues;
}

function catalogIssues(draft: Draft): Issue[] {
  const jobTitleValue = draft.jobTitle.value;
  if (jobTitleValue === null) return [];

  if (jobTitleValue.kind === "outOfCatalog") {
    const withLevel = (draft.technicalSkills.value ?? []).filter((skill) => skill.expectedLevel !== null);
    return withLevel.map((skill) => ({
      field: "technicalSkills",
      code: "expectedLevelOutOfCatalog",
      severity: "warning",
      detail: skill.name,
    }));
  }

  const jobTitle = findJobTitle(jobTitleValue.id);
  if (!jobTitle) return [{ field: "jobTitle", code: "unknownJobTitle", severity: "blocking", detail: jobTitleValue.id }];

  const seniority = draft.seniority.value;
  if (seniority && !isSeniorityAllowed(jobTitle, seniority))
    return [{ field: "seniority", code: "seniorityNotAllowed", severity: "blocking", detail: seniority }];
  return [];
}

export function ruleIssues(draft: Draft): Issue[] {
  return [
    ...listIssues(draft),
    ...textIssues(draft),
    ...activityIssues(draft),
    ...coverageIssues(draft),
    ...catalogIssues(draft),
  ];
}
