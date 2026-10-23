/**
 * Explicit discriminatory wording (age, gender, marital status, nationality).
 * Regex only catches the explicit cases; implicit ones are flagged by the extractor.
 * Grammatical masculine ("il candidato") is not flagged.
 */
export const DISCRIMINATION_CATEGORIES = ["age", "gender", "maritalStatus", "nationality"] as const;
export type DiscriminationCategory = (typeof DISCRIMINATION_CATEGORIES)[number];

const NOT_EXPERIENCE = String.raw`(?!\s+di\s+esperienza)`;
const PERSON = String.raw`(?:candidat[oaie]|persona|person[e]|risors[ae]|figur[ae]|profil[oi]|talent[oi]|professionist[ai])`;

const PATTERNS: Record<DiscriminationCategory, RegExp[]> = {
  age: [
    /(?<!\p{L})et[àa](?!\p{L})/iu,
    /\b(?:under|over)\s?\d{2}\b/i,
    new RegExp(String.raw`\b(?:max|massimo|non oltre|entro i|sotto i|meno di|al di sotto dei)\s*\d{2}\s*anni\b${NOT_EXPERIENCE}`, "i"),
    new RegExp(String.raw`\b\d{2}\s*[-–]\s*\d{2}\s*anni\b${NOT_EXPERIENCE}`, "i"),
    new RegExp(String.raw`\b${PERSON}\s+giovan[ei]\b`, "i"),
    new RegExp(String.raw`\bgiovan[ei]\s+${PERSON}`, "i"),
  ],
  gender: [
    /\bragazz[oaie]\b/i,
    /\b(?:uomo|donna|uomini|donne|maschio|femmina)\b/i,
    /\bsesso\b/i,
    /\(\s*[mf]\s*\)/i,
  ],
  maritalStatus: [
    /\bstato civile\b/i,
    /\b(?:sposat|coniugat)[oaie]\b/i,
    /\b(?:nubile|celibe)\b/i,
    /\bsenza\s+figli\b/i,
  ],
  nationality: [
    /\bnazionalit[àa](?!\p{L})/iu,
    /\bcittadinanza\b/i,
    /\bsolo\s+(?:italian|stranier)[oaie]\b/i,
    /\b(?:italian|stranier)[oaie]\s+di\s+nascita\b/i,
  ],
};

export type DiscriminationMatch = { category: DiscriminationCategory; match: string };

export function findDiscrimination(text: string): DiscriminationMatch[] {
  return DISCRIMINATION_CATEGORIES.flatMap((category) =>
    PATTERNS[category].flatMap((pattern) => {
      const found = pattern.exec(text);
      return found ? [{ category, match: found[0] }] : [];
    }),
  );
}
