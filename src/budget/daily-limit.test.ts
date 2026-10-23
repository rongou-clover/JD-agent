import { describe, expect, it } from "vitest";
import { dailyLimits, isBudgetExhausted, startOfBudgetDay, totalsByKind } from "./daily-limit";

const models = { fast: "anthropic/fast", writer: "anthropic/writer" };
const limits = { fast: { input: 1000, output: 200 }, writer: { input: 1200, output: 300 } };

describe("budget day in Europe/Rome", () => {
  it("summer time (UTC+2)", () => {
    expect(startOfBudgetDay(new Date("2026-07-15T21:59:59Z")).toISOString()).toBe("2026-07-14T22:00:00.000Z");
    expect(startOfBudgetDay(new Date("2026-07-15T22:00:00Z")).toISOString()).toBe("2026-07-15T22:00:00.000Z");
  });

  it("winter time (UTC+1)", () => {
    expect(startOfBudgetDay(new Date("2026-12-01T22:59:00Z")).toISOString()).toBe("2026-11-30T23:00:00.000Z");
    expect(startOfBudgetDay(new Date("2026-12-01T23:00:00Z")).toISOString()).toBe("2026-12-01T23:00:00.000Z");
  });

  it("days when the clock changes", () => {
    // 2026-03-29: Rome moves to UTC+2 at 01:00Z; the day started at UTC+1.
    expect(startOfBudgetDay(new Date("2026-03-29T12:00:00Z")).toISOString()).toBe("2026-03-28T23:00:00.000Z");
    // 2026-10-25: Rome moves back to UTC+1 at 01:00Z; the day started at UTC+2.
    expect(startOfBudgetDay(new Date("2026-10-25T12:00:00Z")).toISOString()).toBe("2026-10-24T22:00:00.000Z");
  });
});

describe("daily limit", () => {
  it("maps usage rows to fast or writer by model id, ignoring unknown ids", () => {
    const totals = totalsByKind(
      [
        { model: "anthropic/fast", input: 10, output: 2 },
        { model: "anthropic/writer", input: 30, output: 4 },
        { model: "anthropic/old", input: 999, output: 999 },
      ],
      models,
    );
    expect(totals).toEqual({ fast: { input: 10, output: 2 }, writer: { input: 30, output: 4 } });
  });

  it("is exhausted as soon as any of the four limits is reached", () => {
    const under = { fast: { input: 999, output: 199 }, writer: { input: 1199, output: 299 } };
    expect(isBudgetExhausted(under, limits)).toBe(false);
    expect(isBudgetExhausted({ ...under, writer: { input: 0, output: 300 } }, limits)).toBe(true);
    expect(isBudgetExhausted({ ...under, fast: { input: 1000, output: 0 } }, limits)).toBe(true);
  });

  it("reads limits from env", () => {
    const env = { DAILY_TOKENS_FAST_IN: "1", DAILY_TOKENS_FAST_OUT: "2", DAILY_TOKENS_WRITER_IN: "3", DAILY_TOKENS_WRITER_OUT: "4" };
    expect(dailyLimits(env)).toEqual({ fast: { input: 1, output: 2 }, writer: { input: 3, output: 4 } });
    expect(() => dailyLimits({})).toThrow();
  });
});
