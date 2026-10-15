import type { ReactElement } from "react";
import type { RecaptchaFieldProps } from "@/shared/components";
// Imported directly: the test-utils barrel loads the components this double
// replaces, and the mock would wait on itself.
import { testI18n } from "@/test-utils/testI18n";

export const RECAPTCHA_TEST_TOKEN = "recaptcha-token";

// Google's widget cannot run in jsdom: this double emits a token on click and
// exposes the reset signal it received. Tests load it with
// vi.mock("@/components/common/recaptcha-field").
export const RecaptchaFieldDouble = ({
  onTokenChange,
  resetSignal,
}: Pick<
  RecaptchaFieldProps,
  "onTokenChange" | "resetSignal"
>): ReactElement => (
  <button
    data-reset-signal={resetSignal}
    onClick={() => onTokenChange(RECAPTCHA_TEST_TOKEN)}
    type="button"
  >
    {testI18n.t("landing:subscriberSignUp.form.recaptchaLabel")}
  </button>
);
