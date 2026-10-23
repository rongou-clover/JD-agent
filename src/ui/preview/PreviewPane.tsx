"use client";

import type { CSSProperties } from "react";
import type { Posting } from "@/render/contract";
import { PostingView } from "./PostingView";
import { useFitScale } from "./useFitScale";

/** Right pane: the posting as a document page, scaled down to fit; the only thing printed for the PDF export. */
export function PreviewPane({ posting }: { posting: Posting | null }) {
  const { containerRef, contentRef, scale } = useFitScale<HTMLElement, HTMLElement>();
  const fit = { "--fit": scale } as CSSProperties;

  return (
    <section
      ref={containerRef}
      aria-label="Anteprima job description"
      className="flex min-h-0 min-w-0 flex-[999_1_560px] flex-col items-center overflow-hidden px-6 py-5 print:block print:overflow-visible print:p-0"
    >
      <article
        ref={contentRef}
        style={fit}
        className="w-full max-w-[720px] origin-top [transform:scale(var(--fit))] border border-border bg-white px-12 py-9 font-document text-sm leading-[1.55] text-gray-800 shadow-[0_1px_3px_#11182714] print:max-w-none print:[transform:none] print:border-none print:p-0 print:shadow-none"
      >
        {posting ? <PostingView posting={posting} /> : <p className="m-0 text-muted-foreground">Caricamento…</p>}
      </article>
    </section>
  );
}
