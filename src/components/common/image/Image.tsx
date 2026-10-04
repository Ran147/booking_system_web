import type { ReactElement } from "react";
import { cn } from "@/utils/cn";
import type { ImageProps } from "./models/image.model";

export const Image = ({
  alt,
  className,
  loading = "lazy",
  src,
  ...restProperties
}: ImageProps): ReactElement => {
  return (
    <img
      alt={alt}
      className={cn("max-w-full h-auto object-cover", className)}
      loading={loading}
      src={src}
      {...restProperties}
    />
  );
};
