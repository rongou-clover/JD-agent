import { Agent } from "@mastra/core/agent";
import { findJobTitle, isSeniorityAllowed } from "@/domain/catalog";
import { anthropicOptions, model } from "../models";
import { loadPrompt } from "../prompt";
import { toUsage, type AgentResult, type Usage } from "../usage";
import { DiagnosisInput, DiagnosisOutput, MAX_STEPS } from "./schema";
import { getJobTitle, listJobTitles } from "./tools";

export const roleDiagnosisAgent = new Agent({
  id: "role-diagnosis",
  name: "Role diagnosis",
  instructions: loadPrompt("role-diagnosis"),
  model: () => model("fast"),
  tools: { listJobTitles, getJobTitle },
});

/** A diagnosis is usable only if its ids and seniority exist in the catalog and other roles differ from the main one. */
export function isValidDiagnosis(diagnosis: DiagnosisOutput): boolean {
  if (diagnosis.kind === "outOfCatalog") return true;
  const main = findJobTitle(diagnosis.jobTitleId);
  const others = diagnosis.otherRoles.map((role) => role.jobTitleId);
  return (
    main !== undefined &&
    isSeniorityAllowed(main, diagnosis.seniority) &&
    others.every((id) => id !== main.id && findJobTitle(id) !== undefined) &&
    new Set(others).size === others.length &&
    (!diagnosis.hybrid || others.length > 0)
  );
}

async function attempt(message: string): Promise<{ diagnosis: DiagnosisOutput | null; usage: Usage }> {
  const result = await roleDiagnosisAgent.generate(message, {
    maxSteps: MAX_STEPS,
    structuredOutput: { schema: DiagnosisOutput },
    providerOptions: anthropicOptions("medium"),
  });
  const parsed = DiagnosisOutput.safeParse(result.object);
  return { diagnosis: parsed.success ? parsed.data : null, usage: toUsage(model("fast"), result.totalUsage ?? result.usage) };
}

/** Retries once on an invalid answer, then falls back to out of catalog. */
export async function diagnose(raw: DiagnosisInput): Promise<AgentResult<DiagnosisOutput>> {
  const { message } = DiagnosisInput.parse(raw);
  const usage: Usage[] = [];
  for (let i = 0; i < 2; i++) {
    const { diagnosis, usage: callUsage } = await attempt(message);
    usage.push(callUsage);
    if (diagnosis && isValidDiagnosis(diagnosis)) return { output: diagnosis, usage };
  }
  return { output: { kind: "outOfCatalog", title: "" }, usage };
}
