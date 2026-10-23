import { describe, expect, it } from "vitest";
import { parseClientId } from "@/auth/client-id";
import { emptyDraft } from "@/domain/draft";
import { completeDraft, withField } from "@/domain/testing";
import { toSessionSummary } from "./session-summary";

const updatedAt = new Date("2026-10-23T10:00:00.000Z");
const id = "3f6c1d2e-8a4b-4c5d-9e7f-0a1b2c3d4e5f";

describe("toSessionSummary", () => {
  it("summarises a new chat as unknown role and company", () => {
    expect(toSessionSummary({ id, draft: emptyDraft(), updatedAt })).toEqual({
      sessionId: id,
      title: null,
      companyName: null,
      updatedAt: "2026-10-23T10:00:00.000Z",
      doneCount: 0,
      totalCount: 12,
      complete: false,
    });
  });

  it("uses the catalog name, or the out-of-catalog title", () => {
    const draft = withField(completeDraft(), "jobTitle", { kind: "catalog", id: "sdr" });
    expect(toSessionSummary({ id, draft, updatedAt })).toMatchObject({ title: "SDR", companyName: "Human Maple", complete: true });
    const other = withField(emptyDraft(), "jobTitle", { kind: "outOfCatalog", title: "Office Manager" });
    expect(toSessionSummary({ id, draft: other, updatedAt }).title).toBe("Office Manager");
  });
});

describe("parseClientId", () => {
  it("accepts only a uuid", () => {
    expect(parseClientId(id)).toBe(id);
    expect(parseClientId("not-an-id")).toBeNull();
    expect(parseClientId(undefined)).toBeNull();
  });
});
