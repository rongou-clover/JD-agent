import { describe, expect, it } from "vitest";
import { SessionView } from "@/api/contract";
import { SESSION_FIXTURES } from "../../../e2e/fixtures";

describe("e2e SessionView fixtures", () => {
  it.each(Object.entries(SESSION_FIXTURES))("%s matches the contract", (_name, fixture) => {
    expect(() => SessionView.parse(fixture)).not.toThrow();
  });

  it("covers the states the UI shows", () => {
    const { diagnosis, questions, complete } = SESSION_FIXTURES;
    expect(diagnosis.transcript.at(-1)).toMatchObject({ role: "agent", message: { quickReplies: [{}, {}, {}] } });
    expect(questions.checklist.complete).toBe(false);
    expect(questions.posting.sections.some((s) => s.blocks.some((b) => b.kind === "placeholder"))).toBe(true);
    expect(complete.checklist.complete).toBe(true);
    expect(complete.sheet.salary).not.toBeNull();
  });
});
