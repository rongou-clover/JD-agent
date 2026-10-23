import { describe, expect, it } from "vitest";
import { completeDraft, withField } from "@/domain/testing";
import type { RenderInput, SectionCache } from "./contract";
import { EQUAL_OPPORTUNITY_TEXT } from "./copy";
import { createRender } from "./create-render";
import { fakeWriter } from "./testing";

const input = (overrides: Partial<RenderInput> = {}): RenderInput => ({
  draft: completeDraft(),
  diagnosis: null,
  forcedWordings: [],
  ...overrides,
});

const ids = (output: Awaited<ReturnType<ReturnType<typeof createRender>>>) => output.output.posting.sections.map((s) => s.id);

describe("render: sections", () => {
  it("writes the sections with data, omits the empty ones, ends with the equal opportunity text", async () => {
    const { write, requests } = fakeWriter();
    const result = await createRender(write)(input(), {});
    expect(ids(result)).toEqual([
      "role",
      "team",
      "activities",
      "results",
      "requirements",
      "niceToHave",
      "howYouWork",
      "practicalInfo",
      "about",
      "equalOpportunity",
    ]);
    expect(requests).toHaveLength(9);
    expect(result.usage).toHaveLength(9);
    const last = result.output.posting.sections.at(-1);
    expect(last?.blocks).toEqual([{ kind: "paragraph", text: EQUAL_OPPORTUNITY_TEXT }]);
  });

  it("puts a placeholder without a model call when a required field is missing", async () => {
    const draft = { ...completeDraft(), sixMonthResults: { value: null, source: null, status: "missing" as const } };
    const { write, requests } = fakeWriter();
    const result = await createRender(write)(input({ draft }), {});
    const results = result.output.posting.sections.find((s) => s.id === "results");
    expect(results?.blocks).toEqual([{ kind: "placeholder" }]);
    expect(requests.map((r) => r.section)).not.toContain("results");
  });

  it("uses 'Cosa imparerai' for S1", async () => {
    const { write } = fakeWriter();
    const result = await createRender(write)(input({ draft: withField(completeDraft(), "seniority", "S1") }), {});
    expect(result.output.posting.sections.find((s) => s.id === "activities")?.heading).toBe("Cosa imparerai");
  });

  it("never sends salary, manager notes or internal skill data to the writer", async () => {
    let draft = withField(completeDraft(), "salary", { min: 40000, max: 48000, inPosting: true });
    draft = withField(draft, "managerNotes", "Nota riservata");
    const { write, requests } = fakeWriter();
    await createRender(write)(input({ draft }), {});
    const sent = JSON.stringify(requests);
    expect(sent).not.toMatch(/40000|48000|Nota riservata|expectedLevel|P3/);
  });
});

describe("render: forced wordings", () => {
  it("passes the forced text to the writer and keeps it in the section", async () => {
    const text = "Qui il tuo lavoro si vede dal primo giorno.";
    const { write, requests } = fakeWriter();
    const result = await createRender(write)(input({ forcedWordings: [{ section: "role", text }] }), {});
    expect(requests.find((r) => r.section === "role")?.forcedWording).toBe(text);
    expect(JSON.stringify(result.output.posting.sections.find((s) => s.id === "role"))).toContain(text);
  });

  it("shows a forced wording for a section without data", async () => {
    const text = "Buoni pasto e formazione.";
    const { write } = fakeWriter();
    const result = await createRender(write)(input({ forcedWordings: [{ section: "offer", text }] }), {});
    expect(result.output.posting.sections.find((s) => s.id === "offer")?.blocks).toEqual([{ kind: "paragraph", text }]);
  });
});

describe("render: output guard", () => {
  it("regenerates once, then falls back to a placeholder that is not cached", async () => {
    const { write, requests } = fakeWriter((request) =>
      request.section === "team" ? [{ kind: "paragraph", text: "RAL 40.000 euro lordi annui, team di sei persone." }] : [],
    );
    const result = await createRender(write)(input(), {});
    const teamRequests = requests.filter((r) => r.section === "team");
    expect(teamRequests).toHaveLength(2);
    expect(teamRequests.at(1)?.retryReason).toMatch(/^salary/);
    expect(result.output.posting.sections.find((s) => s.id === "team")?.blocks).toEqual([{ kind: "placeholder" }]);
    expect(result.output.cache.team).toBeUndefined();
  });
});

describe("render: section cache", () => {
  it("reuses every unchanged section without model calls", async () => {
    const first = await createRender(fakeWriter().write)(input(), {});
    const { write, requests } = fakeWriter();
    const second = await createRender(write)(input(), first.output.cache);
    expect(requests).toHaveLength(0);
    expect(second.usage).toEqual([]);
    expect(second.output.posting).toEqual(first.output.posting);
  });

  it("re-renders only the sections that depend on a changed field", async () => {
    const first = await createRender(fakeWriter().write)(input(), {});
    const draft = withField(completeDraft(), "softSkills", ["Precisione"]);
    const { write, requests } = fakeWriter();
    await createRender(write)(input({ draft }), first.output.cache);
    expect(requests.map((r) => r.section)).toEqual(["howYouWork"]);
  });

  it("re-renders a section when its forced wording or a heading-changing seniority changes", async () => {
    const first = await createRender(fakeWriter().write)(input(), {});
    const { write, requests } = fakeWriter();
    const draft = withField(completeDraft(), "seniority", "S1");
    await createRender(write)(input({ draft, forcedWordings: [{ section: "team", text: "Siamo in sei." }] }), first.output.cache);
    expect(requests.map((r) => r.section).sort()).toEqual(["activities", "requirements", "team"]);
  });

  it("drops sections that are no longer written from the returned cache", async () => {
    const first = await createRender(fakeWriter().write)(input(), {});
    const draft = { ...completeDraft(), team: { value: null, source: null, status: "missing" as const } };
    const second = await createRender(fakeWriter().write)(input({ draft }), first.output.cache);
    const cache: SectionCache = second.output.cache;
    expect(cache.team).toBeUndefined();
    expect(cache.role).toEqual(first.output.cache.role);
  });
});
