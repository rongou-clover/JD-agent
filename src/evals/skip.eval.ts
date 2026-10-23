import { describe, expect, it } from "vitest";
import { extract } from "@/agents/extractor/agent";
import type { Draft } from "@/domain/draft";
import { completeDraft, withField, without } from "@/domain/testing";

/** An SDR draft complete except for the given fields, as when the agent asks about them. */
const sdrDraft = (...missing: Parameters<typeof without>[1][]): Draft =>
  without(withField(withField(completeDraft(), "jobTitle", { kind: "catalog", id: "sdr" }), "seniority", "S1"), ...missing);

describe("'non lo so' on an asked required field", () => {
  it("derivable (six-month results): the extractor proposes a value, inferred, and lists the field as skipped", async () => {
    const { output } = await extract({
      message: "Non lo so, decidi tu",
      draft: sdrDraft("sixMonthResults"),
      askedFields: ["sixMonthResults"],
      lastAskFields: [],
    });
    console.log("sixMonthResults", JSON.stringify(output.updates.sixMonthResults), output.skipped, output.intent);
    expect(output.intent).toBe("answer");
    expect(output.skipped).toContain("sixMonthResults");
    expect(output.updates.sixMonthResults?.source).toBe("inferred");
    expect(output.updates.sixMonthResults?.value.length).toBeGreaterThanOrEqual(2);
  });

  it("not derivable (location): nothing is invented, the field is listed as skipped", async () => {
    const { output } = await extract({ message: "Non lo so", draft: sdrDraft("location"), askedFields: ["location"], lastAskFields: [] });
    console.log("location", JSON.stringify(output.updates.location), output.skipped, output.intent);
    expect(output.skipped).toContain("location");
    expect(output.updates.location).toBeNull();
  });
});
