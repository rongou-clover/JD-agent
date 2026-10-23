import { z } from "zod";
import { apiError, failureResponse } from "@/server/api-errors";
import { chatDeps } from "@/server/chat-deps";
import { renderSession } from "@/server/render-service";
import { hasAccess } from "@/server/require-access";

/** Writes the posting for the last turn; the chat calls it right after the reply. */
export async function POST(_request: Request, ctx: RouteContext<"/api/sessions/[id]/render">) {
  if (!(await hasAccess())) return apiError("unauthorized");
  const id = z.uuid().safeParse((await ctx.params).id);
  if (!id.success) return apiError("sessionNotFound");
  try {
    return Response.json(await renderSession(id.data, chatDeps()));
  } catch (error) {
    return failureResponse(error);
  }
}
