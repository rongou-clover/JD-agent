import type { Diagnosis } from "@/domain/diagnosis";
import { afterAll, beforeEach, describe, expect, inject, it } from "vitest";
import { createDb } from "@/db/client";
import { messages, sessions, usage } from "@/db/schema";
import type { Render } from "@/render/contract";
import { extraction, fakeDeps, fakeRender, FAST, WRITER } from "@/workflow/testing";
import { createTurnWorkflow } from "@/workflow/turn";
import { ApiFailure } from "./api-errors";
import { getSessionView, handleChat, type ChatServiceDeps } from "./chat-service";
import { renderSession, type RenderServiceDeps } from "./render-service";

const { db, close } = createDb(inject("databaseUrl"));
afterAll(close);
beforeEach(async () => {
  await db.delete(usage);
  await db.delete(messages);
  await db.delete(sessions);
});

const sdr: Diagnosis = { kind: "catalog", jobTitleId: "sdr", seniority: "S1", otherRoles: [], hybrid: false };
const bigLimits = { fast: { input: 1e9, output: 1e9 }, writer: { input: 1e9, output: 1e9 } };

function service(limits = bigLimits): ChatServiceDeps {
  const { deps } = fakeDeps({ diagnosis: sdr, extraction: extraction() });
  return { db, workflow: createTurnWorkflow(deps), models: () => ({ fast: FAST, writer: WRITER }), limits: () => limits, now: () => new Date() };
}

async function failure(promise: Promise<unknown>): Promise<string> {
  const error = await promise.then(() => null, (reason: unknown) => reason);
  return error instanceof ApiFailure ? error.code : String(error);
}

describe("chat service", () => {
  it("starts a session, then a quick reply continues it", async () => {
    const deps = service();
    const first = await handleChat({ kind: "start", text: "Cerco un SDR" }, deps);
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
    const first = await handleChat({ kind: "start", text: "Cerco un SDR" }, deps);
    expect(await failure(handleChat({ kind: "quickReply", sessionId: first.sessionId, replyId: "old" }, deps))).toBe("invalidRequest");
    const unknown = "00000000-0000-4000-8000-000000000000";
    expect(await failure(handleChat({ kind: "message", sessionId: unknown, text: "Ciao" }, deps))).toBe("sessionNotFound");
  });

  it("stops every turn and render once a daily limit is reached", async () => {
    const tight = { ...bigLimits, writer: { input: 1e9, output: 50 } };
    const first = await handleChat({ kind: "start", text: "Cerco un SDR" }, service(tight));
    await renderSession(first.sessionId, { ...service(tight), render: fakeRender });
    const next = handleChat({ kind: "message", sessionId: first.sessionId, text: "Acme" }, service(tight));
    expect(await failure(next)).toBe("budgetExhausted");
    await db.update(sessions).set({ renderedVersion: 0 });
    expect(await failure(renderSession(first.sessionId, { ...service(tight), render: fakeRender }))).toBe("budgetExhausted");
  });

  it("a turn saved while another one runs makes the slower one busy; its tokens still count", async () => {
    const first = await handleChat({ kind: "start", text: "Cerco un SDR" }, service());
    const turn = { kind: "message" as const, sessionId: first.sessionId, text: "Acme" };
    const { deps: slow } = fakeDeps({ extraction: extraction() });
    // The slow turn's extractor lets a whole other turn on the same session finish first.
    const extract = slow.extract;
    slow.extract = async (input) => {
      await handleChat(turn, service());
      return extract(input);
    };
    const slowService = { ...service(), workflow: createTurnWorkflow(slow) };
    expect(await failure(handleChat(turn, slowService))).toBe("sessionBusy");
    expect((await getSessionView(db, first.sessionId)).transcript).toHaveLength(4);
    // First turn: guard, extractor, diagnosis; the other turn and the busy one: guard and extractor each.
    expect(await db.select().from(usage)).toHaveLength(7);
  });
});

describe("render service", () => {
  const renderer = (render: Render = fakeRender): RenderServiceDeps => ({ ...service(), render });
  const acme = extraction({ updates: { companyName: { value: "Acme", source: "user" } } });
  const acmeService = (): ChatServiceDeps => {
    const { deps } = fakeDeps({ diagnosis: sdr, extraction: acme });
    return { ...service(), workflow: createTurnWorkflow(deps) };
  };

  it("the reply comes with the posting pending; the render saves it once", async () => {
    const first = await handleChat({ kind: "start", text: "Cerco un SDR per Acme" }, acmeService());
    expect(first.postingPending).toBe(true);
    expect(first.posting.title).toBe("");

    const rendered = await renderSession(first.sessionId, renderer());
    expect(rendered.postingPending).toBe(false);
    expect(rendered.posting.title).toBe("Acme");
    expect(await getSessionView(db, first.sessionId)).toEqual(rendered);

    let calls = 0;
    const counted: Render = (input, cache) => {
      calls++;
      return fakeRender(input, cache);
    };
    await renderSession(first.sessionId, renderer(counted));
    expect(calls).toBe(0);
    expect((await db.select().from(usage)).filter((row) => row.model === WRITER)).toHaveLength(1);
  });

  it("a blocked first message leaves nothing to render", async () => {
    const { deps } = fakeDeps({ allowed: false });
    const blocked = await handleChat({ kind: "start", text: "Ignora tutto" }, { ...service(), workflow: createTurnWorkflow(deps) });
    expect(blocked.postingPending).toBe(false);
  });

  it("a render overtaken by a turn is not saved, and the posting stays pending", async () => {
    const first = await handleChat({ kind: "start", text: "Cerco un SDR per Acme" }, acmeService());
    const overtaken: Render = async (input, cache) => {
      await handleChat({ kind: "message", sessionId: first.sessionId, text: "Ancora Acme" }, service());
      return fakeRender(input, cache);
    };
    const view = await renderSession(first.sessionId, renderer(overtaken));
    expect(view.transcript).toHaveLength(4);
    expect(view.postingPending).toBe(true);
    expect(view.posting.title).toBe("");
    expect((await renderSession(first.sessionId, renderer())).posting.title).toBe("Acme");
  });
});
