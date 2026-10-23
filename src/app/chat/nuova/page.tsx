"use client";

import { ChatLayout } from "@/ui/chat/ChatScreen";
import { useStartSession } from "@/ui/chat/useStartSession";

/** Opened by "Inizia" right away: the first message shows as pending while the session starts. */
export default function NewChatPage() {
  return <ChatLayout session={useStartSession()} />;
}
