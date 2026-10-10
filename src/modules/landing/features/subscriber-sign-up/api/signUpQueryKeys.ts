const SIGN_UP_QUERY_KEY_ROOT = "subscriberSignUp";

export const signUpQueryKeys = {
  all: [SIGN_UP_QUERY_KEY_ROOT] as const,
  businessSlug: (
    signUpToken: string,
    businessSlug: string,
  ): readonly [string, string, string, string] =>
    [
      SIGN_UP_QUERY_KEY_ROOT,
      "businessSlug",
      signUpToken,
      businessSlug,
    ] as const,
  link: (signUpToken: string): readonly [string, string, string] =>
    [SIGN_UP_QUERY_KEY_ROOT, "link", signUpToken] as const,
};
