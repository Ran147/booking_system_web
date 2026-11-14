import { httpsCallable } from "firebase/functions";
import type * as FirebaseFunctionsModule from "firebase/functions";
import { FUNCTION_NAME, HTTP_STATUS } from "@/constants";
import { callFunction } from "../callFunction";
import { executeClientFunctionsFallback } from "../clientFunctionsFallback";
import { readAuthorizationHeader } from "../readAuthorizationHeader";

vi.mock("firebase/functions", async (importOriginal) => {
  const originalModule = await importOriginal<typeof FirebaseFunctionsModule>();
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
