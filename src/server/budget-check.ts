import { isBudgetExhausted, startOfBudgetDay, totalsByKind, type ModelKind, type TokenTotals } from "@/budget/daily-limit";
import type { Db } from "@/db/client";
import { usageTotalsSince } from "@/db/usage-repo";
import { ApiFailure } from "./api-errors";

export type BudgetDeps = {
  db: Db;
  /** Model ids from env, to map usage rows to fast or writer. */
  models: () => Record<ModelKind, string>;
  limits: () => TokenTotals;
  now: () => Date;
};

/** Every call that may reach a model checks the daily limit first. */
export async function assertBudget(deps: BudgetDeps): Promise<void> {
  const rows = await usageTotalsSince(deps.db, startOfBudgetDay(deps.now()));
  if (isBudgetExhausted(totalsByKind(rows, deps.models()), deps.limits())) throw new ApiFailure("budgetExhausted");
}
