/** Token usage of one model call, recorded later against the daily limit. */
export type Usage = { model: string; inputTokens: number; outputTokens: number };

type RawUsage =
  | { inputTokens?: number; outputTokens?: number; cachedInputTokens?: number; cacheCreationInputTokens?: number }
  | undefined;

/**
 * Anthropic bills a cache read at 0.1 and a cache write at 1.25 of an input token. Input is recorded in
 * uncached-token equivalents, so the daily token limit tracks what is actually spent.
 */
const CACHE_READ_WEIGHT = 0.1;
const CACHE_WRITE_WEIGHT = 1.25;

export function toUsage(model: string, usage: RawUsage): Usage {
  const total = usage?.inputTokens ?? 0;
  const read = usage?.cachedInputTokens ?? 0;
  const write = usage?.cacheCreationInputTokens ?? 0;
  const inputTokens = Math.ceil(total - read - write + read * CACHE_READ_WEIGHT + write * CACHE_WRITE_WEIGHT);
  return { model, inputTokens, outputTokens: usage?.outputTokens ?? 0 };
}

export type AgentResult<T> = { output: T; usage: Usage[] };
