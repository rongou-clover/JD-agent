import { describe, expect, it } from "vitest";
import { emptyDraft } from "@/domain/draft";
import { withField } from "@/domain/testing";
import { initialState } from "../state";
import { COPY } from "./copy";
import { optionalMessage } from "./optional";
import { requiredQuestions } from "./questions";
import { roleSwitchMessage } from "./role-switch";

const planner = initialState().planner;
const sdrDraft = withField(withField(emptyDraft(), "jobTitle", { kind: "catalog", id: "sdr" }), "seniority", "S1");

describe("role switch message", () => {
  it("names both roles and offers to switch or keep", () => {
    const parts = roleSwitchMessage(sdrDraft, "account-executive");
    expect(parts.text).toBe("Quello che descrivi sembra più un **Account Executive** che un **SDR**. Vuoi cambiare ruolo?");
    expect(parts.replies).toEqual([
      { label: "Passa a Account Executive", action: { kind: "pickRole", jobTitleId: "account-executive" } },
      { label: "Resto su SDR", action: { kind: "keepRole", declinedId: "account-executive" } },
    ]);
  });
});

describe("required field questions", () => {
  it("company name and description share one question", () => {
    expect(requiredQuestions(["companyName", "companyDescription"], emptyDraft(), planner).questions).toEqual([
      "Come si chiama la tua azienda e cosa fa, in due righe?",
    ]);
    const named = withField(emptyDraft(), "companyName", "Acme");
    expect(requiredQuestions(["companyDescription"], named, planner).questions).toEqual(["Cosa fa la tua azienda, in due righe?"]);
  });

  it("role mission: hiring reason quick replies, then the follow-up once a reason is picked", () => {
    const asked = requiredQuestions(["roleMission"], emptyDraft(), planner);
    expect(asked.questions).toEqual(["Perché assumi adesso?"]);
    expect(asked.replies.map((reply) => reply.label)).toEqual([
      "È un ruolo nuovo",
      "Sostituisco qualcuno",
      "Oggi lo facciamo da soli o con fornitori",
    ]);
    const pending = requiredQuestions(["roleMission"], emptyDraft(), { ...planner, pendingHiringReason: "new" });
    expect(pending).toEqual({ questions: ["Cosa deve sbloccare questa persona?"], replies: [] });
  });

  it("fixed questions for activities, team and results", () => {
    const { questions } = requiredQuestions(["activities", "team"], sdrDraft, planner);
    expect(questions).toEqual([
      "Cosa farà questa persona ogni settimana? E quali 2 o 3 cose sono le più critiche?",
      "In che team entra, quante persone ci sono e a chi riporta?",
    ]);
    const vague = withField(sdrDraft, "sixMonthResults", ["Lavorare bene"]);
    expect(requiredQuestions(["sixMonthResults"], vague, planner).questions).toEqual([
      "Ho **Lavorare bene**: me ne serve almeno un altro, meglio se misurabile: un numero, un progetto chiuso, un risultato.",
    ]);
  });

  it("seniority: quick replies limited to the levels the role allows", () => {
    const draft = withField(emptyDraft(), "jobTitle", { kind: "catalog", id: "sdr" });
    const { replies } = requiredQuestions(["seniority"], draft, planner);
    expect(replies.map((reply) => reply.label)).toEqual(["Junior", "Mid"]);
  });

  it("technical skills suggest catalog skills; soft skills offer catalog quick replies", () => {
    const { questions, replies } = requiredQuestions(["technicalSkills", "softSkills"], sdrDraft, planner);
    expect(questions[0]).toContain("Per un **SDR** di solito servono: Aprire una cold call");
    expect(replies.map((reply) => reply.action.kind)).toEqual(Array(5).fill("softSkill"));
  });

  it("location: mode quick replies first, then the missing part", () => {
    expect(requiredQuestions(["location"], emptyDraft(), planner).replies.map((reply) => reply.label)).toEqual([
      "In ufficio",
      "Ibrido",
      "Da remoto",
    ]);
    const hybrid = withField(emptyDraft(), "location", { city: null, mode: "hybrid", officeDays: null, schedule: null, travel: null });
    expect(requiredQuestions(["location"], hybrid, planner).questions).toEqual(["In che città, e quanti giorni in ufficio?"]);
  });

  it("contract: type quick replies, months for a fixed term", () => {
    expect(requiredQuestions(["contract"], emptyDraft(), planner).replies.map((reply) => reply.label)).toEqual([
      "Indeterminato",
      "Determinato",
      "Partita IVA",
      "Stage",
    ]);
    const fixed = withField(emptyDraft(), "contract", { type: "fixedTerm", months: null, ccnl: null, level: null });
    expect(requiredQuestions(["contract"], fixed, planner).questions).toEqual(["Di quanti mesi è il contratto a termine?"]);
  });
});

describe("optional message", () => {
  it("one message with one line per field, no numbered questions", () => {
    const parts = optionalMessage(["salary", "kpis"]);
    expect(parts.text.split("\n")).toEqual([
      COPY.optionalIntro,
      "**RAL**: range di RAL? Lo metto nell'annuncio o resta solo per te?",
      "**KPI**: su quali numeri lavora?",
    ]);
    expect(parts.questions).toEqual([]);
  });
});
