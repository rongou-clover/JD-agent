/** Draft fields, numbered as in docs/schema-bozza.md. */
export const FIELD_IDS = [
  "companyDescription",
  "missionValues",
  "roleMission",
  "jobTitle",
  "seniority",
  "team",
  "activities",
  "kpis",
  "sixMonthResults",
  "technicalSkills",
  "softSkills",
  "prerequisites",
  "languages",
  "location",
  "contract",
  "salary",
  "offer",
  "selectionProcess",
  "managerNotes",
] as const;

export type FieldId = (typeof FIELD_IDS)[number];

export type FieldMeta = {
  /** Number in docs/schema-bozza.md. */
  number: string;
  label: string;
  required: boolean;
  /** Order in which the planner asks; null = never asked on its own. */
  priority: number | null;
};

export const FIELDS: Record<FieldId, FieldMeta> = {
  companyDescription: { number: "1", label: "Descrizione azienda", required: true, priority: 1 },
  missionValues: { number: "2", label: "Mission e valori", required: false, priority: 9 },
  roleMission: { number: "3", label: "Missione del ruolo", required: true, priority: 2 },
  jobTitle: { number: "4", label: "Job title", required: true, priority: 1 },
  seniority: { number: "5", label: "Seniority", required: true, priority: 3 },
  team: { number: "6", label: "Team e riporto", required: true, priority: 4 },
  activities: { number: "7", label: "Attività ricorrenti", required: true, priority: 3 },
  kpis: { number: "8", label: "KPI", required: false, priority: 6 },
  sixMonthResults: { number: "9", label: "Risultati a 6 mesi", required: true, priority: 4 },
  technicalSkills: { number: "10", label: "Skill tecniche", required: true, priority: 5 },
  softSkills: { number: "11", label: "Skill trasversali", required: true, priority: 5 },
  prerequisites: { number: "12", label: "Prerequisiti eliminatori", required: false, priority: 7 },
  languages: { number: "12b", label: "Lingue", required: false, priority: 6 },
  location: { number: "13", label: "Sede e modalità", required: true, priority: 6 },
  contract: { number: "14", label: "Contratto", required: true, priority: 7 },
  salary: { number: "15", label: "RAL", required: false, priority: 8 },
  offer: { number: "16", label: "Cosa offre", required: false, priority: 8 },
  selectionProcess: { number: "17", label: "Processo di selezione", required: false, priority: 9 },
  managerNotes: { number: "18", label: "Note dell'hiring manager", required: false, priority: null },
};

export const REQUIRED_FIELD_IDS = FIELD_IDS.filter((id) => FIELDS[id].required);
export const OPTIONAL_FIELD_IDS = FIELD_IDS.filter((id) => !FIELDS[id].required);

/** Fields closed by the first-message diagnosis, not by a question. */
export const DIAGNOSIS_FIELD_IDS = ["jobTitle", "seniority"] as const satisfies readonly FieldId[];
