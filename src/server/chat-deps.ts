import { randomBytes } from "node:crypto";
import { extract } from "@/agents/extractor/agent";
import { model } from "@/agents/models";
import { checkMessage } from "@/agents/prompt-injection/guard";
import { dailyLimits } from "@/budget/daily-limit";
import { getDb } from "@/db/client";
import { createTurnWorkflow, type TurnWorkflow } from "@/workflow/turn";
import type { ChatServiceDeps } from "./chat-service";
import { render } from "./render";

let workflow: TurnWorkflow | undefined;

/** Production wiring of the chat service: real agents, renderer, database and env. */
export function chatDeps(): ChatServiceDeps {
  workflow ??= createTurnWorkflow({
    checkMessage,
    extract,
    render,
    guardModel: () => model("fast"),
    newReplyId: () => randomBytes(9).toString("base64url"),
  });
  return {
    db: getDb(),
    workflow,
    models: () => ({ fast: model("fast"), writer: model("writer") }),
    limits: () => dailyLimits(),
    now: () => new Date(),
  };
}
