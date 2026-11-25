// POST /api/detect: runs on the SERVER (your laptop in dev, Vercel in production).
// Browser sends { image: base64 JPEG, width, height } -> we call SageMaker -> return detections.
import type { DetectRequest } from "@/types/detection";
import { invokeYolo, PublicError } from "@/lib/server/sagemaker";
import { mockDetect } from "@/lib/server/mock";

export const maxDuration = 60; // seconds; serverless cold starts can take a while (Vercel Hobby max: 60)

const MAX_BASE64_LENGTH = 4_000_000; // ~3 MB image; Vercel's request limit is 4.5 MB
const USE_MOCK = process.env.USE_MOCK === "true";

export async function POST(request: Request) {
  // 1. Validate input
  let body: Partial<DetectRequest>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be JSON." }, { status: 400 });
  }

  const { image, width, height } = body;
  if (typeof image !== "string" || image.length === 0) {
    return Response.json({ error: "Missing 'image' (base64 JPEG)." }, { status: 400 });
  }
  if (image.length > MAX_BASE64_LENGTH) {
    return Response.json({ error: "Image is too large." }, { status: 413 });
  }
  if (typeof width !== "number" || typeof height !== "number") {
    return Response.json({ error: "Missing 'width'/'height'." }, { status: 400 });
  }

  // 2. Mock mode: no AWS needed (handy when the endpoint is deleted)
  if (USE_MOCK) {
    return Response.json(await mockDetect(width, height));
  }

  // 3. Real mode: base64 -> bytes -> SageMaker endpoint -> JSON
  try {
    const bytes = new Uint8Array(Buffer.from(image, "base64"));
    const result = await invokeYolo(bytes);
    return Response.json(result);
  } catch (err) {
    const e = err instanceof PublicError ? err : new PublicError("Unexpected server error.", 500);
    return Response.json({ error: e.message }, { status: e.status });
  }
}
