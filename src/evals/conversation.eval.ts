import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { extract } from "@/agents/extractor/agent";
import { model } from "@/agents/models";
import { checkMessage } from "@/agents/prompt-injection/guard";
import type { Usage } from "@/agents/usage";
import { buildChecklist } from "@/domain/checklist";
import type { FieldId } from "@/domain/fields";
import { render } from "@/render/render";
import { findJobTitle } from "@/domain/catalog";
import { startState, type SessionState } from "@/workflow/state";
import { createTurnWorkflow, runTurn } from "@/workflow/turn";
import type { TurnInput } from "@/workflow/turn-context";
import { CONVERSATIONS, type Conversation } from "./conversations";
import { postingWords, scorePlaceholders, scoreSalary } from "./render-scorers";

const DONT_KNOW = "Non lo so";
const NOTHING_ELSE = "No, va bene così.";
/** Prices per million tokens on 2026-10-23, only to report the cost of a run. */
const PRICE = { fast: { in: 0.1, out: 0.5 }, writer: { in: 2, out: 10 } } as const;

let replyId = 0;
const workflow = createTurnWorkflow({
  checkMessage,
  extract,
  render,
  guardModel: () => model("fast"),
  newReplyId: () => `r${++replyId}`,
});

type Turn = { user: string; agent: string; asked: FieldId[] };
type Report = { id: string; turns: Turn[]; complete: boolean; redundant: string[]; words: number; failures: string[]; costUsd: number };
const reports: Report[] = [];

function cost(usage: Usage[]): number {
  return usage.reduce((sum, u) => {
    const price = u.model === model("writer") ? PRICE.writer : PRICE.fast;
    return sum + (u.inputTokens * price.in + u.outputTokens * price.out) / 1e6;
  }, 0);
}

/** The simulated user's next input, or null when the agent has nothing left to ask. */
function nextInput(script: Conversation, state: SessionState, answered: Set<FieldId>): TurnInput | null {
  const level = state.quickReplies.find(
    (reply) => reply.action.kind === "pickSeniority" && reply.action.seniority === script.seniority,
  );
  if (level) return { kind: "quickReply", label: level.label, action: level.action };
  const asked = state.planner.askedFields;
  if (asked.length === 0) return null;
  const texts = asked.flatMap((field) => (script.answers[field] && !answered.has(field) ? [script.answers[field]] : []));
  if (texts.length > 0) return { kind: "message", text: texts.join("\n") };
  return { kind: "message", text: state.planner.optionalOffered ? NOTHING_ELSE : DONT_KNOW };
}

/** Fields the user really answered: the scripted ones sent, or every asked field on "Non lo so". */
function repliedFields(script: Conversation, state: SessionState, input: TurnInput): FieldId[] {
  if (input.kind !== "message") return [];
  const asked = state.planner.askedFields;
  const scripted = asked.filter((field) => script.answers[field] !== undefined && input.text.includes(script.answers[field]));
  return scripted.length > 0 ? scripted : asked;
}

async function converse(script: Conversation): Promise<Report> {
  const jobTitle = findJobTitle(script.jobTitleId);
  if (!jobTitle) throw new Error(`${script.id}: unknown job title ${script.jobTitleId}`);
  let state = startState(jobTitle);
  const turns: Turn[] = [];
  const usage: Usage[] = [];
  const answered = new Set<FieldId>();
  const redundant: string[] = [];
  let input: TurnInput | null = { kind: "message", text: script.opening };
  while (input && turns.length < script.maxTurns + 2) {
    for (const field of state.planner.askedFields) if (answered.has(field)) redundant.push(field);
    for (const field of repliedFields(script, state, input)) answered.add(field);
    const outcome = await runTurn(workflow, input, state);
    state = outcome.state;
    usage.push(...outcome.usage);
    const user = input.kind === "message" ? input.text : input.label;
    turns.push({ user, agent: [outcome.message.text, ...outcome.message.questions].join("\n"), asked: state.planner.askedFields });
    input = nextInput(script, state, answered);
  }
  const complete = buildChecklist(state.draft).complete;
  const failures = [
    ...(complete ? [] : ["checklist not complete"]),
    ...(turns.length <= script.maxTurns ? [] : [`${turns.length} turns, max ${script.maxTurns}`]),
    ...redundant.map((field) => `asked again after an answer: ${field}`),
    ...scoreSalary(state.posting, state.draft).failures,
    ...scorePlaceholders(state.posting, state.draft).failures,
  ];
  return { id: script.id, turns, complete, redundant, words: postingWords(state.posting), failures, costUsd: cost(usage) };
}

describe("conversation", () => {
  it.each(CONVERSATIONS.map((c) => [c.id, c] as const))("%s", async (_, script) => {
    reports.push(await converse(script));
  }, 600_000);

  afterAll(() => {
    const dir = path.join(process.cwd(), "test-results/evals");
    mkdirSync(dir, { recursive: true });
    const file = path.join(dir, `conversation-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
    writeFileSync(file, JSON.stringify(reports, null, 2));
    console.table(reports.map(({ id, turns, complete, words, costUsd, failures }) => ({ id, turns: turns.length, complete, words, costUsd: costUsd.toFixed(3), failures: failures.length })));
    for (const r of reports) if (r.failures.length > 0) console.log(`${r.id}\n  ${r.failures.join("\n  ")}`);
    console.log("report", file);
    for (const r of reports) expect(r.failures, r.id).toEqual([]);
  });
});
