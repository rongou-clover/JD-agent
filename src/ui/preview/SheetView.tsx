import type { ReactNode } from "react";
import type { InternalSheet } from "@/render/contract";
import { SENIORITY_LABELS } from "@/render/copy";
import { salaryLabel } from "@/render/summary";
import {
  CRITICALITY_LABELS,
  MISSING_VALUE,
  SHEET_COPY,
  SHEET_HEADINGS,
  SKILL_COLUMNS,
  SKILL_SOURCE_LABELS,
  SKILL_TYPE_LABELS,
  YES_NO,
} from "./sheet-copy";

type Skill = InternalSheet["skills"][number];

function Section({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section aria-label={heading} className="mb-3.5">
      <h2 className="m-0 mb-1 text-[15px] font-bold text-foreground">{heading}</h2>
      {children}
    </section>
  );
}

function List({ items }: { items: string[] }) {
  if (items.length === 0) return <p className="m-0">{MISSING_VALUE}</p>;
  return (
    <ul className="m-0 list-disc pl-5">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}

function skillCells(skill: Skill): string[] {
  return [
    skill.name,
    skill.type ? SKILL_TYPE_LABELS[skill.type] : MISSING_VALUE,
    skill.criticality ? CRITICALITY_LABELS[skill.criticality] : MISSING_VALUE,
    skill.expectedLevel ?? MISSING_VALUE,
    skill.required ? YES_NO.yes : YES_NO.no,
    SKILL_SOURCE_LABELS[skill.source],
  ];
}

function SkillTable({ skills }: { skills: Skill[] }) {
  if (skills.length === 0) return <p className="m-0">{MISSING_VALUE}</p>;
  return (
    <table className="w-full border-collapse text-left text-[13px]">
      <thead>
        <tr>
          {SKILL_COLUMNS.map((column) => (
            <th key={column} scope="col" className="border-b border-border py-1.5 pr-3 font-bold text-foreground">
              {column}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {skills.map((skill, index) => (
          <tr key={index}>
            {skillCells(skill).map((cell, column) => (
              <td key={column} className="border-b border-border py-1.5 pr-3 align-top">
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function salaryText(salary: InternalSheet["salary"]): string {
  if (!salary) return MISSING_VALUE;
  return `${salaryLabel(salary)}, ${salary.inPosting ? SHEET_COPY.salaryPublished : SHEET_COPY.salaryHidden}`;
}

/** The internal sheet as a plain document page, like the posting. Never printed or exported. */
export function SheetView({ sheet }: { sheet: InternalSheet }) {
  const seniority = sheet.seniority ? `${SENIORITY_LABELS[sheet.seniority]} (${sheet.seniority})` : MISSING_VALUE;
  return (
    <>
      <h1 className="m-0 mb-1 text-[22px] font-bold text-foreground">{sheet.jobTitle}</h1>
      <p className="m-0 mb-4 text-body-soft">
        <span className="font-bold">{SHEET_COPY.seniority}:</span> {seniority}
      </p>
      {!sheet.inCatalog && <p className="m-0 mb-3.5 text-body-soft">{SHEET_COPY.outOfCatalog}</p>}
      {sheet.hybridRoles && (
        <p role="note" className="m-0 mb-3.5 rounded-lg bg-accent-tint px-3 py-2 text-accent-foreground">
          {SHEET_COPY.hybrid(sheet.hybridRoles)}
        </p>
      )}
      <Section heading={SHEET_HEADINGS.skills}>
        <SkillTable skills={sheet.skills} />
      </Section>
      <Section heading={SHEET_HEADINGS.softSkills}>
        <List items={sheet.softSkills} />
      </Section>
      <Section heading={SHEET_HEADINGS.prerequisites}>
        <List items={sheet.prerequisites} />
      </Section>
      <Section heading={SHEET_HEADINGS.salary}>
        <p className="m-0">{salaryText(sheet.salary)}</p>
      </Section>
      <Section heading={SHEET_HEADINGS.managerNotes}>
        <p className="m-0 whitespace-pre-line">{sheet.managerNotes ?? MISSING_VALUE}</p>
      </Section>
      <Section heading={SHEET_HEADINGS.recommendedDimensions}>
        <List items={sheet.recommendedDimensions} />
      </Section>
    </>
  );
}
