"use client";

import { useState, type FocusEvent } from "react";
import type { Posting } from "@/render/contract";
import { EXPORT_FORMATS, EXPORT_LABELS, exportPosting, type ExportFormat } from "@/ui/export/download";
import { DownloadIcon } from "@/ui/icons";

/** "Esporta" button with HTML, Markdown and PDF (print dialog). */
export function ExportMenu({ posting }: { posting: Posting | null }) {
  const [open, setOpen] = useState(false);

  function closeOnFocusOut(event: FocusEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
  }

  function choose(format: ExportFormat) {
    setOpen(false);
    if (posting) exportPosting(posting, format);
  }

  return (
    <div className="relative" onBlur={closeOnFocusOut} onKeyDown={(event) => event.key === "Escape" && setOpen(false)}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        disabled={posting === null}
        className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        <DownloadIcon />
        Esporta
      </button>
      {open && (
        <div
          role="menu"
          className="absolute top-12 right-0 z-10 flex w-[200px] flex-col rounded-lg border border-border bg-white p-1.5 shadow-[0_12px_32px_-12px_#062e3a40]"
        >
          {EXPORT_FORMATS.map((format) => (
            <button
              key={format}
              type="button"
              role="menuitem"
              onClick={() => choose(format)}
              className="min-h-10 cursor-pointer rounded-lg px-3 text-left text-sm text-foreground hover:bg-surface"
            >
              {EXPORT_LABELS[format]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
