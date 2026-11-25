// Grab the current frame of a <video> as a small JPEG (base64) for the API.
// 640px is YOLO's native input size: smaller upload, faster round trip.

export interface CapturedFrame {
  base64: string;
  width: number;
  height: number;
}

let canvas: HTMLCanvasElement | null = null; // reused between frames

export function captureFrame(video: HTMLVideoElement, maxSide = 640, quality = 0.8): CapturedFrame {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!vw || !vh) throw new Error("Video is not ready yet.");

  const scale = Math.min(1, maxSide / Math.max(vw, vh));
  const width = Math.round(vw * scale);
  const height = Math.round(vh * scale);

  canvas ??= document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser could not capture video frames.");
  ctx.drawImage(video, 0, 0, width, height);

  return { base64: canvas.toDataURL("image/jpeg", quality).split(",")[1], width, height };
}
