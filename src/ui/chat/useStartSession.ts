"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import type { SessionView } from "@/api/contract";
import { ApiClientError, loginUrl, sendChat } from "@/ui/api/client";
import { clearDraft, loadDraft } from "@/ui/home/draft-storage";
import { primeSession } from "./primed-session";
import type { ChatSession } from "./useChatSession";

/** Strict mode runs effects twice in development: one request per start. */
const starts = new Map<string, Promise<SessionView>>();

const subscribe = () => () => {};
const onServer = () => null;

const noop = async () => false;

/**
 * Starts the session typed in Home (kept in session storage) while the chat is already on screen.
 * On success the URL becomes /chat/<id>; on unauthorized the text waits for the login, as before.
 */
export function useStartSession(): ChatSession {
  const router = useRouter();
  const text = useSyncExternalStore(subscribe, loadDraft, onServer);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (text === null) return;
    if (text.trim() === "") {
      router.replace("/");
      return;
    }
    let active = true;
    const request = starts.get(text) ?? sendChat({ kind: "start", text });
    starts.set(text, request);
    request.then(
      (view) => {
        starts.delete(text);
        if (!active) return;
        clearDraft();
        primeSession(view);
        router.replace(`/chat/${view.sessionId}`);
      },
      (caught: unknown) => {
        starts.delete(text);
        if (!active) return;
        if (!(caught instanceof ApiClientError)) throw caught;
        if (caught.code === "unauthorized") router.replace(loginUrl("/"));
        else setError(caught.message);
      },
    );
    return () => {
      active = false;
    };
  }, [text, router]);

  return { view: null, pendingText: error === null ? text : null, error, sendMessage: noop, sendQuickReply: noop };
}
