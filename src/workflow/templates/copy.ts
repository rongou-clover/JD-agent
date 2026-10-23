import type { ContractType, HiringReason, WorkMode } from "@/domain/enums";
import type { DiscriminationCategory } from "@/domain/validation/discrimination";

function stillMissing(missing: string): string {
  return `Mancano ancora: ${missing}. Nel testo restano come [Da definire in chat]: puoi aggiungerle quando vuoi.`;
}

/** Fixed agent copy (docs/domande.md). Product copy is Italian. */
export const COPY = {
  blocked: "Non posso usare questo messaggio. Raccontami il ruolo che stai cercando.",
  offTopic: "Sono qui per scrivere la job description con te. Torniamo al ruolo.",
  updatedOne: "Ho aggiornato la JD. Mi serve ancora una cosa:",
  outOfCatalog: "Questo ruolo non è ancora nella mia libreria: scrivo comunque la JD.",
  chooseRole: "Quale ruolo stai cercando? Scegline uno qui sotto o descrivilo con parole tue.",
  describeRole: "Quale ruolo stai cercando? Descrivimelo con parole tue.",
  forcedWording: "Fatto: uso il tuo testo così com'è.",
  optionalIntro: "La JD è quasi pronta. Vuoi aggiungere anche una di queste cose?",
  done: "La JD è pronta 🎉 Puoi esportarla o chiedermi modifiche.",
  completeAnyway: (missing: string) => `Va bene, scrivo la JD con quello che ho. ${stillMissing(missing)}`,
  /** The user skipped a required field and the agent derived it. */
  proposedOnSkip: (fields: string) => `Ho proposto io ${fields}: trovi tutto nell'anteprima e puoi cambiarlo quando vuoi.`,
  /** The user skipped a required field the agent cannot derive: it is not asked again. */
  leftOpen: (fields: string) => `Va bene, lascio da definire ${fields}: non te lo richiedo, ma puoi dirmelo quando vuoi.`,
  /** Closing reminder when only skipped required fields are missing. */
  stillMissing,
  doneWithMissing: (missing: string) => `Ho scritto la JD con quello che ho. ${stillMissing(missing)} Puoi esportarla o chiedermi modifiche.`,
} as const;

/** Quick replies under the role proposal (docs/domande.md, "Primo messaggio"). */
export const ROLE_REPLIES = {
  confirm: "Sì, va bene",
  junior: "È più junior",
  senior: "È più senior",
  other: "Scegli un altro ruolo",
} as const;

export const HIRING_REASON_LABELS: Record<HiringReason, string> = {
  new: "È un ruolo nuovo",
  replacement: "Sostituisco qualcuno",
  insourcing: "Oggi lo facciamo da soli o con fornitori",
};

export const WORK_MODE_LABELS: Record<WorkMode, string> = {
  onsite: "In ufficio",
  hybrid: "Ibrido",
  remote: "Da remoto",
};

export const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
  permanent: "Indeterminato",
  fixedTerm: "Determinato",
  freelance: "Partita IVA",
  internship: "Stage",
};

/** Why a discriminatory request is not used; age is translated into experience (docs/domande.md). */
export function discriminationNote(category: DiscriminationCategory, quote: string): string {
  if (category === "age") return `Non posso usare «${quote}» nell'annuncio; lo traduco in anni di esperienza?`;
  return `Non posso usare «${quote}» nell'annuncio: genere, stato civile e nazionalità non possono essere requisiti.`;
}
