"use client";

import { useSyncExternalStore } from "react";

/** One is picked at random on each visit (user story Home U3); the last one is the playful one. */
const HEADLINES = [
  "Chi stai cercando?",
  "Chi entra nel tuo team?",
  "Un ruolo, mille mansioni?",
  "Assumere senza tirare a indovinare.",
  "Cerchi un unicorno? Partiamo da qui.",
] as const;

let chosenIndex: number | null = null;

/** With reduced motion (and in the visual tests) the headline is always the first one. */
function clientIndex(): number {
  if (chosenIndex === null) {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    chosenIndex = reduced ? 0 : Math.floor(Math.random() * HEADLINES.length);
  }
  return chosenIndex;
}

const serverIndex = () => 0;
const subscribe = () => () => {};

export function Headline() {
  const index = useSyncExternalStore(subscribe, clientIndex, serverIndex);
  return (
    <h1
      key={index}
      className="m-0 truncate text-[44px] leading-[1.15] font-semibold tracking-[-0.02em] text-foreground motion-safe:animate-title-in"
    >
      {HEADLINES[index]}
    </h1>
  );
}
