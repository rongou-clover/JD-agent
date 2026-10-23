import { emptyDraft, type Draft } from "@/domain/draft";
import { withField } from "@/domain/testing";
import type { ForcedWording } from "@/render/contract";

/** Hand-written drafts from golden cases 02, 09 and Human Maple: deterministic and free to build. */
export type RenderFixture = { id: string; draft: Draft; forcedWordings: ForcedWording[] };

function datapulse(): RenderFixture {
  let d = emptyDraft();
  d = withField(d, "companyName", "Datapulse");
  d = withField(d, "companyDescription", "Piattaforma di analytics per retailer. Series A, 60 persone, sedi a Milano e Madrid.");
  d = withField(d, "roleMission", { reason: "replacement", text: "Sostituisce un AE passato a Sales Manager: gestire tutto il ciclo di vendita sul mid-market." });
  d = withField(d, "jobTitle", { kind: "catalog", id: "account-executive" }, "proposed", "catalog");
  d = withField(d, "seniority", "S3", "proposed", "inferred");
  d = withField(d, "team", { size: 6, reportsTo: "Sales Manager", departments: ["Sales"] });
  d = withField(d, "activities", [
    { text: "Condurre discovery con prospect mid-market", critical: true },
    { text: "Presentare demo della piattaforma", critical: false },
    { text: "Negoziare e chiudere contratti con ticket medio di 40k", critical: true },
    { text: "Gestire la pipeline in HubSpot", critical: false },
  ]);
  d = withField(d, "sixMonthResults", ["Chiudere almeno 250k di nuovo ARR", "Pipeline coperta 3 volte il target"]);
  d = withField(d, "technicalSkills", [
    { name: "Vendita SaaS B2B", required: true, expectedLevel: null, typicalMistake: null },
    { name: "Condurre una discovery", required: true, expectedLevel: null, typicalMistake: null },
    { name: "Negoziare le condizioni", required: true, expectedLevel: null, typicalMistake: null },
    { name: "HubSpot", required: true, expectedLevel: null, typicalMistake: null },
  ]);
  d = withField(d, "softSkills", ["Autonomia", "Resilienza", "Capacità di ascolto"]);
  d = withField(d, "languages", [
    { language: "Inglese", level: "C1", required: true },
    { language: "Spagnolo", level: "B2", required: false },
  ]);
  d = withField(d, "location", { city: "Milano", mode: "hybrid", officeDays: 2, schedule: null, travel: "Trasferte in Italia" });
  d = withField(d, "contract", { type: "permanent", months: null, ccnl: "Commercio", level: "Quadro" });
  d = withField(d, "salary", { min: 55000, max: 65000, inPosting: false });
  return {
    id: "02-ae-senior-completo",
    draft: d,
    forcedWordings: [{ section: "role", text: "Qui ogni trattativa che chiudi si vede subito nei numeri dell'azienda." }],
  };
}

function stayly(): RenderFixture {
  let d = emptyDraft();
  d = withField(d, "companyName", "Stayly");
  d = withField(d, "companyDescription", "Piattaforma che aiuta gli hotel indipendenti a vendere esperienze locali ai propri ospiti. 35 persone, 400 hotel in Italia e Spagna.");
  d = withField(d, "roleMission", { reason: "new", text: "Costruire da zero il canale partner: oggi nessuno se ne occupa a tempo pieno." });
  d = withField(d, "jobTitle", { kind: "catalog", id: "partnership-manager" }, "proposed", "catalog");
  d = withField(d, "seniority", "S2", "proposed", "inferred");
  d = withField(d, "team", { size: 4, reportsTo: "COO", departments: ["Sales", "Marketing"] });
  d = withField(d, "activities", [
    { text: "Individuare e contattare catene alberghiere, consorzi e software gestionali per hotel", critical: true },
    { text: "Negoziare accordi di partnership e di revenue share", critical: true },
    { text: "Costruire il piano congiunto con ogni partner e seguirne i numeri", critical: false },
    { text: "Organizzare webinar ed eventi con i partner", critical: false },
  ]);
  d = withField(d, "sixMonthResults", ["Firmare almeno 5 accordi di partnership", "Portare il 15% dei nuovi hotel dal canale partner"]);
  d = withField(d, "technicalSkills", [
    { name: "Business development o partnership nel B2B", required: true, expectedLevel: null, typicalMistake: null },
    { name: "Negoziazione", required: true, expectedLevel: null, typicalMistake: null },
    { name: "CRM (HubSpot o Salesforce)", required: true, expectedLevel: null, typicalMistake: null },
  ]);
  d = withField(d, "softSkills", ["Costruire relazioni di lungo periodo", "Autonomia nel gestire le priorità"]);
  d = withField(d, "languages", [{ language: "Inglese", level: "C1", required: true }]);
  d = withField(d, "location", { city: "Milano", mode: "hybrid", officeDays: 3, schedule: null, travel: null });
  d = withField(d, "contract", { type: "permanent", months: null, ccnl: "Commercio", level: null });
  d = withField(d, "salary", { min: 40000, max: 48000, inPosting: true });
  d = withField(d, "offer", ["Buoni pasto da 8 €", "Budget formazione di 1.000 € l'anno", "Due settimane di lavoro da remoto all'estero"]);
  d = withField(d, "selectionProcess", [
    { step: "Call conoscitiva", timing: null },
    { step: "Case study", timing: null },
    { step: "Incontro con il COO", timing: "Rispondiamo entro una settimana" },
  ]);
  return {
    id: "09-annuncio-incollato",
    draft: d,
    forcedWordings: [{ section: "offer", text: "Ogni anno ci ritroviamo tutti per una settimana in uno dei nostri hotel partner." }],
  };
}

/** As in docs/golden-dataset/human-maple.md after the interview: results, location and contract still missing. */
function humanMaple(): RenderFixture {
  let d = emptyDraft();
  d = withField(d, "companyName", "Human Maple");
  d = withField(d, "companyDescription", "Raccogliamo e ricicliamo mozziconi di sigaretta per aziende, PA e comuni, e li trasformiamo in nuovi prodotti.");
  d = withField(d, "roleMission", { reason: "insourcing", text: "Prendere la responsabilità della comunicazione, finora seguita internamente con un grafico freelance." });
  d = withField(d, "jobTitle", { kind: "catalog", id: "content-social-media-manager" }, "proposed", "catalog");
  d = withField(d, "seniority", "S2", "proposed", "inferred");
  d = withField(d, "team", { size: null, reportsTo: "CEO", departments: ["Marketing"] });
  d = withField(d, "activities", [
    { text: "Gestire i social (LinkedIn, Instagram, Facebook)", critical: true },
    { text: "Girare e montare video brevi agli eventi del weekend", critical: true },
    { text: "Creare e gestire campagne adv con un budget di circa 500 € al mese", critical: false },
    { text: "Curare la grafica di report e attestati", critical: false },
  ]);
  d = withField(d, "technicalSkills", [
    { name: "Girare e montare video", required: true, expectedLevel: null, typicalMistake: null },
    { name: "Campagne adv", required: true, expectedLevel: null, typicalMistake: null },
    { name: "Photoshop", required: false, expectedLevel: null, typicalMistake: null },
  ]);
  d = withField(d, "softSkills", ["Gestire l'ambiguità", "Comunicare con gli stakeholder", "Velocità di esecuzione", "Precisione"]);
  d = withField(d, "prerequisites", [{ type: "availability", text: "Disponibilità agli eventi nel weekend" }]);
  d = withField(d, "managerNotes", "Chi non ha esperienza deve dare qualcosa in più.");
  return {
    id: "04-human-maple",
    draft: d,
    forcedWordings: [],
  };
}

export const RENDER_FIXTURES: RenderFixture[] = [datapulse(), stayly(), humanMaple()];
