export type ApiErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "PAYLOAD_TOO_LARGE"
  | "INTERNAL_ERROR";

export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly details?: unknown;

  constructor(status: number, code: ApiErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function jsonError(error: ApiError, requestId?: string) {
  return Response.json(
    {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details ?? null,
        requestId: requestId ?? null,
      },
    },
    { status: error.status },
  );
}

export function publicErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  return "Es ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.";
}
