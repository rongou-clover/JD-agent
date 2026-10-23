import { ChatRequest } from "@/api/contract";
import { apiError, failureResponse } from "@/server/api-errors";
import { hasAccess } from "@/server/require-access";
import { chatDeps } from "@/server/chat-deps";
import { currentClientId } from "@/server/client-id";
import { handleChat } from "@/server/chat-service";
import { readJson } from "@/server/read-json";

export async function POST(request: Request) {
  if (!(await hasAccess())) return apiError("unauthorized");
  const parsed = ChatRequest.safeParse(await readJson(request));
  if (!parsed.success) return apiError("invalidRequest");
  try {
    return Response.json(await handleChat(parsed.data, chatDeps(), await currentClientId()));
  } catch (error) {
    return failureResponse(error);
  }
}
