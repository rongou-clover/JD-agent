import { z } from "zod";
import { getDb } from "@/db/client";
import { apiError, failureResponse } from "@/server/api-errors";
import { getSessionView } from "@/server/chat-service";

export async function GET(_request: Request, ctx: RouteContext<"/api/sessions/[id]">) {
  const id = z.uuid().safeParse((await ctx.params).id);
  if (!id.success) return apiError("sessionNotFound");
  try {
    return Response.json(await getSessionView(getDb(), id.data));
  } catch (error) {
    return failureResponse(error);
  }
}
