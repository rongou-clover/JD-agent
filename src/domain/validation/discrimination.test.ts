import { describe, expect, it } from "vitest";
import { findDiscrimination } from "./discrimination";

const categories = (text: string) => findDiscrimination(text).map((match) => match.category);

describe("findDiscrimination", () => {
  it.each([
    ["Cerchiamo un candidato under 30", "age"],
    ["Età massima 35 anni", "age"],
    ["Max 30 anni", "age"],
    ["Persone tra 25-35 anni", "age"],
    ["Cerchiamo un giovane talento", "age"],
    ["Cerchiamo un candidato giovane", "age"],
    ["Cerchiamo una ragazza solare", "gender"],
    ["Preferibilmente donna", "gender"],
    ["Commerciale (m)", "gender"],
    ["Stato civile: celibe", "maritalStatus"],
    ["Meglio se senza figli", "maritalStatus"],
    ["Preferibilmente sposata", "maritalStatus"],
    ["Nazionalità italiana", "nationality"],
    ["Cittadinanza UE", "nationality"],
    ["Solo italiani", "nationality"],
  ])("flags %s", (text, category) => {
    expect(categories(text)).toContain(category);
  });

  it.each([
    "2-4 anni di esperienza nella gestione di canali social",
    "Almeno 10-15 anni di esperienza in vendita",
    "Max 10 anni di esperienza",
    "Il candidato ideale ha esperienza B2B",
    "Un ambiente giovane e dinamico",
    "Inglese madrelingua o C2",
    "Commerciale (m/f)",
    "Gestirai un budget di circa 500 € al mese",
  ])("does not flag %s", (text) => {
    expect(findDiscrimination(text)).toEqual([]);
  });
});
