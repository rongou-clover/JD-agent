import { defineRailway, github, preserve, project, service } from "railway/iac";

// This repository manages only its own resources in the environment. Other
// repositories export their own partial name.
// See https://docs.railway.com/infrastructure-as-code#multi-repo-projects
export const partial = "web";

export default defineRailway(() => {
  const web = service("web", {
    source: github("rongou-clover/JD-agent", { branch: "phase-7-integration" }),
    build: "pnpm build",
    start: "pnpm start",
    healthcheck: "/api/health",
    preDeploy: "pnpm db:migrate",
    env: {
      // Reference to the Postgres service and secrets: values live only in Railway.
      DATABASE_URL: preserve(),
      ANTHROPIC_API_KEY: preserve(),
      ACCESS_PASSWORD: preserve(),
      SESSION_SECRET: preserve(),
      MODEL_FAST: "claude-haiku-5-5",
      MODEL_WRITER: "claude-sonnet-5-5",
      // Sized on 2026-10-23 prices to stay under $5/day.
      DAILY_TOKENS_FAST_IN: "1000000",
      DAILY_TOKENS_FAST_OUT: "200000",
      DAILY_TOKENS_WRITER_IN: "1750000",
      DAILY_TOKENS_WRITER_OUT: "130000",
    },
  });
  return project("jd-agent", {
    resources: [web],
  });
});
