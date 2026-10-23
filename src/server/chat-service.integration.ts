import { afterAll, beforeEach, describe, expect, inject, it } from "vitest";
import { createDb } from "@/db/client";
import { messages, sessions, usage } from "@/db/schema";
import { extraction, fakeDeps, FAST, WRITER } from "@/workflow/testing";
import { createTurnWorkflow } from "@/workflow/turn";
import { ApiFailure } from "./api-errors";
import { getSessionView, handleChat, type ChatServiceDeps } from "./chat-service";

const { db, close } = createDb(inject("databaseUrl"));
afterAll(close);
beforeEach(async () => {
  await db.delete(usage);
  await db.delete(messages);
  await db.delete(sessions);
});

const bigLimits = { fast: { input: 1e9, output: 1e9 }, writer: { input: 1e9, output: 1e9 } };

function service(limits = bigLimits): ChatServiceDeps {
  const { deps } = fakeDeps({ extraction: extraction() });
  return { db, workflow: createTurnWorkflow(deps), models: () => ({ fast: FAST, writer: WRITER }), limits: () => limits, now: () => new Date() };
}

async function failure(promise: Promise<unknown>): Promise<string> {
  const error = await promise.then(() => null, (reason: unknown) => reason);
  return error instanceof ApiFailure ? error.code : String(error);
}

describe("chat service", () => {
  it("starts a session, then a quick reply continues it", async () => {
    const deps = service();
    const first = await handleChat({ kind: "start", jobTitleId: "sdr", text: "Cerco un SDR" }, deps);
    expect(first.transcript).toHaveLength(2);
    const confirm = first.transcript[1]?.role === "agent" ? first.transcript[1].message.quickReplies[0] : undefined;
    expect(confirm?.label).toBe("Sì, va bene");

    const second = await handleChat({ kind: "quickReply", sessionId: first.sessionId, replyId: confirm?.id ?? "" }, deps);
    expect(second.transcript[2]).toEqual({ role: "user", text: "Sì, va bene" });
    expect(await getSessionView(db, first.sessionId)).toEqual(second);
    expect(second.checklist.items.find((item) => item.field === "jobTitle")?.done).toBe(true);
  });

  it("rejects a stale quick reply and an unknown session", async () => {
    const deps = service();
    const first = await handleChat({ kind: "start", jobTitleId: "sdr", text: "Cerco un SDR" }, deps);
    expect(await failure(handleChat({ kind: "quickReply", sessionId: first.sessionId, replyId: "old" }, deps))).toBe("invalidRequest");
    const unknown = "00000000-0000-4000-8000-000000000000";
    expect(await failure(handleChat({ kind: "message", sessionId: unknown, text: "Ciao" }, deps))).toBe("sessionNotFound");
  });

  it("stops every turn once a daily limit is reached", async () => {
    const tight = { ...bigLimits, writer: { input: 1e9, output: 50 } };
    const first = await handleChat({ kind: "start", jobTitleId: "sdr", text: "Cerco un SDR" }, service(tight));
    const next = handleChat({ kind: "message", sessionId: first.sessionId, text: "Acme" }, service(tight));
    expect(await failure(next)).toBe("budgetExhausted");
  });

  it("a turn saved while another one runs makes the slower one busy; its tokens still count", async () => {
    const first = await handleChat({ kind: "start", jobTitleId: "sdr", text: "Cerco un SDR" }, service());
    const turn = { kind: "message" as const, sessionId: first.sessionId, text: "Acme" };
    const { deps: slow } = fakeDeps({ extraction: extraction() });
    // The slow turn's renderer lets a whole other turn on the same session finish first.
    const render = slow.render;
    slow.render = async (input, cache) => {
      await handleChat(turn, service());
      return render(input, cache);
    };
    const slowService = { ...service(), workflow: createTurnWorkflow(slow) };
    expect(await failure(handleChat(turn, slowService))).toBe("sessionBusy");
    expect((await getSessionView(db, first.sessionId)).transcript).toHaveLength(4);
    const writerRows = (await db.select().from(usage)).filter((row) => row.model === WRITER);
    expect(writerRows).toHaveLength(3);
  });
});
