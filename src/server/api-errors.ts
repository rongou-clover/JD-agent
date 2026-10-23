import type { ApiError } from "@/api/contract";

type ApiErrorCode = ApiError["error"];

const STATUS: Record<ApiErrorCode, number> = {
  unauthorized: 401,
  invalidRequest: 400,
  sessionNotFound: 404,
  sessionBusy: 409,
  budgetExhausted: 429,
  internal: 500,
};

/** Italian copy the UI shows as is. */
export const API_ERROR_MESSAGES: Record<ApiErrorCode, string> = {
  unauthorized: "Accesso non valido: inserisci la password della demo.",
  invalidRequest: "Richiesta non valida.",
  sessionNotFound: "Questa conversazione non esiste più. Ricomincia dalla home.",
  sessionBusy: "Sto ancora lavorando al messaggio precedente. Riprova tra un attimo.",
  budgetExhausted: "La demo ha raggiunto il limite di oggi, riprova domani.",
  internal: "Qualcosa è andato storto. Riprova tra poco.",
};

export function apiError(code: ApiErrorCode, message: string = API_ERROR_MESSAGES[code]): Response {
  const body: ApiError = { error: code, message };
  return Response.json(body, { status: STATUS[code] });
}

/** Thrown by the services, turned into an ApiError response by the route handlers. */
export class ApiFailure extends Error {
  constructor(
    readonly code: ApiErrorCode,
    message: string = API_ERROR_MESSAGES[code],
  ) {
    super(message);
  }
}

export function failureResponse(error: unknown): Response {
  if (error instanceof ApiFailure) return apiError(error.code, error.message);
  console.error(error);
  return apiError("internal");
}
