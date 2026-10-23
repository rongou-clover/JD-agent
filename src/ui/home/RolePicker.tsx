"use client";

import { useEffect, useRef, useState } from "react";
import { catalog, findJobTitle } from "@/domain/catalog";
import { ChevronDownIcon } from "@/ui/icons";

const LABEL_ID = "role-label";

/** Catalog job titles grouped by job family, in catalog order. */
const FAMILIES = catalog.jobFamilies.map((family) => ({
  family,
  jobTitles: catalog.jobTitles.filter((jobTitle) => jobTitle.family === family),
}));

type Props = { value: string | null; onChange: (jobTitleId: string) => void; disabled: boolean };

/** The job title is picked from the catalog before starting (docs/decisioni.md): the agent does not diagnose it. */
export function RolePicker({ value, onChange, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const selected = value ? findJobTitle(value) : undefined;

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  function pick(jobTitleId: string) {
    onChange(jobTitleId);
    setOpen(false);
  }

  return (
    <div ref={root} className="relative flex flex-col gap-1.5">
      <span id={LABEL_ID} className="text-[13px] font-medium text-body">
        Ruolo
      </span>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={LABEL_ID}
        className={`flex min-h-12 w-full cursor-pointer items-center justify-between gap-3 rounded-lg border bg-white px-3.5 text-left text-base disabled:cursor-not-allowed ${open ? "border-accent ring-3 ring-accent-tint" : "border-border"}`}
      >
        {selected ? (
          <span className="inline-flex items-center gap-2.5">
            <span className="font-medium text-foreground">{selected.name}</span>
            <span className="rounded-full bg-accent-tint px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
              {selected.family}
            </span>
          </span>
        ) : (
          <span className="text-muted-foreground">Scegli il job title</span>
        )}
        <ChevronDownIcon size={18} className="text-muted-foreground" />
      </button>
      {open && (
        <div
          role="listbox"
          aria-labelledby={LABEL_ID}
          className="absolute top-full right-0 left-0 z-10 mt-2 grid grid-cols-5 gap-3 rounded-xl border border-border bg-white p-4 shadow-[0_20px_40px_-18px_#062e3a55]"
        >
          {FAMILIES.map(({ family, jobTitles }) => (
            <div key={family} className="flex flex-col gap-0.5">
              <span className="px-2 pb-1.5 text-[11px] font-semibold tracking-[0.08em] text-body-soft uppercase">{family}</span>
              {jobTitles.map((jobTitle) => {
                const isSelected = jobTitle.id === value;
                return (
                  <button
                    key={jobTitle.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => pick(jobTitle.id)}
                    className={`min-h-11 cursor-pointer rounded-lg px-2 py-2 text-left text-sm leading-tight ${isSelected ? "bg-accent-tint font-medium text-accent-foreground" : "text-foreground hover:bg-surface"}`}
                  >
                    {jobTitle.name}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
