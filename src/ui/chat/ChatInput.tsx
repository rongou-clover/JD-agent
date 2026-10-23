"use client";

import { useState, type FormEvent, type KeyboardEvent } from "react";
import { MAX_INPUT_CHARS } from "@/agents/extractor/schema";
import { ArrowRightIcon } from "@/ui/icons";

type Props = {
  disabled: boolean;
  /** Resolves to false when the turn failed: the text goes back into the field. */
  onSend: (text: string) => Promise<boolean>;
};

/** The reply field fixed at the bottom of the chat column. Enter sends, Shift+Enter adds a line. */
export function ChatInput({ disabled, onSend }: Props) {
  const [text, setText] = useState("");
  const canSend = !disabled && text.trim() !== "";

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    if (!canSend) return;
    const sent = text;
    setText("");
    if (!(await onSend(sent))) setText(sent);
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void submit();
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-none flex-col gap-2 border-t border-border bg-white px-6 pt-3 pb-4">
      <div className="flex items-end gap-2 rounded-xl border border-border bg-white py-2 pr-2 pl-3.5 focus-within:border-primary">
        <textarea
          aria-label="Messaggio"
          rows={2}
          maxLength={MAX_INPUT_CHARS}
          placeholder="Rispondi o chiedi una modifica…"
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={onKeyDown}
          className="flex-1 resize-none border-none bg-transparent text-sm leading-normal text-foreground outline-none placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          aria-label="Invia"
          disabled={!canSend}
          className="inline-flex size-11 flex-none cursor-pointer items-center justify-center rounded-lg bg-primary text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ArrowRightIcon size={18} />
        </button>
      </div>
    </form>
  );
}
