import { RECAPTCHA } from "@/constants";
import type { NullableRef } from "@/types";
import { RECAPTCHA_FIELD_ERROR } from "./constants/recaptchaField.constants";
import type { RecaptchaApi } from "./models/recaptchaField.model";

// One script per page, shared by every RecaptchaField. A failed load is
// forgotten so the next widget can try again.
let recaptchaApiPromise: NullableRef<Promise<RecaptchaApi>> = null;

const buildScriptUrl = (language: string): string => {
  const scriptParameters = new URLSearchParams({
    [RECAPTCHA.SCRIPT_PARAM.LANGUAGE]: language,
    [RECAPTCHA.SCRIPT_PARAM.ONLOAD]: RECAPTCHA.ONLOAD_CALLBACK_NAME,
    [RECAPTCHA.SCRIPT_PARAM.RENDER]: RECAPTCHA.RENDER_MODE,
  });
  return `${RECAPTCHA.SCRIPT_URL}?${scriptParameters.toString()}`;
};

export const loadRecaptchaScript = (
  language: string,
): Promise<RecaptchaApi> => {
  if (recaptchaApiPromise) return recaptchaApiPromise;

  recaptchaApiPromise = new Promise<RecaptchaApi>((resolve, reject) => {
    window[RECAPTCHA.ONLOAD_CALLBACK_NAME] = (): void => {
      if (window.grecaptcha) resolve(window.grecaptcha);
    };

    const scriptElement = document.createElement("script");
    scriptElement.async = true;
    scriptElement.src = buildScriptUrl(language);
    scriptElement.onerror = (): void => {
      recaptchaApiPromise = null;
      scriptElement.remove();
      reject(new Error(RECAPTCHA_FIELD_ERROR.SCRIPT_NOT_LOADED));
    };
    document.head.append(scriptElement);
  });

  return recaptchaApiPromise;
};
