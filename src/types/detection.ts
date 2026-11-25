// Shapes of the data that flows between the browser, our API route and SageMaker.
// The response matches exactly what yolo-endpoint/code/inference.py returns.

/** [x1, y1, x2, y2] in pixels of the image that was sent */
export type BoxXYXY = [number, number, number, number];

export interface Detection {
  class: string;
  class_id: number;
  confidence: number; // 0..1
  box_xyxy: BoxXYXY;
}

export interface PredictionResponse {
  image_size: [number, number]; // [width, height]
  inference_ms: number; // model time on the endpoint
  detections: Detection[];
}

/** What the browser sends to POST /api/detect */
export interface DetectRequest {
  image: string; // base64-encoded JPEG (no "data:image/jpeg;base64," prefix)
  width: number;
  height: number;
}

/** What /api/detect returns when something goes wrong */
export interface ApiError {
  error: string;
}
