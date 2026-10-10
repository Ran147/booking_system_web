import { useEffect, useEffectEvent, useRef, type RefObject } from "react";
import type { NullableRef } from "@/types";
import { loadRecaptchaScript } from "./loadRecaptchaScript";
import type { UseRecaptchaWidgetOptions } from "./models/recaptchaField.model";

/**
 * Carga el script de Google, pinta el widget en el contenedor devuelto y lo
 * reinicia cada vez que cambia resetSignal.
 * @returns {RefObject<NullableRef<HTMLDivElement>>} Referencia del contenedor.
 */
export const useRecaptchaWidget = ({
  language,
  onTokenChange,
  resetSignal,
  siteKey,
}: UseRecaptchaWidgetOptions): RefObject<NullableRef<HTMLDivElement>> => {
  const containerReference = useRef<NullableRef<HTMLDivElement>>(null);
  const widgetIdReference = useRef<NullableRef<number>>(null);
  const emitTokenChange = useEffectEvent(
    (recaptchaToken: NullableRef<string>): void => {
      onTokenChange(recaptchaToken);
    },
  );

  useEffect(() => {
    let isCancelled = false;

    loadRecaptchaScript(language)
      .then((recaptchaApi) => {
        const container = containerReference.current;
        if (isCancelled || !container || widgetIdReference.current !== null) {
          return;
        }
        widgetIdReference.current = recaptchaApi.render(container, {
          callback: emitTokenChange,
          "error-callback": () => emitTokenChange(null),
          "expired-callback": () => emitTokenChange(null),
          sitekey: siteKey,
        });
      })
      .catch(() => emitTokenChange(null));

    return (): void => {
      isCancelled = true;
    };
  }, [language, siteKey]);

  useEffect(() => {
    const widgetId = widgetIdReference.current;
    if (widgetId !== null) window.grecaptcha?.reset(widgetId);
  }, [resetSignal]);

  return containerReference;
};
