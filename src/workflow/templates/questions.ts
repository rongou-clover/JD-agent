import { expectedLevel, findJobTitle, type JobTitle } from "@/domain/catalog";
import type { Draft } from "@/domain/draft";
import { ContractType, HiringReason, SENIORITIES, WorkMode } from "@/domain/enums";
import type { FieldId } from "@/domain/fields";
import type { ReplyOption } from "../quick-reply-actions";
import { seniorityLabel } from "../roles";
import type { PlannerMemory } from "../state";
import { CONTRACT_TYPE_LABELS, HIRING_REASON_LABELS, WORK_MODE_LABELS } from "./copy";
import { followUpQuestion } from "./follow-ups";
import { bold } from "./format";

/** Catalog skills suggested in the technical skills question. */
const MAX_SUGGESTED_SKILLS = 5;
/** Soft skill quick replies offered from the catalog (docs/domande.md: 4–5). */
const MAX_SOFT_SKILL_REPLIES = 5;

type Question = { text: string; replies: ReplyOption[] };

function catalogJobTitle(draft: Draft): JobTitle | undefined {
  const value = draft.jobTitle.value;
  return value?.kind === "catalog" ? findJobTitle(value.id) : undefined;
}

function companyQuestion(draft: Draft): Question {
  if (draft.companyName.value === null && draft.companyDescription.value === null)
    return { text: "Come si chiama la tua azienda e cosa fa, in due righe?", replies: [] };
  if (draft.companyName.value === null) return { text: "Come si chiama la tua azienda?", replies: [] };
  return { text: "Cosa fa la tua azienda, in due righe?", replies: [] };
}

function roleMissionQuestion(planner: PlannerMemory): Question {
  if (planner.pendingHiringReason) return { text: "Cosa deve sbloccare questa persona?", replies: [] };
  const replies: ReplyOption[] = HiringReason.options.map((reason) => ({
    label: HIRING_REASON_LABELS[reason],
    action: { kind: "hiringReason", reason },
  }));
  return { text: "Perché assumi adesso?", replies };
}

/** Only the role diagnosis sets seniority, so a missing one is picked with a quick reply. */
function seniorityQuestion(draft: Draft): Question {
  const jobTitle = catalogJobTitle(draft);
  const levels = SENIORITIES.filter((seniority) => !jobTitle || jobTitle.seniority.includes(seniority));
  const replies: ReplyOption[] = levels.map((seniority) => ({
    label: seniorityLabel(seniority),
    action: { kind: "pickSeniority", seniority },
  }));
  return { text: "Che livello cerchi? Pensa a cosa farà: eseguire, coordinare o avere la responsabilità di un'area.", replies };
}

function technicalSkillsQuestion(draft: Draft): Question {
  const base = "Quali competenze tecniche servono dal primo giorno, e quali sono un plus?";
  const jobTitle = catalogJobTitle(draft);
  const seniority = draft.seniority.value;
  if (!jobTitle) return { text: base, replies: [] };
  const suggested = jobTitle.skills
    .filter((skill) => skill.type === "hard" && skill.criticality === "critica")
    .filter((skill) => seniority === null || expectedLevel(skill, seniority) !== null)
    .slice(0, MAX_SUGGESTED_SKILLS)
    .map((skill) => skill.name);
  if (suggested.length === 0) return { text: base, replies: [] };
  return { text: `${base} Per un ${bold(jobTitle.name)} di solito servono: ${suggested.join(", ")}. Togli o aggiungi.`, replies: [] };
}

/** Quick replies from the catalog's recommended dimensions of the role, minus those already chosen. */
function softSkillsQuestion(draft: Draft): Question {
  const chosen = new Set(draft.softSkills.value ?? []);
  const replies: ReplyOption[] = (catalogJobTitle(draft)?.recommendedDimensions ?? [])
    .filter((name) => !chosen.has(name))
    .slice(0, MAX_SOFT_SKILL_REPLIES)
    .map((name) => ({ label: name, action: { kind: "softSkill", name } }));
  return { text: "Quali sono le 3 o 4 qualità personali che contano di più in questo ruolo, in ordine?", replies };
}

function locationQuestion(draft: Draft): Question {
  const location = draft.location.value;
  if (location === null) {
    const replies: ReplyOption[] = WorkMode.options.map((mode) => ({
      label: WORK_MODE_LABELS[mode],
      action: { kind: "workMode", mode },
    }));
    return { text: "Dove lavora e come?", replies };
  }
  const needsCity = location.mode !== "remote" && !location.city;
  const needsDays = location.mode === "hybrid" && location.officeDays === null;
  if (needsCity && needsDays) return { text: "In che città, e quanti giorni in ufficio?", replies: [] };
  if (needsDays) return { text: "Quanti giorni in ufficio?", replies: [] };
  return { text: "In che città lavora?", replies: [] };
}

function contractQuestion(draft: Draft): Question {
  if (draft.contract.value?.type === "fixedTerm") return { text: "Di quanti mesi è il contratto a termine?", replies: [] };
  const replies: ReplyOption[] = ContractType.options.map((type) => ({
    label: CONTRACT_TYPE_LABELS[type],
    action: { kind: "contractType", type },
  }));
  return { text: "Che tipo di contratto offri?", replies };
}

const FIXED_QUESTIONS: Partial<Record<FieldId, string>> = {
  sixMonthResults: "Tra 6 mesi, cosa deve aver ottenuto perché tu dica che è stata la scelta giusta? Due o tre cose concrete.",
  activities: "Cosa farà questa persona ogni settimana? E quali 2 o 3 cose sono le più critiche?",
  team: "In che team entra, quante persone ci sono e a chi riporta?",
};

function questionFor(field: FieldId, draft: Draft, planner: PlannerMemory): Question | null {
  const followUp = draft[field].value === null ? null : followUpQuestion(field, draft);
  if (followUp) return { text: followUp, replies: [] };
  switch (field) {
    case "companyName":
    case "companyDescription":
      return companyQuestion(draft);
    case "roleMission":
      return roleMissionQuestion(planner);
    case "seniority":
      return seniorityQuestion(draft);
    case "technicalSkills":
      return technicalSkillsQuestion(draft);
    case "softSkills":
      return softSkillsQuestion(draft);
    case "location":
      return locationQuestion(draft);
    case "contract":
      return contractQuestion(draft);
    default: {
      const text = FIXED_QUESTIONS[field];
      return text ? { text, replies: [] } : null;
    }
  }
}

/** One question per planned field; company name and description share one (docs/domande.md). */
export function requiredQuestions(fields: FieldId[], draft: Draft, planner: PlannerMemory) {
  const questions = fields.flatMap((field) => {
    const question = questionFor(field, draft, planner);
    return question ? [question] : [];
  });
  const unique = questions.filter((question, index) => questions.findIndex((q) => q.text === question.text) === index);
  return { questions: unique.map((q) => q.text), replies: unique.flatMap((q) => q.replies) };
}
