/** The request body as JSON, or undefined when it is not valid JSON (the Zod contract then rejects it). */
export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}
