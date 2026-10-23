"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { MAX_INPUT_CHARS } from "@/agents/extractor/schema";
import { ApiClientError, loginUrl, sendChat } from "@/ui/api/client";
import { ErrorNotice } from "@/ui/ErrorNotice";
import { ArrowRightIcon, InfoIcon } from "@/ui/icons";

const PLACEHOLDER =
  "Es. Cerco un social media manager per una startup di Milano: deve gestire LinkedIn e Instagram e girare video agli eventi.";

export function StartForm() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);

  async function start(event: FormEvent) {
    event.preventDefault();
    if (pending || text.trim() === "") return;
    setPending(true);
    setError(null);
    try {
      const view = await sendChat({ kind: "message", sessionId: null, text });
      router.push(`/chat/${view.sessionId}`);
    } catch (caught) {
      setPending(false);
      if (caught instanceof ApiClientError && caught.code === "unauthorized") router.push(loginUrl("/"));
      else if (caught instanceof ApiClientError) setError(caught.message);
      else throw caught;
    }
  }

  return (
    <>
      <form
        onSubmit={start}
        aria-busy={pending}
        className="mt-2 flex flex-col gap-3 rounded-xl border border-border bg-white p-4 shadow-[0_1px_2px_#1118270f,0_12px_32px_-16px_#062e3a38]"
      >
        <textarea
          aria-label="Descrivi il ruolo e la persona che cerchi"
          rows={3}
          maxLength={MAX_INPUT_CHARS}
          placeholder={PLACEHOLDER}
          value={text}
          onChange={(event) => setText(event.target.value)}
          disabled={pending}
          className="w-full resize-none border-none bg-transparent text-base leading-[1.55] text-foreground outline-none placeholder:text-muted-foreground"
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-[13px] text-muted-foreground">Puoi anche incollare una bozza o un annuncio esistente</span>
          <button
            type="submit"
            disabled={pending || text.trim() === ""}
            className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg bg-primary px-5 text-[15px] font-medium text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Un attimo…" : "Inizia"}
            <ArrowRightIcon />
          </button>
        </div>
      </form>
      {error && <ErrorNotice message={error} />}
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setInfoOpen((open) => !open)}
          aria-expanded={infoOpen}
          className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 self-start border-none bg-transparent px-1 text-sm font-medium text-primary"
        >
          <InfoIcon />
          Cosa ti serve per iniziare?
        </button>
        {infoOpen && (
          <p className="m-0 text-sm leading-relaxed text-body-soft">
            Cosa fa l&apos;azienda, perché assumete ora, cosa deve ottenere la persona nei primi 6 mesi, sede e contratto. Il
            resto te lo chiedo io.
          </p>
        )}
      </div>
    </>
  );
}
