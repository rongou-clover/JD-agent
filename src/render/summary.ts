import type { z } from "zod";
import type { Diagnosis } from "@/domain/diagnosis";
import type { Draft, FieldValue } from "@/domain/draft";
import type { SummaryRow } from "./contract";
import {
  CONTRACT_LABELS,
  LANGUAGE_LEVEL_LABELS,
  PREFERRED_LANGUAGE_SUFFIX,
  SALARY_SUFFIX,
  SENIORITY_LABELS,
  SUMMARY_LABELS,
  TITLE_PLACEHOLDER,
  WORK_MODE_LABELS,
  ccnlLabel,
  ccnlLevelLabel,
  monthsLabel,
  officeDaysLabel,
} from "./copy";
import { fieldValue, jobTitleName, resolveJobTitle } from "./draft-values";

type Row = z.infer<typeof SummaryRow>;

export function postingTitle(draft: Draft, diagnosis: Diagnosis | null): string {
  return jobTitleName(resolveJobTitle(draft, diagnosis)) ?? TITLE_PLACEHOLDER;
}

function modeLabel(location: FieldValue<"location">): string {
  const mode = WORK_MODE_LABELS[location.mode];
  return location.mode === "hybrid" && location.officeDays ? `${mode}, ${officeDaysLabel(location.officeDays)}` : mode;
}

/** A remote role without a city has no "Sede" row; any other location without a city is still to define. */
function cityRow(location: FieldValue<"location"> | null): Row[] {
  if (location && !location.city && location.mode === "remote") return [];
  return [{ label: SUMMARY_LABELS.city, value: location?.city ?? null }];
}

function contractLabel(contract: FieldValue<"contract">): string {
  const type = CONTRACT_LABELS[contract.type];
  const head = contract.type === "fixedTerm" && contract.months ? `${type}, ${monthsLabel(contract.months)}` : type;
  const ccnl = [contract.ccnl ? ccnlLabel(contract.ccnl) : null, contract.level ? ccnlLevelLabel(contract.level) : null]
    .filter((part) => part !== null)
    .join(", ");
  return ccnl ? `${head} · ${ccnl}` : head;
}

const euros = new Intl.NumberFormat("it-IT", { maximumFractionDigits: 0, useGrouping: "always" });

export function salaryLabel(salary: FieldValue<"salary">): string {
  const range = salary.min === salary.max ? euros.format(salary.min) : `${euros.format(salary.min)}–${euros.format(salary.max)}`;
  return `${range} ${SALARY_SUFFIX}`;
}

function languagesLabel(languages: FieldValue<"languages">): string {
  return languages
    .map(({ language, level, required }) => {
      const text = `${language} ${LANGUAGE_LEVEL_LABELS[level]}`;
      return required ? text : `${text} ${PREFERRED_LANGUAGE_SUFFIX}`;
    })
    .join(", ");
}

/**
 * The "key: value" box under the title. Required fields always have a row (null = placeholder);
 * optional ones appear only with a value. Salary appears only when the user chose to publish it.
 */
export function buildSummary(draft: Draft): Row[] {
  const location = fieldValue(draft, "location");
  const contract = fieldValue(draft, "contract");
  const salary = fieldValue(draft, "salary");
  const seniority = fieldValue(draft, "seniority");
  const languages = fieldValue(draft, "languages") ?? [];
  const team = fieldValue(draft, "team");
  const rows: Row[] = [
    { label: SUMMARY_LABELS.company, value: fieldValue(draft, "companyName") },
    ...cityRow(location),
    { label: SUMMARY_LABELS.mode, value: location ? modeLabel(location) : null },
    { label: SUMMARY_LABELS.contract, value: contract ? contractLabel(contract) : null },
  ];
  if (salary?.inPosting) rows.push({ label: SUMMARY_LABELS.salary, value: salaryLabel(salary) });
  rows.push({ label: SUMMARY_LABELS.seniority, value: seniority ? SENIORITY_LABELS[seniority] : null });
  if (languages.length > 0) rows.push({ label: SUMMARY_LABELS.languages, value: languagesLabel(languages) });
  if (!team || team.reportsTo) rows.push({ label: SUMMARY_LABELS.reportsTo, value: team?.reportsTo ?? null });
  return rows;
}
