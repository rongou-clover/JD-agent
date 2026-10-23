import { randomBytes } from "node:crypto";
import { extract } from "@/agents/extractor/agent";
import { model } from "@/agents/models";
import { checkMessage } from "@/agents/prompt-injection/guard";
import { diagnose } from "@/agents/role-diagnosis/agent";
import { dailyLimits } from "@/budget/daily-limit";
import { getDb } from "@/db/client";
import { createTurnWorkflow, type TurnWorkflow } from "@/workflow/turn";
import type { ChatServiceDeps } from "./chat-service";
import type { RenderServiceDeps } from "./render-service";
import { render } from "./render";

let workflow: TurnWorkflow | undefined;

/** Production wiring of the chat and render services: real agents, renderer, database and env. */
export function chatDeps(): ChatServiceDeps & RenderServiceDeps {
  workflow ??= createTurnWorkflow({
    checkMessage,
    extract,
    diagnose,
    guardModel: () => model("fast"),
    newReplyId: () => randomBytes(9).toString("base64url"),
  });
  return {
    db: getDb(),
    workflow,
    render,
    models: () => ({ fast: model("fast"), writer: model("writer") }),
    limits: () => dailyLimits(),
    now: () => new Date(),
  };
}
