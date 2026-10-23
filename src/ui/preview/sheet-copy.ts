import type { Criticality, SkillType } from "@/domain/enums";
import type { InternalSheet } from "@/render/contract";

/** Italian copy of the internal sheet tab. */

export const MISSING_VALUE = "—";

export const SHEET_HEADINGS = {
  skills: "Skill",
  softSkills: "Skill trasversali",
  prerequisites: "Prerequisiti",
  salary: "RAL",
  managerNotes: "Note del responsabile",
  recommendedDimensions: "Dimensioni consigliate",
} as const;

export const SKILL_COLUMNS = ["Skill", "Tipo", "Criticità", "P atteso", "Obbligatoria", "Origine"] as const;

export const SKILL_TYPE_LABELS: Record<SkillType, string> = {
  hard: "Tecnica",
  soft: "Trasversale",
  IA: "IA",
  collaborazione: "Collaborazione",
};

export const CRITICALITY_LABELS: Record<Criticality, string> = {
  critica: "Critica",
  importante: "Importante",
  accessoria: "Accessoria",
};

type SkillSource = InternalSheet["skills"][number]["source"];

export const SKILL_SOURCE_LABELS: Record<SkillSource, string> = {
  draft: "Indicata da te",
  catalog: "Dal catalogo",
};

export const YES_NO = { yes: "Sì", no: "No" } as const;

export const SHEET_COPY = {
  seniority: "Seniority",
  outOfCatalog: "Fuori catalogo: livelli P e dimensioni consigliate non disponibili.",
  hybrid: (roles: string[]) => `Profilo ibrido: ${roles.join(", ")}, ricerca potenzialmente lunga.`,
  salaryPublished: "pubblicata nell'annuncio",
  salaryHidden: "non pubblicata nell'annuncio",
  empty: "La scheda interna compare dopo la prima bozza dell'annuncio.",
} as const;
