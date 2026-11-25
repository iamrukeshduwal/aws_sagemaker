// Resize the chosen image in the browser before uploading.
// Smaller upload = faster request, and stays under API payload limits.

export interface PreparedImage {
  dataUrl: string; // for showing the image on the page
  base64: string; // for sending to the API
  width: number;
  height: number;
}

export const MAX_FILE_MB = 15;

export async function prepareImage(file: File, maxSide = 1280, quality = 0.9): Promise<PreparedImage> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file (JPG, PNG, WEBP).");
  }
  if (file.size > MAX_FILE_MB * 1024 * 1024) {
    throw new Error(`Image is larger than ${MAX_FILE_MB} MB.`);
  }

  // createImageBitmap also applies the photo's EXIF rotation (phone pictures)
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser could not process this image.");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const dataUrl = canvas.toDataURL("image/jpeg", quality);
  return { dataUrl, base64: dataUrl.split(",")[1], width, height };
}
