import type { FieldId } from "@/domain/fields";
import type { OPTIONAL_ASK_ORDER } from "@/domain/planner";
import { COPY } from "./copy";
import type { MessageParts } from "./format";

type OptionalField = (typeof OPTIONAL_ASK_ORDER)[number];

/** One line per optional field, in the single "anything else?" message (docs/domande.md). */
const OPTIONAL_LINES: Record<OptionalField, string> = {
  salary: "**RAL**: range di RAL? Lo metto nell'annuncio o resta solo per te?",
  offer: "**Cosa offri**: benefit, formazione, smart working, crescita?",
  languages: "**Lingue**: lingue richieste e a che livello?",
  prerequisites: "**Requisiti eliminatori**: c'è qualcosa senza cui scarteresti anche il candidato perfetto?",
  kpis: "**KPI**: su quali numeri lavora?",
  selectionProcess: "**Processo di selezione**: come funziona la selezione e in quanto tempo rispondi?",
  missionValues: "**Mission e valori** dell'azienda",
  managerNotes: "**Note per te** (solo nella scheda interna)",
};

const isOptional = (field: FieldId): field is OptionalField => field in OPTIONAL_LINES;

export function optionalMessage(fields: FieldId[]): MessageParts {
  const lines = fields.filter(isOptional).map((field) => OPTIONAL_LINES[field]);
  return { text: [COPY.optionalIntro, ...lines].join("\n"), questions: [], replies: [] };
}
