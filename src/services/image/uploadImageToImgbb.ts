import type { NullableUndefined } from "@/types";

interface ImgbbImagePayload {
  readonly display_url?: string;
  readonly url?: string;
}

interface ImgbbUploadResponse {
  readonly ["data"]?: ImgbbImagePayload;
  readonly success?: boolean;
}

/**
 * Sube un archivo de imagen al servicio externo gratuito ImgBB.
 * Retorna la URL pública directa HTTPS de la imagen almacenada.
 *
 * @param {Blob | File} file - Archivo de imagen a subir.
 * @returns {Promise<string>} URL pública permanente de la imagen.
 */
export const uploadImageToImgbb = async (
  file: Blob | File,
): Promise<string> => {
  const apiKey = import.meta.env
    .VITE_IMGBB_API_KEY as NullableUndefined<string>;

  if (!apiKey) {
    throw new Error("Missing VITE_IMGBB_API_KEY environment variable");
  }

  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
    body: formData,
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(`ImgBB upload failed with HTTP status ${response.status}`);
  }

  const responsePayload = (await response.json()) as ImgbbUploadResponse;
  const imagePayload = responsePayload["data"];
  const directUrl = imagePayload?.display_url ?? imagePayload?.url;

  if (!responsePayload.success || !directUrl) {
    throw new Error("ImgBB upload returned unsuccessful response");
  }

  return directUrl;
};
