import { createHash } from "node:crypto";
import { PROMPT_VERSION } from "@/agents/renderer/schema";
import type { ProseSection } from "./sections";

export type HashInput = {
  section: ProseSection;
  heading: string;
  /** The section's view of its dependency fields and context (job title, seniority). */
  data: Record<string, unknown>;
  forcedWording: string | null;
};

/** Same hash → the cached section is reused without a model call. A prompt change invalidates every section. */
export function sectionHash(input: HashInput): string {
  const payload = JSON.stringify({ promptVersion: PROMPT_VERSION, ...input });
  return createHash("sha256").update(payload).digest("hex");
}
