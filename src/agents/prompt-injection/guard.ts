import { randomUUID } from "node:crypto";
import type { MastraDBMessage } from "@mastra/core/agent/message-list";
import { PromptInjectionDetector } from "@mastra/core/processors";
import { anthropicOptions, model } from "../models";
import { loadPrompt } from "../prompt";

export const PROMPT_VERSION = "prompt-injection@1";

export const DETECTION_TYPES = ["injection", "jailbreak", "system-override", "role-manipulation", "data-exfiltration"];

/** Minimum confidence to block; high to spare pasted postings full of instructions for candidates. */
export const BLOCK_THRESHOLD = 0.8;

let detector: PromptInjectionDetector | undefined;

/** Built on first use, so the model id is read from env at call time like the other agents. */
const getDetector = () =>
  (detector ??= new PromptInjectionDetector({
    model: model("fast"),
    instructions: loadPrompt("prompt-injection"),
    detectionTypes: DETECTION_TYPES,
    threshold: BLOCK_THRESHOLD,
    strategy: "block",
    // Fail closed: a message the detector could not check never reaches the agents.
    errorStrategy: "strict",
    lastMessageOnly: true,
    providerOptions: anthropicOptions("low"),
  }));

export type GuardResult = { allowed: true } | { allowed: false; reason: string };

function userMessage(text: string): MastraDBMessage {
  return { id: randomUUID(), role: "user", createdAt: new Date(), content: { format: 2, parts: [{ type: "text", text }] } };
}

/** Runs once per user message, before the extractor and the diagnosis. Any failure blocks the message. */
export async function checkMessage(message: string): Promise<GuardResult> {
  try {
    await getDetector().processInput({
      messages: [userMessage(message)],
      abort: (reason) => {
        throw new Error(reason ?? "Prompt injection detected");
      },
    });
    return { allowed: true };
  } catch (error) {
    return { allowed: false, reason: error instanceof Error ? error.message : String(error) };
  }
}
