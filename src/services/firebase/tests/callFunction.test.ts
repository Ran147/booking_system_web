import type * as FirebaseFunctions from "firebase/functions";
import { FunctionsError, httpsCallable } from "firebase/functions";
import { FUNCTION_NAME } from "@/constants";
import { callFunction } from "../callFunction";
import { executeClientFunctionsFallback } from "../clientFunctionsFallback";

vi.mock("firebase/functions", async (importOriginal) => ({
  ...(await importOriginal<typeof FirebaseFunctions>()),
  httpsCallable: vi.fn(),
}));

vi.mock("../clientFunctionsFallback", () => ({
  executeClientFunctionsFallback: vi.fn(),
}));

const RESET_PAYLOAD = Object.freeze({
  email: "someone@example.com",
  recaptchaToken: "expired-token",
});

// The callable answers with the given error, as when the server rejects the
// request or does not exist.
const answerCallableWith = (error: FunctionsError): void => {
  vi.mocked(httpsCallable).mockReturnValue(
    vi.fn().mockRejectedValue(error) as unknown as ReturnType<
      typeof httpsCallable
    >,
  );
};

// The fallback path only runs outside Vitest, and the Vercel endpoint is not
// reachable in these tests.
const runOutsideVitestWithoutVercel = (): void => {
  vi.stubEnv("VITEST", "");
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
};

describe("callFunction client fallback (US-36)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.mocked(executeClientFunctionsFallback).mockReset();
  });

  it("US-36: a callable that rejects on purpose keeps its error and the fallback never runs", async () => {
    runOutsideVitestWithoutVercel();
    const rejection = new FunctionsError(
      "permission-denied",
      "reCAPTCHA failed",
    );
    answerCallableWith(rejection);

    await expect(
      callFunction(FUNCTION_NAME.REQUEST_PASSWORD_RESET, RESET_PAYLOAD),
    ).rejects.toBe(rejection);
    expect(executeClientFunctionsFallback).not.toHaveBeenCalled();
  });

  it("US-36: a missing server still falls back to the client simulation", async () => {
    runOutsideVitestWithoutVercel();
    answerCallableWith(new FunctionsError("internal", "not deployed"));
    vi.mocked(executeClientFunctionsFallback).mockResolvedValue({
      isRequested: true,
    });

    await expect(
      callFunction(FUNCTION_NAME.REQUEST_PASSWORD_RESET, RESET_PAYLOAD),
    ).resolves.toEqual({ isRequested: true });
    expect(executeClientFunctionsFallback).toHaveBeenCalledWith(
      FUNCTION_NAME.REQUEST_PASSWORD_RESET,
      RESET_PAYLOAD,
    );
  });
});
