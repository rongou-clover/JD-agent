"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { QuickReply, SessionView } from "@/api/contract";
import { ApiClientError, getSession, loginUrl, sendChat } from "@/ui/api/client";

export type ChatSession = {
  view: SessionView | null;
  /** Text of the user turn the agent is answering, shown as an optimistic bubble. */
  pendingText: string | null;
  error: string | null;
  sendMessage: (text: string) => Promise<boolean>;
  sendQuickReply: (reply: QuickReply) => Promise<boolean>;
};

/** Loads the session, sends turns and maps API errors (unauthorized → login page, others → inline message). */
export function useChatSession(sessionId: string): ChatSession {
  const router = useRouter();
  const pathname = usePathname();
  const [view, setView] = useState<SessionView | null>(null);
  const [pendingText, setPendingText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleError = useCallback(
    (caught: unknown) => {
      if (!(caught instanceof ApiClientError)) throw caught;
      if (caught.code === "unauthorized") router.replace(loginUrl(pathname));
      else setError(caught.message);
    },
    [router, pathname],
  );

  useEffect(() => {
    let active = true;
    getSession(sessionId).then(
      (loaded) => active && setView(loaded),
      (caught: unknown) => active && handleError(caught),
    );
    return () => {
      active = false;
    };
  }, [sessionId, handleError]);

  const send = useCallback(
    async (optimisticText: string, request: () => Promise<SessionView>): Promise<boolean> => {
      setPendingText(optimisticText);
      setError(null);
      try {
        setView(await request());
        return true;
      } catch (caught) {
        handleError(caught);
        return false;
      } finally {
        setPendingText(null);
      }
    },
    [handleError],
  );

  const sendMessage = useCallback(
    (text: string) => send(text, () => sendChat({ kind: "message", sessionId, text })),
    [send, sessionId],
  );

  const sendQuickReply = useCallback(
    (reply: QuickReply) => send(reply.label, () => sendChat({ kind: "quickReply", sessionId, replyId: reply.id })),
    [send, sessionId],
  );

  return { view, pendingText, error, sendMessage, sendQuickReply };
}
