import type { UploadedFile } from "@/types";

export const MAX_ASSETS = 8;
const MAX_FILE_BYTES = 15 * 1024 * 1024;
const MAX_DIMENSION = 1280; // matches the video width; also keeps Claude image tokens low
const ACCEPTED = ["image/png", "image/jpeg", "image/webp"];

// Screenshots never leave the browser except as image input to the Anthropic API.
export async function prepareImage(file: File): Promise<UploadedFile> {
  if (!ACCEPTED.includes(file.type)) throw new Error(`${file.name}: only PNG, JPEG or WebP`);
  if (file.size > MAX_FILE_BYTES) throw new Error(`${file.name}: larger than 15 MB`);

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  return {
    id: `img_${crypto.randomUUID().slice(0, 8)}`,
    name: file.name,
    url: canvas.toDataURL("image/jpeg", 0.85),
    mediaType: "image/jpeg",
  };
}
