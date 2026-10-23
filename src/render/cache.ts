import { createHash } from "node:crypto";
import { PROMPT_VERSION } from "@/agents/renderer/schema";
import type { Bounds, ProseSection } from "./sections";

/** Everything the writer receives for a section, except the retry reason. */
export type HashInput = {
  section: ProseSection;
  heading: string;
  /** The section's view of its dependency fields and context (job title, seniority). */
  data: Record<string, unknown>;
  forcedWording: string | null;
  bounds: Bounds;
};

/** Same hash → the cached section is reused without a model call. A prompt or length change invalidates it. */
export function sectionHash(input: HashInput): string {
  const payload = JSON.stringify({ promptVersion: PROMPT_VERSION, ...input });
  return createHash("sha256").update(payload).digest("hex");
}
