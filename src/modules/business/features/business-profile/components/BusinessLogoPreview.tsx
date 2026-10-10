import type { ReactElement } from "react";
import { Image } from "@/components";
import type { BusinessLogoPreviewProps } from "../models";

export const BusinessLogoPreview = ({
  profile,
  removed,
}: BusinessLogoPreviewProps): ReactElement => {
  const shouldShowImage = profile.logoUrl && !removed;

  if (shouldShowImage) {
    return (
      <Image
        alt={profile.name}
        className="size-24 rounded-full border border-border object-cover"
        src={profile.logoUrl ?? ""}
      />
    );
  }

  return (
    <div
      aria-label={profile.name}
      className="flex size-24 items-center justify-center rounded-full border border-border bg-muted text-2xl font-semibold text-foreground"
      role="img"
    >
      {profile.name.slice(0, 1).toUpperCase()}
    </div>
  );
};
