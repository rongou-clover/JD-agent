"use client";

import { useState, type ReactNode } from "react";
import type { InternalSheet, Posting } from "@/render/contract";
import { PostingView } from "./PostingView";
import { panelId, PreviewTabs, tabId, type PreviewTab } from "./PreviewTabs";
import { SheetView } from "./SheetView";
import { SHEET_COPY } from "./sheet-copy";

function Muted({ children }: { children: ReactNode }) {
  return <p className="m-0 text-muted-foreground">{children}</p>;
}

const LOADING = "Caricamento…";

/**
 * One tab panel: a document page that scrolls inside the panel only; the page never scrolls (docs/decisioni.md).
 * Both panels stay mounted so that print shows the posting and never the sheet, whatever tab is selected.
 */
function Panel({ tab, selected, children }: { tab: PreviewTab; selected: PreviewTab; children: ReactNode }) {
  const visibility = tab === selected ? "flex" : "hidden";
  const print = tab === "posting" ? "print:block print:overflow-visible print:p-0" : "print:hidden";
  return (
    <div
      role="tabpanel"
      id={panelId(tab)}
      aria-labelledby={tabId(tab)}
      tabIndex={0}
      className={`${visibility} min-h-0 flex-1 flex-col items-center overflow-y-auto px-6 pt-4 pb-5 ${print}`}
    >
      <article className="w-full max-w-[720px] flex-none border border-border bg-white px-12 py-9 font-document text-sm leading-[1.55] text-gray-800 shadow-[0_1px_3px_#11182714] print:max-w-none print:border-none print:p-0 print:shadow-none">
        {children}
      </article>
    </div>
  );
}

/** Right pane: "Annuncio" and "Scheda interna" tabs over a document page. Only the posting is printed for the PDF export. */
export function PreviewPane({ posting, sheet }: { posting: Posting | null; sheet: InternalSheet | null }) {
  const [selected, setSelected] = useState<PreviewTab>("posting");
  return (
    <section aria-label="Anteprima job description" className="flex min-h-0 min-w-0 flex-[999_1_560px] flex-col print:block">
      <PreviewTabs selected={selected} onSelect={setSelected} />
      <Panel tab="posting" selected={selected}>
        {posting ? <PostingView posting={posting} /> : <Muted>{LOADING}</Muted>}
      </Panel>
      <Panel tab="sheet" selected={selected}>
        {sheet ? <SheetView sheet={sheet} /> : <Muted>{posting ? SHEET_COPY.empty : LOADING}</Muted>}
      </Panel>
    </section>
  );
}
