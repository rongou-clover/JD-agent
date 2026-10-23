import type { FieldId } from "@/domain/fields";

/**
 * Scripted hiring managers for the end-to-end conversation eval. The simulated user confirms the
 * proposed role, answers each asked field with its scripted text, says "Non lo so" when the script
 * has none, and answers the optional fields once.
 */
export type Conversation = {
  id: string;
  opening: string;
  answers: Partial<Record<FieldId, string>>;
  /** At most this many turns to reach "JD pronta". */
  maxTurns: number;
};

export const CONVERSATIONS: Conversation[] = [
  {
    id: "verdeluce-sdr",
    opening:
      "Siamo Verdeluce, una startup di Torino che installa impianti fotovoltaici per piccole aziende, 30 persone. Cerco una persona che faccia prospecting su LinkedIn e via email, prenoti le call per i nostri commerciali e qualifichi i lead in entrata. È il nostro primo ruolo così: finora lo facevano i founder. Prima esperienza va bene.",
    answers: {
      roleMission: "È un ruolo nuovo: deve riempire l'agenda dei due account executive, oggi perdiamo lead perché nessuno li richiama in tempo.",
      activities:
        "Cercare aziende manifatturiere su LinkedIn, scrivere sequenze di email, chiamare i lead entro 24 ore, qualificarli con BANT, aggiornare HubSpot. Le più importanti sono richiamare entro 24 ore e qualificare bene.",
      team: "Il team commerciale è di 4 persone e riporta al Head of Sales.",
      sixMonthResults: "Dopo 6 mesi: 40 call qualificate al mese per gli AE e tempo di risposta ai lead sotto le 24 ore.",
      technicalSkills: "HubSpot e LinkedIn Sales Navigator obbligatori, scrivere email chiare. Gradito l'inglese.",
      softSkills: "Resilienza, curiosità, organizzazione.",
      location: "Torino, ibrido con 3 giorni in ufficio.",
      contract: "Tempo indeterminato, CCNL Commercio.",
      salary: "RAL 28-32k, da pubblicare.",
      offer: "Buoni pasto, formazione sulla vendita, bonus trimestrale sugli obiettivi.",
      selectionProcess: "Call conoscitiva, caso pratico, incontro con i founder; risposta entro una settimana.",
    },
    maxTurns: 16,
  },
  {
    id: "human-maple-social",
    opening:
      "Siamo Human Maple: raccogliamo e ricicliamo mozziconi di sigaretta per aziende, PA e comuni, e li trasformiamo in nuovi prodotti. Cerco una persona che gestisca i nostri social (LinkedIn, Instagram, Facebook), giri e monti video brevi agli eventi del weekend e faccia un po' di grafica per report e attestati. Livello tra junior e mid. Riporta al CEO.",
    answers: {
      roleMission: "Finora lo facevamo noi con un grafico freelance: vogliamo internalizzarlo e raccontare ogni settimana il nostro lavoro.",
      activities:
        "Piano editoriale di LinkedIn e Instagram, video brevi agli eventi, grafica per report e attestati, community management. Le più importanti sono il piano editoriale e i video.",
      team: "Siamo in 12, il team è di 3 persone tra comunicazione e vendite, riporta al CEO.",
      technicalSkills: "Montaggio video con CapCut, Canva, gestione campagne adv base.",
      softSkills: "Creatività, autonomia, precisione.",
      location: "Milano, in presenza con eventi nel weekend.",
      contract: "Tempo determinato 12 mesi, CCNL Commercio.",
    },
    maxTurns: 16,
  },
];
