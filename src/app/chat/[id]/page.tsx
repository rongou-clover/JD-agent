import { Suspense } from "react";
import { ChatScreen } from "@/ui/chat/ChatScreen";

export default function ChatPage({ params }: PageProps<"/chat/[id]">) {
  return (
    <Suspense fallback={<div className="h-screen bg-surface" />}>
      {params.then(({ id }) => (
        <ChatScreen sessionId={id} />
      ))}
    </Suspense>
  );
}
