import { gte, sql } from "drizzle-orm";
import type { ModelTotals } from "@/budget/daily-limit";
import type { Db } from "./client";
import { usage } from "./schema";

/** Tokens per model recorded since the given instant, across all sessions. */
export async function usageTotalsSince(db: Db, since: Date): Promise<ModelTotals[]> {
  return db
    .select({
      model: usage.model,
      input: sql<number>`coalesce(sum(${usage.inputTokens}), 0)`.mapWith(Number),
      output: sql<number>`coalesce(sum(${usage.outputTokens}), 0)`.mapWith(Number),
    })
    .from(usage)
    .where(gte(usage.createdAt, since))
    .groupBy(usage.model);
}
