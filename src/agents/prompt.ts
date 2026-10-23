import { readFileSync } from "node:fs";
import path from "node:path";

/** Prompts live in src/agents/<name>/prompt.md, never inline in code. */
export function loadPrompt(agent: "extractor" | "role-diagnosis" | "renderer" | "prompt-injection"): string {
  return readFileSync(path.join(process.cwd(), "src/agents", agent, "prompt.md"), "utf8");
}
