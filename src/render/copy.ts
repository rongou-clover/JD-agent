import type { ContractType, LanguageLevel, Seniority, WorkMode } from "@/domain/enums";
import type { SectionId } from "./contract";

/** Italian product copy of the posting. Wording rules: docs/template-output.md. */

/** Fixed text, docs/decisioni.md 2026-10-23. */
export const EQUAL_OPPORTUNITY_TEXT =
  "Accogliamo candidature di persone di ogni genere, età, provenienza e orientamento, nel rispetto delle L. 903/77 e L. 125/91. Se non hai tutti i requisiti ma il ruolo ti interessa, candidati comunque. I dati saranno trattati secondo il Regolamento UE 2016/679 (GDPR).";

/** Posting title while the job title is still unknown. */
export const TITLE_PLACEHOLDER = "Ruolo da definire";

export const SECTION_HEADINGS: Record<Exclude<SectionId, "summary">, string> = {
  role: "Il ruolo e perché lo apriamo",
  team: "Il team",
  activities: "Cosa farai",
  results: "Risultati attesi",
  requirements: "Requisiti",
  niceToHave: "Nice to have",
  howYouWork: "Come lavori",
  offer: "Cosa offriamo",
  practicalInfo: "Informazioni pratiche",
  selectionProcess: "Processo di selezione",
  about: "Chi siamo",
  missionValues: "Mission e valori",
  equalOpportunity: "Pari opportunità",
};

/** Seniority S1: the activities section is about learning. */
export const JUNIOR_ACTIVITIES_HEADING = "Cosa imparerai";

export const SUMMARY_LABELS = {
  company: "Azienda",
  city: "Sede",
  mode: "Modalità",
  contract: "Contratto",
  salary: "RAL",
  seniority: "Seniority",
  languages: "Lingue",
  reportsTo: "Riporta a",
} as const;

export const SENIORITY_LABELS: Record<Seniority, string> = {
  S1: "Junior",
  S2: "Mid",
  S3: "Senior",
  S4: "Manager",
};

export const WORK_MODE_LABELS: Record<WorkMode, string> = {
  onsite: "In presenza",
  hybrid: "Ibrido",
  remote: "Da remoto",
};

export const CONTRACT_LABELS: Record<ContractType, string> = {
  permanent: "Tempo indeterminato",
  fixedTerm: "Tempo determinato",
  freelance: "Partita IVA",
  internship: "Stage",
};

export const LANGUAGE_LEVEL_LABELS: Record<LanguageLevel, string> = {
  A1: "A1",
  A2: "A2",
  B1: "B1",
  B2: "B2",
  C1: "C1",
  C2: "C2",
  native: "madrelingua",
};

export const officeDaysLabel = (days: number) => (days === 1 ? "1 giorno in ufficio" : `${days} giorni in ufficio`);
export const monthsLabel = (months: number) => (months === 1 ? "1 mese" : `${months} mesi`);
export const ccnlLabel = (ccnl: string) => (/^ccnl\b/i.test(ccnl) ? ccnl : `CCNL ${ccnl}`);
export const ccnlLevelLabel = (level: string) => `livello ${level}`;
export const PREFERRED_LANGUAGE_SUFFIX = "(preferenziale)";
export const SALARY_SUFFIX = "€ lordi annui";
