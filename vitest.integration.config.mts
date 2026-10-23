import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/** Repository tests against the docker Postgres (`pnpm db:up`), on a separate database. */
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["src/**/*.integration.ts"],
    globalSetup: ["./src/db/integration-setup.ts"],
    fileParallelism: false,
  },
});
