import { describe, expect, it } from "vitest";
import type { FieldId } from "@/domain/fields";
import { completeDraft, withField, without } from "@/domain/testing";
import { COPY } from "./templates/copy";
import { extraction, messageTurn as turn, session } from "./testing";

const sdrDraft = (...missing: FieldId[]) =>
  without(withField(withField(completeDraft(), "jobTitle", { kind: "catalog", id: "sdr" }), "seniority", "S1"), ...missing);

describe("skipped fields", () => {
  it("a derivable field is proposed by the extractor and announced", async () => {
    const results = ["10 demo fissate al mese", "CRM aggiornato ogni settimana"];
    const found = extraction({ skipped: ["sixMonthResults"], updates: { sixMonthResults: { value: results, source: "inferred" } } });
    const result = await turn(session(sdrDraft("sixMonthResults"), ["sixMonthResults"]), found);
    expect(result.state.draft.sixMonthResults).toEqual({ value: results, source: "inferred", status: "proposed" });
    expect(result.message.text.startsWith(COPY.proposedOnSkip("**Risultati a 6 mesi**"))).toBe(true);
    expect(result.state.planner.skipped).toEqual([]);
  });

  it("skills of a catalog role come from the catalog, never from the extractor", async () => {
    const guessed = [{ name: "Excel", required: true, expectedLevel: null, typicalMistake: null }];
    const found = extraction({
      skipped: ["technicalSkills", "softSkills"],
      updates: { technicalSkills: { value: guessed, source: "inferred" } },
    });
    const result = await turn(session(sdrDraft("technicalSkills", "softSkills"), ["technicalSkills", "softSkills"]), found, "Decidi tu");
    const { technicalSkills, softSkills } = result.state.draft;
    expect(technicalSkills.source).toBe("catalog");
    expect(technicalSkills.value?.map((skill) => skill.name)).toContain("Aprire una cold call");
    expect(softSkills).toMatchObject({ source: "catalog", status: "proposed" });
    expect(softSkills.value).toHaveLength(4);
    expect(result.message.text).toContain(COPY.proposedOnSkip("**Skill tecniche** e **Skill trasversali**"));
  });

  it("out of catalog: the extractor's skill proposal stays; without one the field is left open", async () => {
    const draft = withField(sdrDraft("technicalSkills", "softSkills"), "jobTitle", { kind: "outOfCatalog", title: "Agronomo" });
    const skills = ["Analisi del suolo", "Agronomia", "GIS"].map((name) => ({ name, required: true, expectedLevel: null, typicalMistake: null }));
    const found = extraction({
      skipped: ["technicalSkills", "softSkills"],
      updates: { technicalSkills: { value: skills, source: "inferred" } },
    });
    const result = await turn(session(draft, ["technicalSkills", "softSkills"]), found);
    expect(result.state.draft.technicalSkills).toMatchObject({ source: "inferred", status: "proposed" });
    expect(result.state.draft.softSkills.status).toBe("missing");
    expect(result.state.planner.skipped).toEqual(["softSkills"]);
    expect(result.message.text).toContain(COPY.leftOpen("**Skill trasversali**"));
  });

  it("a non-derivable field is not asked again and is listed at the end, until the user gives it", async () => {
    const draft = without(completeDraft(), "location", "contract");
    const first = await turn(session(draft, ["location", "contract"]), extraction({ skipped: ["location"] }));
    expect(first.state.planner.skipped).toEqual(["location"]);
    expect(first.message.text).toContain(COPY.leftOpen("**Sede e modalità**"));
    expect(first.message.questions).toEqual(["Che tipo di contratto offri?"]);

    const contract = { value: { type: "permanent" as const, months: null, ccnl: null, level: null }, source: "user" as const };
    const second = await turn(first.state, extraction({ updates: { contract } }), "Indeterminato");
    expect(second.message.questions).toEqual([]);
    expect(second.message.text.startsWith(COPY.stillMissing("**Sede e modalità**"))).toBe(true);
    expect(second.message.text).toContain(COPY.optionalIntro);

    const third = await turn(second.state, extraction(), "No, va bene così");
    expect(third.message.text).toBe(COPY.doneWithMissing("**Sede e modalità**"));

    const location = { value: { city: "Roma", mode: "onsite" as const, officeDays: null, schedule: null, travel: null }, source: "user" as const };
    const fourth = await turn(third.state, extraction({ updates: { location } }), "Ah, lavora a Roma in ufficio");
    expect(fourth.state.planner.skipped).toEqual([]);
    expect(fourth.message.text).toBe(COPY.done);
  });

  it("ignores a skipped field that was not asked", async () => {
    const result = await turn(session(sdrDraft("team", "location"), ["team"]), extraction({ skipped: ["location"] }));
    expect(result.state.planner.skipped).toEqual([]);
    expect(result.state.planner.askedFields).toEqual(["team"]);
  });
});
