import { describe, expect, it } from "vitest";
import { checkSection, type WrittenBlock } from "./guard";
import type { Bounds } from "./sections";

const bounds: Bounds = { minWords: 5, targetWords: 15, maxWords: 30, maxBullets: 3 };
const paragraph = (text: string): WrittenBlock => ({ kind: "paragraph", text });
const ok = paragraph("Gestirai il piano editoriale dei nostri canali social.");
const code = (blocks: WrittenBlock[], forced: string | null = null, b = bounds) => checkSection(blocks, b, forced)?.code ?? null;

describe("checkSection", () => {
  it("accepts a clean section", () => {
    expect(code([ok, { kind: "bullets", items: ["Montare video brevi.", "Curare i report."] }])).toBeNull();
  });

  it("rejects salary figures", () => {
    expect(code([paragraph("Offriamo 40.000 euro lordi annui e buoni pasto.")])).toBe("salary");
    expect(code([paragraph("La RAL è in linea con il mercato di oggi.")])).toBe("salary");
  });

  it("rejects brackets, markdown, html, list markers and emoji", () => {
    expect(code([paragraph("Gestirai [Da definire] il piano editoriale.")])).toBe("markup");
    expect(code([paragraph("## Cosa farai nel ruolo ogni giorno")])).toBe("markup");
    expect(code([paragraph("Gestirai il **piano** editoriale dei canali.")])).toBe("markup");
    expect(code([paragraph("Gestirai il piano <b>editoriale</b> dei canali.")])).toBe("markup");
    expect(code([{ kind: "bullets", items: ["- Montare video brevi agli eventi."] }, ok])).toBe("markup");
    expect(code([paragraph("Gestirai il piano editoriale dei canali 🚀")])).toBe("emoji");
  });

  it("checks length and bullet bounds", () => {
    expect(code([paragraph("Troppo corto.")])).toBe("tooShort");
    expect(code([paragraph(Array.from({ length: 31 }, () => "parola").join(" "))])).toBe("tooLong");
    expect(code([{ kind: "bullets", items: ["Uno due tre.", "Quattro cinque.", "Sei.", "Sette."] }])).toBe("tooManyBullets");
    expect(code([ok, { kind: "bullets", items: ["Uno."] }], null, { ...bounds, maxBullets: 0 })).toBe("bulletsNotAllowed");
    expect(code([])).toBe("tooShort");
  });

  it("requires the forced wording verbatim and exempts it from content and length checks", () => {
    const forced = "Il nostro [motto]: crescere insieme, con 1.000 € di formazione all'anno e tanto altro ancora davvero.";
    expect(code([ok], forced)).toBe("forcedWordingMissing");
    expect(code([paragraph(forced), ok], forced)).toBeNull();
    expect(code([paragraph(`${forced}  Gestirai il piano.`)], `${forced}\n`)).toBeNull();
  });
});
