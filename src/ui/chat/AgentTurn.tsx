import type { AgentMessage, QuickReply } from "@/api/contract";
import { RichText } from "@/ui/text/RichText";

type Props = {
  message: AgentMessage;
  /** Quick replies are valid only on the last agent turn and only while no turn is pending. */
  onQuickReply: ((reply: QuickReply) => void) | null;
  /** Required checklist items still missing, shown as a chip under the last agent turn. */
  missingCount: number | null;
};

function missingLabel(count: number): string {
  return count === 1 ? "Manca 1 voce obbligatoria" : `Mancano ${count} voci obbligatorie`;
}

export function AgentTurn({ message, onQuickReply, missingCount }: Props) {
  return (
    <div className="flex max-w-[90%] flex-col gap-2.5 self-start">
      <div className="rounded-[14px_14px_14px_4px] border border-[#eef0f2] bg-surface px-3.5 py-3 text-sm leading-[1.55] whitespace-pre-line">
        <RichText text={message.text} />
        {message.questions.length === 1 && (
          <p className="m-0 mt-1">
            <RichText text={message.questions[0] ?? ""} />
          </p>
        )}
        {message.questions.length > 1 && (
          <ol className="m-0 mt-1 list-decimal pl-5">
            {message.questions.map((question) => (
              <li key={question}>
                <RichText text={question} />
              </li>
            ))}
          </ol>
        )}
      </div>
      {onQuickReply && message.quickReplies.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {message.quickReplies.map((reply, index) => (
            <button
              key={reply.id}
              type="button"
              onClick={() => onQuickReply(reply)}
              className={`min-h-9 cursor-pointer rounded-full border bg-white px-3 text-[13px] hover:bg-accent-tint ${
                index === 0 ? "border-accent text-accent-foreground" : "border-border text-body"
              }`}
            >
              {reply.label}
            </button>
          ))}
        </div>
      )}
      {missingCount !== null && missingCount > 0 && (
        <span className="self-start rounded-full bg-accent-tint px-2.5 py-1 text-xs text-accent-foreground">
          {missingLabel(missingCount)}
        </span>
      )}
    </div>
  );
}
