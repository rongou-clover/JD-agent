import type { Posting } from "@/render/contract";
import { PostingView } from "./PostingView";

/**
 * Right pane: the posting as a document page at its normal size. A long posting scrolls inside
 * this pane only; the page never scrolls (docs/decisioni.md). It is the only thing printed for the PDF export.
 */
export function PreviewPane({ posting }: { posting: Posting | null }) {
  return (
    <section
      aria-label="Anteprima job description"
      className="flex min-h-0 min-w-0 flex-[999_1_560px] flex-col items-center overflow-y-auto px-6 py-5 print:block print:overflow-visible print:p-0"
    >
      <article className="w-full max-w-[720px] flex-none border border-border bg-white px-12 py-9 font-document text-sm leading-[1.55] text-gray-800 shadow-[0_1px_3px_#11182714] print:max-w-none print:border-none print:p-0 print:shadow-none">
        {posting ? <PostingView posting={posting} /> : <p className="m-0 text-muted-foreground">Caricamento…</p>}
      </article>
    </section>
  );
}
