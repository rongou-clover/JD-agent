import { describe, expect, it } from "vitest";
import { toUsage } from "./usage";

describe("toUsage", () => {
  it("counts uncached input as is", () => {
    expect(toUsage("m", { inputTokens: 1000, outputTokens: 50 })).toEqual({ model: "m", inputTokens: 1000, outputTokens: 50 });
  });

  it("weighs cache reads at 0.1 and cache writes at 1.25", () => {
    expect(toUsage("m", { inputTokens: 2413, outputTokens: 84, cachedInputTokens: 2370 }).inputTokens).toBe(43 + 237);
    expect(toUsage("m", { inputTokens: 2413, outputTokens: 84, cacheCreationInputTokens: 2370 }).inputTokens).toBe(43 + 2963);
  });

  it("treats missing usage as zero", () => {
    expect(toUsage("m", undefined)).toEqual({ model: "m", inputTokens: 0, outputTokens: 0 });
  });
});
