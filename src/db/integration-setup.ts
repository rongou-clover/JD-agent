import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { createDb } from "./client";

/** Admin connection to the local docker Postgres; override with TEST_DATABASE_ADMIN_URL. */
const ADMIN_URL = process.env.TEST_DATABASE_ADMIN_URL ?? "postgres://jd:jd@localhost:5432/postgres";
export const TEST_DATABASE = "jd_agent_test";

/** Recreates the test database and applies the migrations once per run. */
export default async function setup({ provide }: { provide: (key: "databaseUrl", value: string) => void }) {
  const admin = postgres(ADMIN_URL, { max: 1, onnotice: () => {} });
  await admin.unsafe(`drop database if exists ${TEST_DATABASE} with (force)`);
  await admin.unsafe(`create database ${TEST_DATABASE}`);
  await admin.end();

  const url = new URL(ADMIN_URL);
  url.pathname = `/${TEST_DATABASE}`;
  const { db, close } = createDb(url.toString());
  await migrate(db, { migrationsFolder: "./drizzle" });
  await close();
  provide("databaseUrl", url.toString());
}

declare module "vitest" {
  export interface ProvidedContext {
    databaseUrl: string;
  }
}
