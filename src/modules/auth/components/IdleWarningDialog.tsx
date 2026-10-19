import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Button, Modal } from "@/components/common";
import { IDLE_SESSION } from "../constants/IdleSession.constants";
import { useIdleWarningDialogFocus } from "../hooks/useIdleWarningDialogFocus";
import type { IdleWarningDialogProps } from "../models/idleSession.model";

// Screen readers hear the countdown every 10 seconds, and every second in the
// last 5, instead of every tick (US-38, D-7).
const resolveAnnouncedSeconds = (remainingSeconds: number): number =>
  remainingSeconds <= IDLE_SESSION.ANNOUNCE_EACH_SECOND_BELOW
    ? remainingSeconds
    : Math.ceil(remainingSeconds / IDLE_SESSION.ANNOUNCE_EVERY_SECONDS) *
      IDLE_SESSION.ANNOUNCE_EVERY_SECONDS;

export const IdleWarningDialog = ({
  onSignOut,
  onStayConnected,
  remainingSeconds,
}: IdleWarningDialogProps): ReactElement => {
  const { t } = useTranslation();
  const stayConnectedReference = useIdleWarningDialogFocus();

  return (
    <Modal
      isOpen
      maxWidth="sm"
      onClose={onStayConnected}
      title={t("auth.idle.warningTitle")}
    >
      <div className="flex flex-col gap-4">
        <p aria-hidden="true" className="text-sm text-foreground">
          {t("auth.idle.warningMessage", { count: remainingSeconds })}
        </p>
        <p aria-live="polite" className="sr-only">
          {t("auth.idle.warningMessage", {
            count: resolveAnnouncedSeconds(remainingSeconds),
          })}
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button onClick={onSignOut} type="button" variant="outline">
            {t("auth.idle.signOutAction")}
          </Button>
          <Button
            onClick={onStayConnected}
            ref={stayConnectedReference}
            type="button"
          >
            {t("auth.idle.stayConnectedAction")}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
