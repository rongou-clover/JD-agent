"use client";

import { useRef, type KeyboardEvent } from "react";

export const PREVIEW_TABS = ["posting", "sheet"] as const;
export type PreviewTab = (typeof PREVIEW_TABS)[number];

export const PREVIEW_TAB_LABELS: Record<PreviewTab, string> = {
  posting: "Annuncio",
  sheet: "Scheda interna",
};

export const tabId = (tab: PreviewTab) => `preview-tab-${tab}`;
export const panelId = (tab: PreviewTab) => `preview-panel-${tab}`;

/** Keys that move the selection: arrows wrap around, Home and End jump to the edges. */
const STEPS: Partial<Record<string, (index: number) => number>> = {
  ArrowLeft: (index) => (index - 1 + PREVIEW_TABS.length) % PREVIEW_TABS.length,
  ArrowRight: (index) => (index + 1) % PREVIEW_TABS.length,
  Home: () => 0,
  End: () => PREVIEW_TABS.length - 1,
};

/** "Annuncio" | "Scheda interna" above the preview: WAI-ARIA tabs, arrow keys select and focus. */
export function PreviewTabs({ selected, onSelect }: { selected: PreviewTab; onSelect: (tab: PreviewTab) => void }) {
  const buttons = useRef<Partial<Record<PreviewTab, HTMLButtonElement | null>>>({});

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const step = STEPS[event.key];
    if (!step) return;
    event.preventDefault();
    const next = PREVIEW_TABS[step(PREVIEW_TABS.indexOf(selected))];
    if (!next) return;
    onSelect(next);
    buttons.current[next]?.focus();
  }

  return (
    <div className="flex flex-none justify-center px-6 pt-3 print:hidden">
      <div
        role="tablist"
        aria-label="Contenuto dell'anteprima"
        onKeyDown={onKeyDown}
        className="flex w-full max-w-[720px] gap-1 border-b border-border"
      >
        {PREVIEW_TABS.map((tab) => {
          const active = tab === selected;
          return (
            <button
              key={tab}
              ref={(element) => {
                buttons.current[tab] = element;
              }}
              type="button"
              role="tab"
              id={tabId(tab)}
              aria-selected={active}
              aria-controls={panelId(tab)}
              tabIndex={active ? 0 : -1}
              onClick={() => onSelect(tab)}
              className={`-mb-px min-h-11 cursor-pointer border-b-2 px-4 text-sm ${
                active ? "border-accent font-medium text-primary" : "border-transparent text-muted-foreground hover:text-body"
              }`}
            >
              {PREVIEW_TAB_LABELS[tab]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
