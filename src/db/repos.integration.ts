import { afterAll, beforeEach, describe, expect, inject, it } from "vitest";
import type { AgentMessage } from "@/api/contract";
import { initialState } from "@/workflow/state";
import { createDb } from "./client";
import { loadSession, recordUsage, saveTurn, SessionBusyError } from "./sessions-repo";
import { messages, sessions, usage } from "./schema";
import { usageTotalsSince } from "./usage-repo";

const { db, close } = createDb(inject("databaseUrl"));
afterAll(close);
beforeEach(async () => {
  await db.delete(usage);
  await db.delete(messages);
  await db.delete(sessions);
});

const reply: AgentMessage = { text: "Ciao", questions: ["Domanda?"], quickReplies: [{ id: "r1", label: "Sì" }] };
const fastUsage = { model: "m/fast", inputTokens: 10, outputTokens: 3 };

describe("sessions repository", () => {
  it("creates a session and loads state and transcript in order", async () => {
    const id = await saveTurn(db, { session: null, state: initialState(), userText: "Primo", agentMessage: reply, usage: [fastUsage] });
    const second = { ...initialState(), planner: { ...initialState().planner, optionalOffered: true } };
    await saveTurn(db, { session: { id, version: 1 }, state: second, userText: "Secondo", agentMessage: reply, usage: [] });

    const loaded = await loadSession(db, id);
    expect(loaded?.version).toBe(2);
    expect(loaded?.state).toEqual(second);
    expect(loaded?.transcript).toEqual([
      { role: "user", text: "Primo" },
      { role: "agent", message: reply },
      { role: "user", text: "Secondo" },
      { role: "agent", message: reply },
    ]);
  });

  it("returns null for an unknown session", async () => {
    expect(await loadSession(db, "00000000-0000-4000-8000-000000000000")).toBeNull();
  });

  it("a stale version is busy and saves nothing", async () => {
    const id = await saveTurn(db, { session: null, state: initialState(), userText: "Primo", agentMessage: reply, usage: [] });
    const turn = { session: { id, version: 1 }, state: initialState(), userText: "A", agentMessage: reply, usage: [fastUsage] };
    const results = await Promise.allSettled([saveTurn(db, turn), saveTurn(db, { ...turn, userText: "B" })]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    const rejected = results.find((result) => result.status === "rejected");
    expect(rejected?.status === "rejected" && rejected.reason).toBeInstanceOf(SessionBusyError);
    expect((await loadSession(db, id))?.transcript).toHaveLength(4);
    expect(await db.select().from(usage)).toHaveLength(1);
  });
});

describe("usage repository", () => {
  it("sums tokens per model since the given instant", async () => {
    await recordUsage(db, null, [fastUsage, fastUsage, { model: "m/writer", inputTokens: 100, outputTokens: 20 }]);
    await db.insert(usage).values({ model: "m/fast", inputTokens: 1000, outputTokens: 1000, createdAt: new Date("2020-01-01") });
    const totals = await usageTotalsSince(db, new Date("2021-01-01"));
    expect(totals.sort((a, b) => a.model.localeCompare(b.model))).toEqual([
      { model: "m/fast", input: 20, output: 6 },
      { model: "m/writer", input: 100, output: 20 },
    ]);
  });
});
