import { describe, expect, it } from "vitest";
import type { Posting } from "@/render/contract";
import { escapeHtml, postingToHtml } from "./html";
import { postingToMarkdown } from "./markdown";
import { fileSlug } from "./posting-text";

const posting: Posting = {
  title: "Content & Social Media Manager",
  summary: [
    { label: "Azienda", value: "Human Maple" },
    { label: "Modalità", value: null },
  ],
  sections: [
    { id: "role", heading: "Il ruolo", blocks: [{ kind: "paragraph", text: "Una posizione <nuova>." }] },
    { id: "activities", heading: "Cosa farai", blocks: [{ kind: "bullets", items: ["Video per Reels", "Grafica"] }] },
    { id: "results", heading: "Nei primi 6 mesi", blocks: [{ kind: "placeholder" }] },
  ],
};

describe("postingToMarkdown", () => {
  it("renders title, summary, sections and placeholders", () => {
    expect(postingToMarkdown(posting)).toBe(
      [
        "# Content & Social Media Manager",
        "- **Azienda:** Human Maple\n- **Modalità:** [Da definire in chat]",
        "## Il ruolo",
        "Una posizione <nuova>.",
        "## Cosa farai",
        "- Video per Reels\n- Grafica",
        "## Nei primi 6 mesi",
        "[Da definire in chat]",
      ].join("\n\n") + "\n",
    );
  });

  it("omits the summary list when empty", () => {
    expect(postingToMarkdown({ ...posting, summary: [], sections: [] })).toBe("# Content & Social Media Manager\n");
  });
});

describe("postingToHtml", () => {
  const html = postingToHtml(posting);

  it("is a standalone Italian document titled after the posting", () => {
    expect(html.startsWith("<!doctype html>")).toBe(true);
    expect(html).toContain('<html lang="it">');
    expect(html).toContain("<title>Content &amp; Social Media Manager</title>");
  });

  it("renders summary, paragraphs, bullets and placeholders", () => {
    expect(html).toContain("<li><strong>Azienda:</strong> Human Maple</li>");
    expect(html).toContain('<li><strong>Modalità:</strong> <span class="placeholder">[Da definire in chat]</span></li>');
    expect(html).toContain("<h2>Cosa farai</h2><ul><li>Video per Reels</li><li>Grafica</li></ul>");
    expect(html).toContain('<h2>Nei primi 6 mesi</h2><p><span class="placeholder">');
  });

  it("escapes text", () => {
    expect(html).toContain("<p>Una posizione &lt;nuova&gt;.</p>");
    expect(escapeHtml(`"a" & 'b'`)).toBe("&quot;a&quot; &amp; &#39;b&#39;");
  });
});

describe("fileSlug", () => {
  it("builds an ASCII file name", () => {
    expect(fileSlug("Content & Social Media Manager")).toBe("content-social-media-manager");
    expect(fileSlug("Responsabile Attività")).toBe("responsabile-attivita");
    expect(fileSlug("!!!")).toBe("job-description");
  });
});
