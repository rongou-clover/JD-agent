import { z } from "zod";

export const BUDGET_TIME_ZONE = "Europe/Rome";

export const MODEL_KINDS = ["fast", "writer"] as const;
export type ModelKind = (typeof MODEL_KINDS)[number];

export type TokenTotals = Record<ModelKind, { input: number; output: number }>;

const LimitsEnv = z.object({
  DAILY_TOKENS_FAST_IN: z.coerce.number().int().positive(),
  DAILY_TOKENS_FAST_OUT: z.coerce.number().int().positive(),
  DAILY_TOKENS_WRITER_IN: z.coerce.number().int().positive(),
  DAILY_TOKENS_WRITER_OUT: z.coerce.number().int().positive(),
});

export function dailyLimits(env: Record<string, string | undefined> = process.env): TokenTotals {
  const parsed = LimitsEnv.parse(env);
  return {
    fast: { input: parsed.DAILY_TOKENS_FAST_IN, output: parsed.DAILY_TOKENS_FAST_OUT },
    writer: { input: parsed.DAILY_TOKENS_WRITER_IN, output: parsed.DAILY_TOKENS_WRITER_OUT },
  };
}

const romeParts = new Intl.DateTimeFormat("en-US", {
  timeZone: BUDGET_TIME_ZONE,
  hourCycle: "h23",
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  second: "numeric",
});

function wallClock(at: Date): { year: number; month: number; day: number; hour: number; minute: number; second: number } {
  const parts = Object.fromEntries(romeParts.formatToParts(at).map((part) => [part.type, Number(part.value)]));
  return {
    year: parts.year ?? 0,
    month: parts.month ?? 1,
    day: parts.day ?? 1,
    hour: parts.hour ?? 0,
    minute: parts.minute ?? 0,
    second: parts.second ?? 0,
  };
}

/** Offset of Rome from UTC at the given instant, in milliseconds. */
function romeOffset(at: Date): number {
  const p = wallClock(at);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - (at.getTime() - at.getMilliseconds());
}

/** The instant the current day started in Rome; midnight never falls in a DST change there. */
export function startOfBudgetDay(now: Date): Date {
  const { year, month, day } = wallClock(now);
  const midnightAsUtc = Date.UTC(year, month - 1, day);
  const guess = midnightAsUtc - romeOffset(new Date(midnightAsUtc));
  return new Date(midnightAsUtc - romeOffset(new Date(guess)));
}

/** Usage rows carry the model id; it maps to fast or writer by the ids in env. Unknown ids count for neither. */
export function modelKind(modelId: string, models: Record<ModelKind, string>): ModelKind | null {
  if (modelId === models.fast) return "fast";
  if (modelId === models.writer) return "writer";
  return null;
}

export type ModelTotals = { model: string; input: number; output: number };

export function totalsByKind(rows: ModelTotals[], models: Record<ModelKind, string>): TokenTotals {
  const totals: TokenTotals = { fast: { input: 0, output: 0 }, writer: { input: 0, output: 0 } };
  for (const row of rows) {
    const kind = modelKind(row.model, models);
    if (kind === null) continue;
    totals[kind].input += row.input;
    totals[kind].output += row.output;
  }
  return totals;
}

/** The demo stops for everyone as soon as any of the four limits is reached. */
export function isBudgetExhausted(totals: TokenTotals, limits: TokenTotals): boolean {
  return MODEL_KINDS.some(
    (kind) => totals[kind].input >= limits[kind].input || totals[kind].output >= limits[kind].output,
  );
}
