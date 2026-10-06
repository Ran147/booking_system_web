/**
 * @file Type definitions and props for ServiceImageUploader component.
 */

import type { Nullable } from "@/types";

/**
 * @typedef {Object} ServiceImageUploaderProps
 * @property {boolean} [disabled] - Whether file upload and removal interactions are disabled.
 * @property {Nullable<string>} [errorMessage] - Error message to display when an invalid file is selected.
 * @property {(file: Nullable<File>) => void} onFileSelect - Callback when a file is selected or dropped.
 * @property {() => void} onRemoveImage - Callback to remove the currently selected image.
 * @property {Nullable<string>} previewUrl - URL or Data URI of the image to preview.
 */
export interface ServiceImageUploaderProps {
  readonly disabled?: boolean;
  readonly errorMessage?: Nullable<string>;
  readonly onFileSelect: (file: Nullable<File>) => void;
  readonly onRemoveImage: () => void;
  readonly previewUrl: Nullable<string>;
}
