import type { ReactElement } from "react";
import type { RecaptchaFieldProps } from "./models/recaptchaField.model";
import { useRecaptchaWidget } from "./useRecaptchaWidget";

// Presentational: the parent keeps the token and decides when to reset it.
// min-h keeps the form from jumping while Google's iframe loads.
export const RecaptchaField = ({
  label,
  language,
  onTokenChange,
  resetSignal,
  siteKey,
}: RecaptchaFieldProps): ReactElement => {
  const containerReference = useRecaptchaWidget({
    language,
    onTokenChange,
    resetSignal,
    siteKey,
  });

  return (
    <div aria-label={label} className="min-h-[78px]" role="group">
      <div ref={containerReference} />
    </div>
  );
};
