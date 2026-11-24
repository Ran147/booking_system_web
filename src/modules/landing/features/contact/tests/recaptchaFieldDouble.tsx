import type { ReactElement } from "react";
import type { RecaptchaFieldProps } from "@/components/common";
import { testI18n } from "@/test-utils/testI18n";

export const RECAPTCHA_TEST_TOKEN = "recaptcha-token";

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
    {testI18n.t("landing:contact.form.recaptchaLabel")}
  </button>
);
