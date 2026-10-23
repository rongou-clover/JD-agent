import { z } from "zod";

const AccessEnv = z.object({
  ACCESS_PASSWORD: z.string().min(1),
  SESSION_SECRET: z.string().min(32),
});
export type AccessEnv = z.infer<typeof AccessEnv>;

/** Null when access is not configured: every request is then refused. */
export function accessEnv(env: NodeJS.ProcessEnv = process.env): AccessEnv | null {
  const parsed = AccessEnv.safeParse(env);
  return parsed.success ? parsed.data : null;
}
