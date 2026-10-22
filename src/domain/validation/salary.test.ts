import { describe, expect, it } from "vitest";
import { findSalaryMention } from "./salary";

describe("findSalaryMention", () => {
  it.each([
    "RAL 35.000",
    "Retribuzione fino a 40.000",
    "35.000 € lordi annui",
    "40k annui",
    "Stipendio di 2.000 euro",
  ])("flags %s", (text) => {
    expect(findSalaryMention(text)).not.toBeNull();
  });

  it.each([
    "Gestirai un budget di circa 500 € al mese",
    "Impianto da 300 tonnellate l'anno",
    "Retribuzione competitiva",
    "Lavoriamo con 20 clienti",
  ])("does not flag %s", (text) => {
    expect(findSalaryMention(text)).toBeNull();
  });
});
