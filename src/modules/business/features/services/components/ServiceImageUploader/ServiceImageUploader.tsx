import { Trash2, UploadCloud } from "lucide-react";
import {
  useId,
  useRef,
  type ChangeEvent,
  type DragEvent,
  type KeyboardEvent,
  type ReactElement,
} from "react";
import { useTranslation } from "react-i18next";
import { Button, Image, Input } from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import {
  KEYBOARD_KEY,
  SERVICE_IMAGE_LIMIT,
} from "@/modules/business/features/services";
import { cn } from "@/utils/cn";
import type { ServiceImageUploaderProps } from "./types";

export const ServiceImageUploader = ({
  disabled = false,
  errorMessage,
  onFileSelect,
  onRemoveImage,
  previewUrl,
}: ServiceImageUploaderProps): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.BUSINESS);
  const inputIdentifier = useId();
  const fileInputReference = useRef<HTMLInputElement>(null);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const selectedFile = event.target.files?.[0] ?? null;
    onFileSelect(selectedFile);
    if (fileInputReference.current) {
      fileInputReference.current.value = "";
    }
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    if (!disabled) {
      event.currentTarget.dataset.dragOver = "true";
    }
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    delete event.currentTarget.dataset.dragOver;
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    delete event.currentTarget.dataset.dragOver;
    if (disabled) return;
    const droppedFile = event.dataTransfer.files?.[0] ?? null;
    onFileSelect(droppedFile);
  };

  const handleTriggerClick = (): void => {
    if (!disabled && fileInputReference.current) {
      fileInputReference.current.click();
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (disabled) return;
    if (event.key === KEYBOARD_KEY.ENTER || event.key === KEYBOARD_KEY.SPACE) {
      event.preventDefault();
      handleTriggerClick();
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <span className="text-xs font-medium tracking-wide text-foreground">
        {t("services.form.imageLabel")}
      </span>

      {previewUrl ? (
        <div className="relative group rounded-xl overflow-hidden border border-border bg-card p-2 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-16 w-16 rounded-lg overflow-hidden shrink-0 border border-border bg-muted flex items-center justify-center">
              <Image
                alt={t("services.form.imagePreviewAlt")}
                className="h-full w-full object-cover"
                src={previewUrl}
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium text-foreground truncate">
                {t("services.form.imagePreviewAlt")}
              </span>
              <span className="text-xs text-muted-foreground">
                {t("services.form.imageHelp")}
              </span>
            </div>
          </div>

          <Button
            ariaLabel={t("services.form.imageRemoveAction")}
            disabled={disabled}
            leftIcon={Trash2}
            onClick={onRemoveImage}
            size="sm"
            type="button"
            variant="destructive"
          >
            {t("services.form.imageRemoveAction")}
          </Button>
        </div>
      ) : (
        <div
          aria-disabled={disabled}
          className={cn(
            "relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition-colors cursor-pointer",
            "border-border hover:border-primary/60 bg-muted/20 data-[drag-over=true]:border-primary data-[drag-over=true]:bg-primary/5",
            disabled && "opacity-50 cursor-not-allowed pointer-events-none",
            errorMessage && "border-destructive bg-destructive/5",
          )}
          onClick={handleTriggerClick}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onKeyDown={handleKeyDown}
          role="button"
          tabIndex={disabled ? -1 : 0}
        >
          <Input
            accept={SERVICE_IMAGE_LIMIT.ALLOWED_MIME_TYPES.join(",")}
            className="sr-only"
            disabled={disabled}
            id={inputIdentifier}
            onChange={handleInputChange}
            ref={fileInputReference}
            type="file"
          />

          <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <UploadCloud className="h-6 w-6 group-data-[drag-over=true]:scale-110 transition-transform" />
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              {t("services.form.imageUploadPrompt")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("services.form.imageHelp")}
            </p>
          </div>
        </div>
      )}

      {errorMessage && (
        <p className="text-xs font-medium text-destructive mt-0.5">
          {errorMessage}
        </p>
      )}
    </div>
  );
};
