/** Token usage of one model call, recorded later against the global budget. */
export type Usage = { model: string; inputTokens: number; outputTokens: number };

type RawUsage = { inputTokens?: number; outputTokens?: number } | undefined;

export function toUsage(model: string, usage: RawUsage): Usage {
  return { model, inputTokens: usage?.inputTokens ?? 0, outputTokens: usage?.outputTokens ?? 0 };
}

export type AgentResult<T> = { output: T; usage: Usage[] };
