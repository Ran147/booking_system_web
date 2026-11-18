import { FunctionsError, httpsCallable } from "firebase/functions";
import type * as FirebaseFunctions from "firebase/functions";
import { FUNCTION_NAME, HTTP_STATUS } from "@/constants";
import { callFunction } from "../callFunction";
import { executeClientFunctionsFallback } from "../clientFunctionsFallback";
import { readAuthorizationHeader } from "../readAuthorizationHeader";

vi.mock("firebase/functions", async (importOriginal) => {
  const originalModule = await importOriginal<typeof FirebaseFunctions>();
  return { ...originalModule, httpsCallable: vi.fn() };
});
vi.mock("../clientFunctionsFallback", () => ({
  executeClientFunctionsFallback: vi.fn(),
}));
vi.mock("../readAuthorizationHeader", () => ({
  readAuthorizationHeader: vi.fn(),
}));

const fetchMock = vi.fn<typeof fetch>();
const callableMock = Object.assign(vi.fn(), { stream: vi.fn() });

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

describe("callFunction server errors", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("VITEST", "");
    vi.stubGlobal("fetch", fetchMock);
    vi.mocked(readAuthorizationHeader).mockResolvedValue({
      Authorization: "Bearer test-token",
    });
    vi.mocked(httpsCallable).mockReturnValue(callableMock);
    callableMock.mockResolvedValue({ ["data"]: { isAvailable: true } });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it.each([
    [
      "JSON",
      JSON.stringify({
        code: "internal",
        message: "Unexpected server failure",
      }),
    ],
    ["HTML", "<html>Server failure</html>"],
  ])(
    "KAN-199: preserves an unexpected HTTP 500 %s error without another execution",
    async (_responseFormat, responseBody) => {
      fetchMock.mockResolvedValue(
        new Response(responseBody, {
          status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        }),
      );
      await expect(
        callFunction(FUNCTION_NAME.CHECK_BUSINESS_SLUG, { slug: "business" }),
      ).rejects.toMatchObject({ code: "functions/internal" });
      expect(httpsCallable).not.toHaveBeenCalled();
      expect(executeClientFunctionsFallback).not.toHaveBeenCalled();
    },
  );

  it("KAN-199: uses the callable when server credentials are missing", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          code: "internal",
          message: "Firebase credentials not found",
        }),
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
      ),
    );
    await expect(
      callFunction(FUNCTION_NAME.CHECK_BUSINESS_SLUG, { slug: "business" }),
    ).resolves.toEqual({ isAvailable: true });
    expect(callableMock).toHaveBeenCalledWith({ slug: "business" });
  });

  it("KAN-199: sends the current authentication header to the backend", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ isAvailable: true }), {
        status: HTTP_STATUS.OK,
      }),
    );
    await callFunction(FUNCTION_NAME.CHECK_BUSINESS_SLUG, { slug: "business" });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/callFunction",
      expect.objectContaining({
        headers: {
          Authorization: "Bearer test-token",
          "Content-Type": "application/json",
        },
      }),
    );
  });
});

describe("callFunction client fallback (US-36)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(readAuthorizationHeader).mockResolvedValue({});
  });

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
