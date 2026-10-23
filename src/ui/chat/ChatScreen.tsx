"use client";

import Link from "next/link";
import { LogoMark } from "@/ui/brand";
import { ErrorNotice } from "@/ui/ErrorNotice";
import { PreviewPane } from "@/ui/preview/PreviewPane";
import { ChatInput } from "./ChatInput";
import { ChecklistMenu } from "./ChecklistMenu";
import { ExportMenu } from "./ExportMenu";
import { MessageList, PendingTurn } from "./MessageList";
import { useChatSession, type ChatSession } from "./useChatSession";

export function ChatScreen({ sessionId }: { sessionId: string }) {
  return <ChatLayout session={useChatSession(sessionId)} />;
}

/**
 * Chat screen: header (checklist, export), chat column on the left, posting preview on the right.
 * Before the first view arrives, a pending turn shows the message being answered.
 */
export function ChatLayout({ session }: { session: ChatSession }) {
  const { view, pendingText, error, sendMessage, sendQuickReply } = session;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-surface print:h-auto print:overflow-visible print:bg-white">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-white px-6 py-3 print:hidden">
        <Link href="/" aria-label="Torna alla home" className="inline-flex items-center">
          <LogoMark />
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          {view && <ChecklistMenu checklist={view.checklist} />}
          <ExportMenu posting={view?.posting ?? null} />
        </div>
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden print:block print:overflow-visible">
        <section
          aria-label="Chat"
          className="flex h-full min-h-0 max-w-[520px] min-w-0 flex-[1_1_420px] flex-col overflow-hidden border-r border-border bg-white print:hidden"
        >
          {view ? (
            <MessageList view={view} pendingText={pendingText} onQuickReply={sendQuickReply} />
          ) : (
            <div className="flex min-h-0 flex-1 flex-col justify-end gap-3 px-6 py-5 text-sm text-muted-foreground">
              {pendingText !== null ? <PendingTurn text={pendingText} /> : error === null && "Caricamento della conversazione…"}
            </div>
          )}
          {error && (
            <div className="px-6 pb-3">
              <ErrorNotice message={error}>
                {view === null && (
                  <>
                    {" "}
                    <Link href="/">Torna alla home</Link>
                  </>
                )}
              </ErrorNotice>
            </div>
          )}
          <ChatInput disabled={view === null || pendingText !== null} onSend={sendMessage} />
        </section>

        <PreviewPane posting={view?.posting ?? null} sheet={view?.sheet ?? null} pending={view?.postingPending ?? false} />
      </div>
    </div>
  );
}
