import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import type { Usage } from "@/agents/usage";
import { withField } from "@/domain/testing";
import type { RenderOutput } from "@/render/contract";
import { render } from "@/render/render";
import { RENDER_FIXTURES, type RenderFixture } from "./render-fixtures";
import { costUsd, postingWords, scoreForcedWordings, scoreLength, scorePlaceholders, scoreSalary } from "./render-scorers";
import type { ScoreResult } from "./scorers";

const SCORERS = ["salary", "placeholders", "forcedWordings", "length"] as const;
type ScorerName = (typeof SCORERS)[number];

type RunReport = { calls: number; usage: Usage[]; costUsd: number };
type CaseReport = {
  id: string;
  scores: Record<ScorerName, ScoreResult>;
  words: number;
  full: RunReport;
  output: RenderOutput;
  /** Re-render after changing one field, with the cache of the full render. */
  reRender?: RunReport & { sections: string[] };
};
const reports: CaseReport[] = [];

const run = (usage: Usage[]): RunReport => ({ calls: usage.length, usage, costUsd: costUsd(usage) });

async function runCase(fixture: RenderFixture): Promise<CaseReport> {
  const { id, draft, diagnosis, forcedWordings } = fixture;
  const full = await render({ draft, diagnosis, forcedWordings }, {});
  const { posting } = full.output;
  return {
    id,
    scores: {
      salary: scoreSalary(posting, draft),
      placeholders: scorePlaceholders(posting, draft),
      forcedWordings: scoreForcedWordings(posting, forcedWordings),
      length: scoreLength(posting, draft),
    },
    words: postingWords(posting),
    full: run(full.usage),
    output: full.output,
  };
}

/** One changed field must re-render exactly its section. */
async function reRender(fixture: RenderFixture, report: CaseReport): Promise<CaseReport["reRender"]> {
  const draft = withField(fixture.draft, "sixMonthResults", ["Chiudere almeno 300k di nuovo ARR", "Pipeline coperta 3 volte il target"]);
  const next = await render({ draft, diagnosis: fixture.diagnosis, forcedWordings: fixture.forcedWordings }, report.output.cache);
  const sections = next.output.posting.sections
    .filter((section) => report.output.cache[section.id]?.section !== next.output.cache[section.id]?.section)
    .map((section) => section.id);
  return { ...run(next.usage), sections };
}

describe("render", () => {
  it.each(RENDER_FIXTURES.map((f) => [f.id, f] as const))("%s", async (_, fixture) => {
    const report = await runCase(fixture);
    if (fixture.id === RENDER_FIXTURES.at(0)?.id) report.reRender = await reRender(fixture, report);
    reports.push(report);
  });

  afterAll(() => {
    const dir = path.join(process.cwd(), "test-results/evals");
    mkdirSync(dir, { recursive: true });
    const average = (name: ScorerName) => reports.reduce((sum, r) => sum + r.scores[name].score, 0) / Math.max(reports.length, 1);
    const summary = Object.fromEntries(SCORERS.map((name) => [name, average(name)]));
    const file = path.join(dir, `render-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
    writeFileSync(file, JSON.stringify({ summary, reports }, null, 2));
    console.table(
      reports.map((r) => ({
        id: r.id,
        words: r.words,
        calls: r.full.calls,
        cost: r.full.costUsd.toFixed(4),
        reRenderCost: r.reRender?.costUsd.toFixed(4) ?? "",
        ...Object.fromEntries(SCORERS.map((name) => [name, r.scores[name].score])),
      })),
    );
    for (const r of reports) {
      const failures = SCORERS.flatMap((name) => r.scores[name].failures.map((f) => `${name}: ${f}`));
      if (failures.length > 0) console.log(`${r.id}\n  ${failures.join("\n  ")}`);
    }
    console.log("summary", summary, "report", file);
    for (const name of SCORERS) expect(summary[name]).toBe(1);
    for (const r of reports) if (r.reRender) expect(r.reRender.sections).toEqual(["results"]);
  });
});
