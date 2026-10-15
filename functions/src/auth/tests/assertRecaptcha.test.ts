import { HttpsError } from "firebase-functions/v2/https";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RECAPTCHA_VERIFICATION } from "../../shared/constants/Recaptcha.constants.js";
import { assertRecaptcha } from "../assertRecaptcha.js";

// Google's verify endpoint is replaced with a stub: these tests need no
// network and no emulator.

const captureError = async (
  pendingCall: Promise<unknown>,
): Promise<unknown> => {
  try {
    await pendingCall;
  } catch (error) {
    return error;
  }
  throw new Error("Expected the call to fail");
};

const answerWith = (verificationResult: unknown): void => {
  vi.mocked(fetch).mockResolvedValue(Response.json(verificationResult));
};

describe("assertRecaptcha", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    vi.stubEnv(
      RECAPTCHA_VERIFICATION.EMULATOR_ENV_VAR,
      RECAPTCHA_VERIFICATION.EMULATOR_FLAG_ENABLED,
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("KAN-25: accepts a token Google approves, using the test secret in the emulator (AC-KAN-25-08)", async () => {
    answerWith({ success: true });

    await expect(assertRecaptcha("recaptcha-token")).resolves.toBeUndefined();

    const [verifyUrl, requestInit] = vi.mocked(fetch).mock.calls[0] ?? [];
    const requestBody = new URLSearchParams(String(requestInit?.body));
    expect(verifyUrl).toBe(RECAPTCHA_VERIFICATION.VERIFY_URL);
    expect(requestBody.get(RECAPTCHA_VERIFICATION.FORM_FIELD.RESPONSE)).toBe(
      "recaptcha-token",
    );
    expect(requestBody.get(RECAPTCHA_VERIFICATION.FORM_FIELD.SECRET)).toBe(
      RECAPTCHA_VERIFICATION.TEST_SECRET_KEY,
    );
  });

  it("KAN-25: fails with permission-denied when Google rejects the token (AC-KAN-25-08)", async () => {
    answerWith({ success: false });

    const error = await captureError(assertRecaptcha("used-token"));

    expect(error).toBeInstanceOf(HttpsError);
    expect((error as HttpsError).code).toBe("permission-denied");
  });

  it.each([
    [
      "the network fails",
      (): void => {
        vi.mocked(fetch).mockRejectedValue(new TypeError("fetch failed"));
      },
    ],
    [
      "Google answers with an error status",
      (): void => {
        vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 503 }));
      },
    ],
  ])(
    "KAN-25: fails with unavailable when %s (AC-KAN-25-08)",
    async (_caseName, prepareFetch) => {
      prepareFetch();

      const error = await captureError(assertRecaptcha("recaptcha-token"));

      expect(error).toBeInstanceOf(HttpsError);
      expect((error as HttpsError).code).toBe("unavailable");
    },
  );
});
