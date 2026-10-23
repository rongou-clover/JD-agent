"use client";

import { useState } from "react";
import type { SessionView } from "@/api/contract";
import { CheckIcon } from "@/ui/icons";

type Checklist = SessionView["checklist"];

/** "Checklist X di Y" with a progress bar; hover or focus opens the list of required items. */
export function ChecklistMenu({ checklist }: { checklist: Checklist }) {
  const [open, setOpen] = useState(false);
  const percent = checklist.totalCount === 0 ? 0 : Math.round((100 * checklist.doneCount) / checklist.totalCount);

  return (
    <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="inline-flex min-h-10 cursor-default items-center gap-2.5 rounded-lg border border-transparent bg-transparent px-3 text-[13px] text-body"
      >
        {checklist.complete ? (
          <span className="inline-flex items-center gap-2 font-semibold text-accent-foreground">
            <span aria-hidden="true" className="text-lg">
              🎉
            </span>
            JD pronta
          </span>
        ) : (
          <span>
            Checklist {checklist.doneCount} di {checklist.totalCount}
          </span>
        )}
        <span aria-hidden="true" className="block h-1.5 w-[120px] overflow-hidden rounded-full bg-border">
          <span className="block h-full bg-accent transition-[width] duration-400" style={{ width: `${percent}%` }} />
        </span>
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="Checklist della JD"
          className="absolute top-[46px] right-0 z-10 flex w-[280px] flex-col gap-2 rounded-xl border border-border bg-white px-4 py-3.5 shadow-[0_12px_32px_-12px_#062e3a40]"
        >
          <p className="m-0 mb-0.5 text-[13px] font-semibold text-foreground">Voci della JD</p>
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {checklist.items.map((item) => (
              <li key={item.field} className="flex min-h-6 items-center gap-2.5 text-[13px]">
                <span
                  role="checkbox"
                  aria-checked={item.done}
                  aria-label={item.label}
                  className={`inline-flex size-4 flex-none items-center justify-center rounded ${
                    item.done ? "border border-accent bg-accent text-white" : "border-[1.5px] border-gray-400 bg-white"
                  }`}
                >
                  {item.done && <CheckIcon size={12} />}
                </span>
                <span className={item.done ? "text-muted-foreground" : "font-medium text-foreground"}>{item.label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
