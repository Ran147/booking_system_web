// A failure a callable handler reports with an HttpsError code (Q8). Handlers
// stay free of firebase-functions so the Vercel dispatcher (api/) can run the
// same code; the onCall wrappers turn it into an HttpsError with toHttpsError.
export type CallableFailureCode =
  | "already-exists"
  | "failed-precondition"
  | "invalid-argument"
  | "not-found"
  | "permission-denied"
  | "unauthenticated"
  | "unavailable";

export class CallableFailure extends Error {
  public readonly code: CallableFailureCode;
  public readonly details?: Readonly<Record<string, unknown>>;

  public constructor(
    code: CallableFailureCode,
    message: string,
    details?: Readonly<Record<string, unknown>>,
  ) {
    super(message);
    this.name = "CallableFailure";
    this.code = code;
    this.details = details;
  }
}
