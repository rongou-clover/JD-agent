import { useEffect, useRef } from "react";
import type { QuickReply, SessionView } from "@/api/contract";
import { AgentTurn } from "./AgentTurn";

type Props = {
  view: SessionView;
  pendingText: string | null;
  onQuickReply: (reply: QuickReply) => void;
};

function UserBubble({ text }: { text: string }) {
  return (
    <div className="max-w-[85%] self-end rounded-[14px_14px_4px_14px] bg-primary px-3.5 py-3 text-sm leading-[1.55] whitespace-pre-line text-white">
      {text}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div
      role="status"
      aria-label="L'agent sta scrivendo"
      className="flex gap-1 self-start rounded-[14px_14px_14px_4px] border border-[#eef0f2] bg-surface px-4 py-4"
    >
      {[0, 1, 2].map((dot) => (
        <span
          key={dot}
          className="size-1.5 rounded-full bg-muted-foreground motion-safe:animate-typing"
          style={{ animationDelay: `${dot * 0.15}s` }}
        />
      ))}
    </div>
  );
}

/** The user turn the agent is answering: optimistic bubble and typing dots. */
export function PendingTurn({ text }: { text: string }) {
  return (
    <>
      <UserBubble text={text} />
      <TypingIndicator />
    </>
  );
}

/**
 * The transcript, bottom-aligned. It scrolls inside the chat column only, and jumps to the latest turn
 * whenever a message is added (docs/decisioni.md, 2026-10-23).
 */
export function MessageList({ view, pendingText, onQuickReply }: Props) {
  const scroller = useRef<HTMLDivElement>(null);
  const lastIndex = view.transcript.length - 1;
  const missing = view.checklist.totalCount - view.checklist.doneCount;

  useEffect(() => {
    const element = scroller.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [view.transcript.length, pendingText]);

  return (
    <div ref={scroller} className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 py-5">
      <div className="mt-auto flex flex-col gap-3">
      {view.transcript.map((entry, index) =>
        entry.role === "user" ? (
          <UserBubble key={index} text={entry.text} />
        ) : (
          <AgentTurn
            key={index}
            message={entry.message}
            onQuickReply={index === lastIndex && pendingText === null ? onQuickReply : null}
            missingCount={index === lastIndex && !view.checklist.complete ? missing : null}
          />
        ),
      )}
      {pendingText !== null && <PendingTurn text={pendingText} />}
      </div>
    </div>
  );
}
