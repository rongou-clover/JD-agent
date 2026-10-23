import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/** Golden evals: real API calls, run on demand with `pnpm eval`. */
process.loadEnvFile(".env.local");

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["src/**/*.eval.ts"],
    testTimeout: 180_000,
    fileParallelism: false,
  },
});
