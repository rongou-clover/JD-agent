/** Salary figures belong only in field 15 (salary), never in free text. */
const PATTERNS: RegExp[] = [
  /\bRAL\b/i,
  /\b(?:retribuzione|stipendio|compenso|salario)\b[^.]{0,30}\d/i,
  /\d[\d.,]*\s*(?:k|€|euro)?\s*(?:lord[ie]|annu[ie]|\/\s*anno|all'anno)\b/i,
];

export function findSalaryMention(text: string): string | null {
  for (const pattern of PATTERNS) {
    const found = pattern.exec(text);
    if (found) return found[0];
  }
  return null;
}
