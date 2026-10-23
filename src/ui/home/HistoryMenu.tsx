"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { SessionSummary } from "@/api/contract";
import { ApiClientError, listSessions } from "@/ui/api/client";
import { HistoryIcon } from "@/ui/icons";

type State = { kind: "loading" } | { kind: "ready"; sessions: SessionSummary[] } | { kind: "error"; message: string };

const DATE = new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

function SessionItem({ session }: { session: SessionSummary }) {
  return (
    <li>
      <Link
        href={`/chat/${session.sessionId}`}
        className="flex min-h-11 flex-col gap-0.5 rounded-lg px-3 py-2 no-underline hover:bg-surface focus-visible:bg-surface"
      >
        <span className="text-[13px] font-semibold text-foreground">{session.title ?? "Ruolo da definire"}</span>
        <span className="flex justify-between gap-3 text-xs text-muted-foreground">
          <span>
            {session.companyName ? `${session.companyName} · ` : ""}
            {DATE.format(new Date(session.updatedAt))}
          </span>
          <span className={session.complete ? "font-semibold text-accent-foreground" : undefined}>
            {session.complete ? "🎉 JD pronta" : `Checklist ${session.doneCount} di ${session.totalCount}`}
          </span>
        </span>
      </Link>
    </li>
  );
}

function Body({ state }: { state: State }) {
  if (state.kind === "loading") return <p className="m-0 px-3 py-2 text-[13px] text-muted-foreground">Caricamento…</p>;
  if (state.kind === "error") return <p className="m-0 px-3 py-2 text-[13px] text-red-700">{state.message}</p>;
  if (state.sessions.length === 0) {
    return <p className="m-0 px-3 py-2 text-[13px] text-muted-foreground">Non hai ancora iniziato nessuna JD.</p>;
  }
  return (
    <ul className="m-0 flex max-h-[360px] list-none flex-col overflow-y-auto p-0">
      {state.sessions.map((session) => (
        <SessionItem key={session.sessionId} session={session} />
      ))}
    </ul>
  );
}

/** "Le tue JD": the chats started from this browser, loaded each time the widget opens. */
export function HistoryMenu() {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<State>({ kind: "loading" });
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    let active = true;
    listSessions()
      .then((list) => active && setState({ kind: "ready", sessions: list.sessions }))
      .catch((error: unknown) => {
        const message = error instanceof ApiClientError ? error.message : "Qualcosa è andato storto. Riprova tra poco.";
        if (active) setState({ kind: "error", message });
      });
    const close = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent ? event.key === "Escape" : !root.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      active = false;
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const toggle = () => {
    if (!open) setState({ kind: "loading" });
    setOpen(!open);
  };

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#cfe3ea] bg-white px-3.5 text-[13px] font-medium text-primary hover:bg-accent-tint"
      >
        <HistoryIcon />
        Le tue JD
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="Le tue JD"
          className="absolute top-[52px] right-0 z-10 flex w-[340px] flex-col gap-1 rounded-xl border border-border bg-white p-2 shadow-[0_12px_32px_-12px_#062e3a40]"
        >
          <p className="m-0 px-3 pt-1.5 pb-1 text-[13px] font-semibold text-foreground">Le tue JD</p>
          <Body state={state} />
        </div>
      )}
    </div>
  );
}
