import { ChatRequest } from "@/api/contract";
import { apiError, failureResponse } from "@/server/api-errors";
import { chatDeps } from "@/server/chat-deps";
import { handleChat } from "@/server/chat-service";
import { readJson } from "@/server/read-json";

export async function POST(request: Request) {
  const parsed = ChatRequest.safeParse(await readJson(request));
  if (!parsed.success) return apiError("invalidRequest");
  try {
    return Response.json(await handleChat(parsed.data, chatDeps()));
  } catch (error) {
    return failureResponse(error);
  }
}
