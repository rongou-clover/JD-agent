import { z } from "zod";

const ModelEnv = z.object({
  MODEL_FAST: z.string().min(1),
  MODEL_WRITER: z.string().min(1),
});

export type Effort = "low" | "medium" | "high";

/** Mastra model router id, e.g. "anthropic/claude-haiku-5-5". Ids come only from env. */
export function model(kind: "fast" | "writer"): `anthropic/${string}` {
  const env = ModelEnv.parse(process.env);
  return `anthropic/${kind === "fast" ? env.MODEL_FAST : env.MODEL_WRITER}`;
}

export function anthropicOptions(effort: Effort) {
  return { anthropic: { effort } };
}
