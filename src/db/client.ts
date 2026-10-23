import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { z } from "zod";
import * as schema from "./schema";

export type Db = PostgresJsDatabase<typeof schema>;

export function createDb(url: string): { db: Db; close: () => Promise<void> } {
  const client = postgres(url);
  return { db: drizzle(client, { schema }), close: () => client.end() };
}

let shared: Db | undefined;

/** App-wide connection pool, opened on first use. */
export function getDb(): Db {
  if (!shared) shared = createDb(z.string().min(1).parse(process.env.DATABASE_URL)).db;
  return shared;
}
