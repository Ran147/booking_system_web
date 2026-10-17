import { useEffect, useState } from "react";
import { PASSWORD_RECOVERY } from "../constants/PasswordRecovery.constants";

interface CooldownCountdown {
  readonly remainingSeconds: number;
  readonly startCooldown: () => void;
}

/**
 * Cuenta atrás en memoria: recargar la página la reinicia (US-36, D-6). No es
 * una barrera de seguridad; Firebase limita los envíos en el servidor.
 * @param {number} cooldownSeconds - Segundos que dura la espera.
 * @returns {CooldownCountdown}
 */
export const useCooldownCountdown = (
  cooldownSeconds: number,
): CooldownCountdown => {
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const isCountingDown = remainingSeconds > 0;

  useEffect(() => {
    if (!isCountingDown) return undefined;

    const intervalIdentifier = window.setInterval(() => {
      setRemainingSeconds((previousSeconds) =>
        Math.max(previousSeconds - 1, 0),
      );
    }, PASSWORD_RECOVERY.COOLDOWN_TICK_MS);

    return (): void => window.clearInterval(intervalIdentifier);
  }, [isCountingDown]);

  return {
    remainingSeconds,
    startCooldown: () => setRemainingSeconds(cooldownSeconds),
  };
};
