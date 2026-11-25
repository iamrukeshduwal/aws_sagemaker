// Fake detections for building/testing the UI without AWS (USE_MOCK=true).
import type { PredictionResponse } from "@/types/detection";

export async function mockDetect(width: number, height: number): Promise<PredictionResponse> {
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
