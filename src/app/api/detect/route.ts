// POST /api/detect: runs on the SERVER (your laptop now, Vercel later).
// STEP 2: returns fake (mock) detections so we can build the UI without AWS.
// STEP 3: we replace mockDetect() with a real call to the SageMaker endpoint.
import type { DetectRequest, PredictionResponse } from "@/types/detection";

const MAX_BASE64_LENGTH = 4_000_000; // ~3 MB image; Vercel's request limit is 4.5 MB

export async function POST(request: Request) {
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

  const result = await mockDetect(width, height);
  return Response.json(result);
}

async function mockDetect(width: number, height: number): Promise<PredictionResponse> {
  await new Promise((resolve) => setTimeout(resolve, 700)); // pretend the model is thinking
  return {
    image_size: [width, height],
    inference_ms: 0,
    detections: [
      { class: "mock-person", class_id: 0, confidence: 0.91, box_xyxy: [width * 0.1, height * 0.2, width * 0.4, height * 0.9] },
      { class: "mock-bus", class_id: 5, confidence: 0.76, box_xyxy: [width * 0.35, height * 0.1, width * 0.95, height * 0.7] },
      { class: "mock-person", class_id: 0, confidence: 0.42, box_xyxy: [width * 0.6, height * 0.4, width * 0.8, height * 0.95] },
    ],
  };
}
