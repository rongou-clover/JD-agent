import type { SessionList } from "@/api/contract";
import { getDb } from "@/db/client";
import { listSessions } from "@/db/sessions-repo";
import { apiError, failureResponse } from "@/server/api-errors";
import { currentClientId } from "@/server/client-id";
import { hasAccess } from "@/server/require-access";
import { toSessionSummary } from "@/server/session-summary";

export async function GET() {
  if (!(await hasAccess())) return apiError("unauthorized");
  const clientId = await currentClientId();
  if (clientId === null) return Response.json({ sessions: [] } satisfies SessionList);
  try {
    const rows = await listSessions(getDb(), clientId);
    return Response.json({ sessions: rows.map(toSessionSummary) } satisfies SessionList);
  } catch (error) {
    return failureResponse(error);
  }
}
