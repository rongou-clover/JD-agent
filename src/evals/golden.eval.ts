import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { extract } from "@/agents/extractor/agent";
import { checkMessage, type GuardResult } from "@/agents/prompt-injection/guard";
import { diagnose } from "@/agents/role-diagnosis/agent";
import type { Usage } from "@/agents/usage";
import type { Diagnosis } from "@/domain/diagnosis";
import { emptyDraft, type Draft } from "@/domain/draft";
import { planNext } from "@/domain/planner";
import { applyExtraction } from "@/workflow/merge";
import { loadGoldenCases, type ExpectedDiagnosis, type GoldenCase } from "./golden";
import { scoreDiagnosis, scoreExtraction, scoreGuard, scoreRedundantQuestions, type ScoreResult } from "./scorers";

const THRESHOLDS = { guard: 1, diagnosis: 0.9, extraction: 0.8, redundantQuestions: 1 } as const;
type ScorerName = keyof typeof THRESHOLDS;

/** The output of a blocked message is discarded, so only the guard is scored. */
type CaseReport = {
  id: string;
  guard: GuardResult;
  scores: Partial<Record<ScorerName, ScoreResult>>;
  diagnosis?: Diagnosis;
  draft?: Draft;
  usage: Usage[];
};
const reports: CaseReport[] = [];

function average(name: ScorerName): number {
  const scores = reports.flatMap((r) => r.scores[name]?.score ?? []);
  return scores.length === 0 ? 1 : scores.reduce((sum, score) => sum + score, 0) / scores.length;
}

/**
 * The draft as the product starts it: the expected role, as if picked in Home. The frozen role-diagnosis
 * agent is still scored on its own, but its output never reaches the draft.
 */
function pickedRoleDraft(expected: ExpectedDiagnosis): Draft {
  const draft = emptyDraft();
  if (expected.kind !== "catalog") return draft;
  return { ...draft, jobTitle: { value: { kind: "catalog", id: expected.jobTitleId }, source: "user", status: "confirmed" } };
}

async function runCase(goldenCase: GoldenCase): Promise<CaseReport> {
  const { id, input, expected } = goldenCase;
  const guard = await checkMessage(input);
  const guardScore = scoreGuard(expected.blocked, guard);
  if (!guard.allowed) return { id, guard, scores: { guard: guardScore }, usage: [] };
  const start = pickedRoleDraft(expected.diagnosis);
  const [extraction, diagnosis] = await Promise.all([
    extract({ message: input, draft: start, askedFields: [], lastAskFields: [] }),
    diagnose({ message: input }),
  ]);
  const draft = applyExtraction(start, extraction.output);
  return {
    id,
    guard,
    scores: {
      guard: guardScore,
      diagnosis: scoreDiagnosis(expected.diagnosis, diagnosis.output),
      extraction: scoreExtraction(expected, draft),
      redundantQuestions: scoreRedundantQuestions(expected, draft, planNext(draft, { optionalOffered: false, skipped: [] })),
    },
    diagnosis: diagnosis.output,
    draft,
    usage: [...extraction.usage, ...diagnosis.usage],
  };
}

describe("golden dataset", () => {
  it.each(loadGoldenCases().map((c) => [c.id, c] as const))("%s", async (_, goldenCase) => {
    reports.push(await runCase(goldenCase));
  });

  afterAll(() => {
    const dir = path.join(process.cwd(), "test-results/evals");
    mkdirSync(dir, { recursive: true });
    const summary = Object.fromEntries((Object.keys(THRESHOLDS) as ScorerName[]).map((name) => [name, average(name)]));
    const file = path.join(dir, `${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
    writeFileSync(file, JSON.stringify({ summary, reports }, null, 2));
    console.table(reports.map((r) => ({ id: r.id, ...Object.fromEntries(Object.entries(r.scores).map(([k, v]) => [k, v.score.toFixed(2)])) })));
    for (const r of reports) {
      const failures = Object.entries(r.scores).flatMap(([k, v]) => v.failures.map((f) => `${k}: ${f}`));
      if (failures.length > 0) console.log(`${r.id}\n  ${failures.join("\n  ")}`);
    }
    console.log("summary", summary, "report", file);
    for (const name of Object.keys(THRESHOLDS) as ScorerName[]) expect(summary[name]).toBeGreaterThanOrEqual(THRESHOLDS[name]);
  });
});
