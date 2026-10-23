import { describe, expect, it } from "vitest";
import { parseBold } from "./bold";

describe("parseBold", () => {
  it("returns plain text as one span", () => {
    expect(parseBold("Ciao")).toEqual([{ text: "Ciao", bold: false }]);
  });

  it("splits bold spans", () => {
    expect(parseBold("Ti propongo **Content Manager**, livello **S2**. Va bene?")).toEqual([
      { text: "Ti propongo ", bold: false },
      { text: "Content Manager", bold: true },
      { text: ", livello ", bold: false },
      { text: "S2", bold: true },
      { text: ". Va bene?", bold: false },
    ]);
  });

  it("handles bold at the start and end", () => {
    expect(parseBold("**Sì**")).toEqual([{ text: "Sì", bold: true }]);
  });

  it("keeps an unmatched marker as literal text", () => {
    expect(parseBold("2 ** 3 fa 8")).toEqual([{ text: "2 ** 3 fa 8", bold: false }]);
    expect(parseBold("**a** e **b")).toEqual([
      { text: "a", bold: true },
      { text: " e **b", bold: false },
    ]);
  });

  it("keeps an empty pair as literal text", () => {
    expect(parseBold("a****b")).toEqual([{ text: "a****b", bold: false }]);
  });

  it("returns no spans for an empty string", () => {
    expect(parseBold("")).toEqual([]);
  });
});

