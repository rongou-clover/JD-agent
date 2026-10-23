import type { Diagnosis } from "@/domain/diagnosis";
import { describe, expect, it } from "vitest";
import { emptyDraft } from "@/domain/draft";
import { withField } from "@/domain/testing";
import { initialState } from "../state";
import { COPY } from "./copy";
import { chooseRoleMessage, diagnosisMessage } from "./diagnosis";
import { optionalMessage } from "./optional";
import { requiredQuestions } from "./questions";

const planner = initialState().planner;
const sdrDraft = withField(withField(emptyDraft(), "jobTitle", { kind: "catalog", id: "sdr" }), "seniority", "S1");

describe("diagnosis messages", () => {
  it("single role", () => {
    const parts = diagnosisMessage({ kind: "catalog", jobTitleId: "account-executive", seniority: "S2", otherRoles: [], hybrid: false }, "S2");
    expect(parts.text).toBe("Stai cercando un **Account Executive**, livello **Mid**. Va bene?");
    expect(parts.replies.map((reply) => reply.action.kind)).toEqual(["confirmRole", "seniorityDown", "seniorityUp", "chooseOtherRole"]);
  });

  it("role with key activities from other roles", () => {
    const otherRoles = [
      { jobTitleId: "sdr", activities: ["cold call"] },
      { jobTitleId: "account-manager", activities: ["rinnovi"] },
    ];
    const parts = diagnosisMessage({ kind: "catalog", jobTitleId: "account-executive", seniority: "S3", otherRoles, hybrid: false }, "S3");
    expect(parts.text).toBe(
      "Stai cercando un **Account Executive**, livello **Senior**. Vedo anche attività da **SDR** e **Account Manager**: le tengo come parte del ruolo. Va bene?",
    );
    expect(parts.replies.map((reply) => reply.action.kind)).toEqual(["confirmRole", "seniorityDown", "chooseOtherRole"]);
  });

  it("hybrid profile", () => {
    const otherRoles = [{ jobTitleId: "growth-marketer", activities: ["esperimenti"] }];
    const parts = diagnosisMessage({ kind: "catalog", jobTitleId: "performance-marketing-specialist", seniority: "S2", otherRoles, hybrid: true }, "S2");
    expect(parts.text).toBe(
      "Stai descrivendo più ruoli in uno: Performance Marketing Specialist, Growth Marketer. Profili così sono difficili da trovare: ti consiglio **Performance Marketing Specialist**, perché copre le attività più importanti. Va bene?",
    );
  });

  it("choose another role: never the rejected one", () => {
    const diagnosis: Diagnosis = { kind: "catalog", jobTitleId: "sdr", seniority: "S1", otherRoles: [{ jobTitleId: "bdr", activities: ["x"] }], hybrid: false };
    const parts = chooseRoleMessage(diagnosis, "sdr");
    expect(parts.text).toBe(COPY.chooseRole);
    const ids = parts.replies.map((reply) => (reply.action.kind === "pickRole" ? reply.action.jobTitleId : null));
    expect(ids[0]).toBe("bdr");
    expect(ids).not.toContain("sdr");
    expect(ids.length).toBeLessThanOrEqual(4);
  });

  it("choose a role without any diagnosis asks to describe it", () => {
    expect(chooseRoleMessage(null, null)).toEqual({ text: COPY.describeRole, questions: [], replies: [] });
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
