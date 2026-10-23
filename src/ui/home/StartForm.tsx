"use client";

import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore, type FormEvent } from "react";
import { MAX_INPUT_CHARS } from "@/agents/extractor/schema";
import { ApiClientError, loginUrl, sendChat } from "@/ui/api/client";
import { ErrorNotice } from "@/ui/ErrorNotice";
import { ArrowRightIcon, InfoIcon } from "@/ui/icons";
import { clearDraft, loadDraft, loadRole, saveDraft } from "./draft-storage";
import { RolePicker } from "./RolePicker";

/** The stored draft is read once on the client; the server renders an empty field. */
const subscribe = () => () => {};
const emptyDraft = () => "";
const noRole = () => null;

const PLACEHOLDER =
  "Es. Startup di Milano nell'economia circolare: deve gestire LinkedIn e Instagram e girare video agli eventi.";

export function StartForm() {
  const router = useRouter();
  const storedDraft = useSyncExternalStore(subscribe, loadDraft, emptyDraft);
  const storedRole = useSyncExternalStore(subscribe, loadRole, noRole);
  const [typed, setText] = useState<string | null>(null);
  const [picked, setRole] = useState<string | null>(null);
  const text = typed ?? storedDraft;
  const jobTitleId = picked ?? storedRole;
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);

  async function start(event: FormEvent) {
    event.preventDefault();
    if (pending || text.trim() === "" || jobTitleId === null) return;
    setPending(true);
    setError(null);
    try {
      const view = await sendChat({ kind: "start", jobTitleId, text });
      clearDraft();
      router.push(`/chat/${view.sessionId}`);
    } catch (caught) {
      setPending(false);
      if (caught instanceof ApiClientError && caught.code === "unauthorized") {
        saveDraft(text, jobTitleId);
        router.push(loginUrl("/"));
      } else if (caught instanceof ApiClientError) setError(caught.message);
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
        <RolePicker value={jobTitleId} onChange={setRole} disabled={pending} />
        <div className="h-px bg-border" />
        <textarea
          aria-label="Descrivi l'azienda e la persona che cerchi"
          rows={3}
          maxLength={MAX_INPUT_CHARS}
          placeholder={PLACEHOLDER}
          value={text}
          onChange={(event) => setText(event.target.value)}
          disabled={pending}
          className="w-full resize-none border-none bg-transparent text-base leading-[1.55] text-foreground outline-none placeholder:text-muted-foreground"
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-[13px] text-muted-foreground">
            {jobTitleId === null ? "Scegli prima il ruolo" : "Puoi anche incollare una bozza o un annuncio esistente"}
          </span>
          <button
            type="submit"
            disabled={pending || text.trim() === "" || jobTitleId === null}
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
